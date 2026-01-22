"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../middleware/auth");
const xp_1 = require("../utils/xp");
const router = (0, express_1.Router)();
// Get current user profile with stats
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            include: {
                achievements: {
                    include: { achievement: true },
                    orderBy: { unlockedAt: 'desc' },
                    take: 5,
                },
                belts: {
                    include: { belt: true },
                    where: { isDisplayed: true },
                    take: 3,
                },
                progress: {
                    include: { category: true },
                },
            },
        });
        if (!user) {
            res.status(404).json({ error: { message: 'User not found' } });
            return;
        }
        // Calculate total stats
        const totalAnswers = await prisma_1.default.userAnswer.count({
            where: { userId: user.id },
        });
        const correctAnswers = await prisma_1.default.userAnswer.count({
            where: { userId: user.id, isCorrect: true },
        });
        const xpProgress = (0, xp_1.getXpProgress)(user.totalXp);
        const { passwordHash, ...userWithoutPassword } = user;
        res.json({
            user: {
                ...userWithoutPassword,
                stats: {
                    totalAnswers,
                    correctAnswers,
                    accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
                    totalBelts: await prisma_1.default.userBelt.count({ where: { userId: user.id } }),
                    totalAchievements: await prisma_1.default.userAchievement.count({ where: { userId: user.id } }),
                },
                xpProgress,
            },
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: { message: 'Failed to get profile' } });
    }
});
// Update current user profile
router.put('/me', auth_1.authenticate, [
    (0, express_validator_1.body)('displayName').optional().isLength({ min: 1, max: 50 }),
    (0, express_validator_1.body)('avatarUrl').optional().isURL(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
            return;
        }
        const { displayName, avatarUrl } = req.body;
        const user = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: {
                ...(displayName && { displayName }),
                ...(avatarUrl && { avatarUrl }),
            },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                totalXp: true,
                level: true,
                currentStreak: true,
                longestStreak: true,
            },
        });
        res.json({ user });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: { message: 'Failed to update profile' } });
    }
});
// Get public user profile by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.default.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                totalXp: true,
                level: true,
                currentStreak: true,
                longestStreak: true,
                createdAt: true,
                belts: {
                    include: { belt: true },
                    where: { isDisplayed: true },
                    take: 3,
                },
                achievements: {
                    include: { achievement: true },
                    where: { isEquipped: true },
                    take: 3,
                },
            },
        });
        if (!user) {
            res.status(404).json({ error: { message: 'User not found' } });
            return;
        }
        // Calculate public stats
        const totalAnswers = await prisma_1.default.userAnswer.count({
            where: { userId: user.id },
        });
        const correctAnswers = await prisma_1.default.userAnswer.count({
            where: { userId: user.id, isCorrect: true },
        });
        res.json({
            user: {
                ...user,
                stats: {
                    totalAnswers,
                    accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
                    totalBelts: await prisma_1.default.userBelt.count({ where: { userId: user.id } }),
                    totalAchievements: await prisma_1.default.userAchievement.count({ where: { userId: user.id } }),
                },
            },
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: { message: 'Failed to get user' } });
    }
});
// Get user progress across all categories
router.get('/me/progress', auth_1.authenticate, async (req, res) => {
    try {
        const progress = await prisma_1.default.userProgress.findMany({
            where: { userId: req.user.id },
            include: {
                category: {
                    include: {
                        _count: {
                            select: { questions: true },
                        },
                    },
                },
            },
        });
        res.json({ progress });
    }
    catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: { message: 'Failed to get progress' } });
    }
});
// Get user achievements
router.get('/:id/achievements', async (req, res) => {
    try {
        const { id } = req.params;
        const achievements = await prisma_1.default.userAchievement.findMany({
            where: { userId: id },
            include: { achievement: true },
            orderBy: { unlockedAt: 'desc' },
        });
        res.json({ achievements });
    }
    catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({ error: { message: 'Failed to get achievements' } });
    }
});
// Get user belts
router.get('/:id/belts', async (req, res) => {
    try {
        const { id } = req.params;
        const belts = await prisma_1.default.userBelt.findMany({
            where: { userId: id },
            include: { belt: true },
            orderBy: { earnedAt: 'desc' },
        });
        res.json({ belts });
    }
    catch (error) {
        console.error('Get belts error:', error);
        res.status(500).json({ error: { message: 'Failed to get belts' } });
    }
});
// Subscribe to email newsletter
router.post('/subscribe', auth_1.authenticate, async (req, res) => {
    try {
        const { email, subscribe } = req.body;
        if (!email || typeof email !== 'string') {
            res.status(400).json({ error: { message: 'Email is required' } });
            return;
        }
        // For now, just log the subscription (in production, integrate with email service)
        console.log(`Email subscription: ${email}, subscribe: ${subscribe}, user: ${req.user.id}`);
        // You could store this in a separate table or integrate with services like:
        // - Mailchimp
        // - SendGrid
        // - ConvertKit
        // For now, we'll just acknowledge the request
        res.json({ success: true, message: 'Subscription preferences saved' });
    }
    catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: { message: 'Failed to save subscription' } });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map