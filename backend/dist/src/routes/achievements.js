"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all achievements
router.get('/', async (req, res) => {
    try {
        const achievements = await prisma_1.default.achievement.findMany({
            orderBy: [{ beltTier: 'asc' }, { xpReward: 'asc' }],
        });
        res.json({ achievements });
    }
    catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({ error: { message: 'Failed to get achievements' } });
    }
});
// Get current user's achievements
router.get('/user', auth_1.authenticate, async (req, res) => {
    try {
        const userAchievements = await prisma_1.default.userAchievement.findMany({
            where: { userId: req.user.id },
            include: { achievement: true },
            orderBy: { unlockedAt: 'desc' },
        });
        // Get all achievements to show progress
        const allAchievements = await prisma_1.default.achievement.findMany();
        const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
        const achievementsWithStatus = allAchievements.map((achievement) => {
            const userAchievement = userAchievements.find((ua) => ua.achievementId === achievement.id);
            return {
                ...achievement,
                unlocked: unlockedIds.has(achievement.id),
                unlockedAt: userAchievement?.unlockedAt || null,
                isEquipped: userAchievement?.isEquipped || false,
            };
        });
        res.json({ achievements: achievementsWithStatus });
    }
    catch (error) {
        console.error('Get user achievements error:', error);
        res.status(500).json({ error: { message: 'Failed to get user achievements' } });
    }
});
// Toggle achievement equip status
router.put('/:id/equip', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userAchievement = await prisma_1.default.userAchievement.findFirst({
            where: {
                achievementId: id,
                userId: req.user.id,
            },
        });
        if (!userAchievement) {
            res.status(404).json({ error: { message: 'Achievement not unlocked' } });
            return;
        }
        // If equipping, limit to 3 equipped achievements
        if (!userAchievement.isEquipped) {
            const equippedCount = await prisma_1.default.userAchievement.count({
                where: { userId: req.user.id, isEquipped: true },
            });
            if (equippedCount >= 3) {
                res.status(400).json({
                    error: { message: 'Maximum 3 achievements can be equipped. Unequip one first.' },
                });
                return;
            }
        }
        const updated = await prisma_1.default.userAchievement.update({
            where: { id: userAchievement.id },
            data: { isEquipped: !userAchievement.isEquipped },
            include: { achievement: true },
        });
        res.json({ achievement: updated });
    }
    catch (error) {
        console.error('Toggle achievement equip error:', error);
        res.status(500).json({ error: { message: 'Failed to update achievement' } });
    }
});
exports.default = router;
//# sourceMappingURL=achievements.js.map