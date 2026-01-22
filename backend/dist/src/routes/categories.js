"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all categories with user progress (if authenticated)
router.get('/', auth_1.optionalAuth, async (req, res) => {
    try {
        const categories = await prisma_1.default.quizCategory.findMany({
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: {
                    select: { questions: { where: { isActive: true } } },
                },
            },
        });
        // If user is authenticated, get their progress for each category
        let userProgress = {};
        if (req.user) {
            const progress = await prisma_1.default.userProgress.findMany({
                where: { userId: req.user.id },
            });
            userProgress = progress.reduce((acc, p) => {
                acc[p.categoryId] = p;
                return acc;
            }, {});
        }
        const categoriesWithProgress = categories.map((category) => ({
            ...category,
            questionCount: category._count.questions,
            userProgress: userProgress[category.id] || null,
            isLocked: req.user ? req.user.isAdmin ? false : category.unlockLevel > (userProgress[category.id]?.masteryLevel || 0) : category.unlockLevel > 1,
        }));
        res.json({ categories: categoriesWithProgress });
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: { message: 'Failed to get categories' } });
    }
});
// Get single category with details
router.get('/:slug', auth_1.optionalAuth, async (req, res) => {
    try {
        const { slug } = req.params;
        const category = await prisma_1.default.quizCategory.findUnique({
            where: { slug },
            include: {
                _count: {
                    select: { questions: { where: { isActive: true } } },
                },
                questions: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        difficulty: true,
                    },
                },
            },
        });
        if (!category) {
            res.status(404).json({ error: { message: 'Category not found' } });
            return;
        }
        // Get user progress if authenticated
        let userProgress = null;
        let answeredQuestions = [];
        if (req.user) {
            userProgress = await prisma_1.default.userProgress.findUnique({
                where: {
                    userId_categoryId: {
                        userId: req.user.id,
                        categoryId: category.id,
                    },
                },
            });
            // Get list of questions user has already answered
            const answers = await prisma_1.default.userAnswer.findMany({
                where: {
                    userId: req.user.id,
                    question: { categoryId: category.id },
                },
                select: { questionId: true },
            });
            answeredQuestions = answers.map((a) => a.questionId);
        }
        // Count questions by difficulty
        const difficultyBreakdown = {
            easy: category.questions.filter((q) => q.difficulty === 'easy').length,
            medium: category.questions.filter((q) => q.difficulty === 'medium').length,
            hard: category.questions.filter((q) => q.difficulty === 'hard').length,
        };
        res.json({
            category: {
                ...category,
                questionCount: category._count.questions,
                difficultyBreakdown,
                userProgress,
                answeredQuestions: answeredQuestions.length,
                questions: undefined, // Don't expose question IDs
            },
        });
    }
    catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ error: { message: 'Failed to get category' } });
    }
});
// Get user progress for a specific category
router.get('/:slug/progress', auth_1.authenticate, async (req, res) => {
    try {
        const { slug } = req.params;
        const category = await prisma_1.default.quizCategory.findUnique({
            where: { slug },
        });
        if (!category) {
            res.status(404).json({ error: { message: 'Category not found' } });
            return;
        }
        const progress = await prisma_1.default.userProgress.findUnique({
            where: {
                userId_categoryId: {
                    userId: req.user.id,
                    categoryId: category.id,
                },
            },
        });
        // Get recent answers in this category
        const recentAnswers = await prisma_1.default.userAnswer.findMany({
            where: {
                userId: req.user.id,
                question: { categoryId: category.id },
            },
            orderBy: { answeredAt: 'desc' },
            take: 10,
            include: {
                question: {
                    select: { questionText: true, difficulty: true },
                },
            },
        });
        res.json({ progress, recentAnswers });
    }
    catch (error) {
        console.error('Get category progress error:', error);
        res.status(500).json({ error: { message: 'Failed to get category progress' } });
    }
});
exports.default = router;
//# sourceMappingURL=categories.js.map