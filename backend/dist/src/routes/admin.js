"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All admin routes require authentication and admin role
router.use(auth_1.authenticate, auth_1.requireAdmin);
// ============ QUESTIONS ============
// Get all questions with pagination
router.get('/questions', async (req, res) => {
    try {
        const { limit = '50', offset = '0', category, difficulty, search } = req.query;
        const where = {};
        if (category) {
            where.category = { slug: category };
        }
        if (difficulty) {
            where.difficulty = difficulty;
        }
        if (search) {
            where.questionText = { contains: search, mode: 'insensitive' };
        }
        const [questions, total] = await Promise.all([
            prisma_1.default.question.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit, 10),
                skip: parseInt(offset, 10),
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                },
            }),
            prisma_1.default.question.count({ where }),
        ]);
        res.json({ questions, total });
    }
    catch (error) {
        console.error('Admin get questions error:', error);
        res.status(500).json({ error: { message: 'Failed to get questions' } });
    }
});
// Create question
router.post('/questions', [
    (0, express_validator_1.body)('categoryId').isUUID(),
    (0, express_validator_1.body)('questionText').notEmpty(),
    (0, express_validator_1.body)('difficulty').isIn(['easy', 'medium', 'hard']),
    (0, express_validator_1.body)('correctAnswer').notEmpty(),
    (0, express_validator_1.body)('answerOptions').isArray({ min: 2 }),
    (0, express_validator_1.body)('xpReward').isInt({ min: 1 }),
    (0, express_validator_1.body)('timeLimit').isInt({ min: 5 }),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
            return;
        }
        const question = await prisma_1.default.question.create({
            data: req.body,
            include: { category: true },
        });
        res.status(201).json({ question });
    }
    catch (error) {
        console.error('Admin create question error:', error);
        res.status(500).json({ error: { message: 'Failed to create question' } });
    }
});
// Update question
router.put('/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const question = await prisma_1.default.question.update({
            where: { id },
            data: req.body,
            include: { category: true },
        });
        res.json({ question });
    }
    catch (error) {
        console.error('Admin update question error:', error);
        res.status(500).json({ error: { message: 'Failed to update question' } });
    }
});
// Delete question
router.delete('/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.question.delete({ where: { id } });
        res.json({ message: 'Question deleted' });
    }
    catch (error) {
        console.error('Admin delete question error:', error);
        res.status(500).json({ error: { message: 'Failed to delete question' } });
    }
});
// Bulk import questions
router.post('/questions/bulk', async (req, res) => {
    try {
        const { questions } = req.body;
        if (!Array.isArray(questions) || questions.length === 0) {
            res.status(400).json({ error: { message: 'Questions array required' } });
            return;
        }
        const created = await prisma_1.default.question.createMany({
            data: questions,
            skipDuplicates: true,
        });
        res.status(201).json({ created: created.count });
    }
    catch (error) {
        console.error('Admin bulk import error:', error);
        res.status(500).json({ error: { message: 'Failed to import questions' } });
    }
});
// ============ CATEGORIES ============
// Create category
router.post('/categories', [
    (0, express_validator_1.body)('name').notEmpty(),
    (0, express_validator_1.body)('slug').notEmpty().matches(/^[a-z0-9-]+$/),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
            return;
        }
        const category = await prisma_1.default.quizCategory.create({
            data: req.body,
        });
        res.status(201).json({ category });
    }
    catch (error) {
        console.error('Admin create category error:', error);
        res.status(500).json({ error: { message: 'Failed to create category' } });
    }
});
// Update category
router.put('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma_1.default.quizCategory.update({
            where: { id },
            data: req.body,
        });
        res.json({ category });
    }
    catch (error) {
        console.error('Admin update category error:', error);
        res.status(500).json({ error: { message: 'Failed to update category' } });
    }
});
// ============ ACHIEVEMENTS ============
// Create achievement
router.post('/achievements', async (req, res) => {
    try {
        const achievement = await prisma_1.default.achievement.create({
            data: req.body,
        });
        res.status(201).json({ achievement });
    }
    catch (error) {
        console.error('Admin create achievement error:', error);
        res.status(500).json({ error: { message: 'Failed to create achievement' } });
    }
});
// Update achievement
router.put('/achievements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const achievement = await prisma_1.default.achievement.update({
            where: { id },
            data: req.body,
        });
        res.json({ achievement });
    }
    catch (error) {
        console.error('Admin update achievement error:', error);
        res.status(500).json({ error: { message: 'Failed to update achievement' } });
    }
});
// ============ BELTS ============
// Create belt
router.post('/belts', async (req, res) => {
    try {
        const belt = await prisma_1.default.championshipBelt.create({
            data: req.body,
        });
        res.status(201).json({ belt });
    }
    catch (error) {
        console.error('Admin create belt error:', error);
        res.status(500).json({ error: { message: 'Failed to create belt' } });
    }
});
// Update belt
router.put('/belts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const belt = await prisma_1.default.championshipBelt.update({
            where: { id },
            data: req.body,
        });
        res.json({ belt });
    }
    catch (error) {
        console.error('Admin update belt error:', error);
        res.status(500).json({ error: { message: 'Failed to update belt' } });
    }
});
// ============ USERS ============
// Get all users
router.get('/users', async (req, res) => {
    try {
        const { limit = '50', offset = '0', search } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            prisma_1.default.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit, 10),
                skip: parseInt(offset, 10),
                select: {
                    id: true,
                    username: true,
                    email: true,
                    displayName: true,
                    totalXp: true,
                    level: true,
                    currentStreak: true,
                    isAdmin: true,
                    createdAt: true,
                },
            }),
            prisma_1.default.user.count({ where }),
        ]);
        res.json({ users, total });
    }
    catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ error: { message: 'Failed to get users' } });
    }
});
// Update user (admin actions)
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { totalXp, level, isAdmin } = req.body;
        const user = await prisma_1.default.user.update({
            where: { id },
            data: {
                ...(totalXp !== undefined && { totalXp }),
                ...(level !== undefined && { level }),
                ...(isAdmin !== undefined && { isAdmin }),
            },
            select: {
                id: true,
                username: true,
                email: true,
                totalXp: true,
                level: true,
                isAdmin: true,
            },
        });
        res.json({ user });
    }
    catch (error) {
        console.error('Admin update user error:', error);
        res.status(500).json({ error: { message: 'Failed to update user' } });
    }
});
// ============ ANALYTICS ============
router.get('/analytics', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [totalUsers, newUsersToday, newUsersWeek, newUsersMonth, totalQuestions, totalAnswersToday, totalAnswersWeek, categoryStats, difficultyStats,] = await Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.user.count({ where: { createdAt: { gte: today } } }),
            prisma_1.default.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            prisma_1.default.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma_1.default.question.count({ where: { isActive: true } }),
            prisma_1.default.userAnswer.count({ where: { answeredAt: { gte: today } } }),
            prisma_1.default.userAnswer.count({ where: { answeredAt: { gte: sevenDaysAgo } } }),
            prisma_1.default.userProgress.groupBy({
                by: ['categoryId'],
                _sum: { questionsAnswered: true },
                _avg: { questionsCorrect: true },
            }),
            prisma_1.default.question.groupBy({
                by: ['difficulty'],
                _count: true,
            }),
        ]);
        // Get active users (users who answered at least 1 question)
        const activeUsersToday = await prisma_1.default.userAnswer.groupBy({
            by: ['userId'],
            where: { answeredAt: { gte: today } },
        });
        const activeUsersWeek = await prisma_1.default.userAnswer.groupBy({
            by: ['userId'],
            where: { answeredAt: { gte: sevenDaysAgo } },
        });
        res.json({
            users: {
                total: totalUsers,
                newToday: newUsersToday,
                newThisWeek: newUsersWeek,
                newThisMonth: newUsersMonth,
                activeToday: activeUsersToday.length,
                activeThisWeek: activeUsersWeek.length,
            },
            questions: {
                total: totalQuestions,
                byDifficulty: difficultyStats,
            },
            answers: {
                today: totalAnswersToday,
                thisWeek: totalAnswersWeek,
            },
            categories: categoryStats,
        });
    }
    catch (error) {
        console.error('Admin get analytics error:', error);
        res.status(500).json({ error: { message: 'Failed to get analytics' } });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map