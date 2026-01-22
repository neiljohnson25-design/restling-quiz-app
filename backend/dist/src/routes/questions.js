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
const achievements_1 = require("../services/achievements");
const router = (0, express_1.Router)();
// Get random questions for a quiz session
router.get('/random', auth_1.authenticate, async (req, res) => {
    try {
        const { categorySlug, difficulty, count = '10' } = req.query;
        // Build query conditions
        const where = { isActive: true };
        if (categorySlug) {
            const category = await prisma_1.default.quizCategory.findUnique({
                where: { slug: categorySlug },
            });
            if (!category) {
                res.status(404).json({ error: { message: 'Category not found' } });
                return;
            }
            where.categoryId = category.id;
        }
        if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
            where.difficulty = difficulty;
        }
        // Get random questions using raw query for better randomization
        const questionCount = Math.min(parseInt(count, 10), 20);
        // Get all question IDs matching criteria
        const allQuestions = await prisma_1.default.question.findMany({
            where,
            select: { id: true },
        });
        // Shuffle and take the requested number
        const shuffled = allQuestions.sort(() => Math.random() - 0.5);
        const selectedIds = shuffled.slice(0, questionCount).map((q) => q.id);
        // Fetch full question data
        const questions = await prisma_1.default.question.findMany({
            where: { id: { in: selectedIds } },
            select: {
                id: true,
                questionText: true,
                questionType: true,
                difficulty: true,
                mediaUrl: true,
                answerOptions: true,
                xpReward: true,
                timeLimit: true,
                category: {
                    select: { id: true, name: true, slug: true },
                },
            },
        });
        // Shuffle answer options for each question
        const questionsWithShuffledOptions = questions.map((q) => ({
            ...q,
            answerOptions: q.answerOptions.sort(() => Math.random() - 0.5),
        }));
        res.json({ questions: questionsWithShuffledOptions });
    }
    catch (error) {
        console.error('Get random questions error:', error);
        res.status(500).json({ error: { message: 'Failed to get questions' } });
    }
});
// Submit an answer
router.post('/:id/answer', auth_1.authenticate, [
    (0, express_validator_1.body)('answer').notEmpty().withMessage('Answer is required'),
    (0, express_validator_1.body)('timeTaken').isInt({ min: 0 }).withMessage('Time taken must be a positive integer'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
            return;
        }
        const { id } = req.params;
        const { answer, timeTaken } = req.body;
        // Get the question
        const question = await prisma_1.default.question.findUnique({
            where: { id },
            include: { category: true },
        });
        if (!question) {
            res.status(404).json({ error: { message: 'Question not found' } });
            return;
        }
        // Check if already answered (prevent duplicate submissions)
        const existingAnswer = await prisma_1.default.userAnswer.findFirst({
            where: {
                userId: req.user.id,
                questionId: id,
            },
        });
        if (existingAnswer) {
            res.status(400).json({
                error: { message: 'Question already answered' },
                result: {
                    isCorrect: existingAnswer.isCorrect,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation,
                    xpEarned: 0,
                },
            });
            return;
        }
        // Get user for streak info
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            res.status(404).json({ error: { message: 'User not found' } });
            return;
        }
        // Check answer
        const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
        // Calculate XP
        const xpEarned = isCorrect
            ? (0, xp_1.calculateXP)(question.xpReward, question.timeLimit, timeTaken, user.currentStreak)
            : 0;
        // Save answer
        await prisma_1.default.userAnswer.create({
            data: {
                userId: user.id,
                questionId: id,
                answerGiven: answer,
                isCorrect,
                timeTaken,
                xpEarned,
            },
        });
        // Update user progress for this category
        const categoryProgress = await prisma_1.default.userProgress.upsert({
            where: {
                userId_categoryId: {
                    userId: user.id,
                    categoryId: question.categoryId,
                },
            },
            update: {
                questionsAnswered: { increment: 1 },
                questionsCorrect: isCorrect ? { increment: 1 } : undefined,
                categoryXp: { increment: xpEarned },
                lastAttempted: new Date(),
            },
            create: {
                userId: user.id,
                categoryId: question.categoryId,
                questionsAnswered: 1,
                questionsCorrect: isCorrect ? 1 : 0,
                categoryXp: xpEarned,
                lastAttempted: new Date(),
            },
        });
        // Calculate new mastery level
        const totalQuestionsInCategory = await prisma_1.default.question.count({
            where: { categoryId: question.categoryId, isActive: true },
        });
        const newMasteryLevel = (0, xp_1.calculateMasteryLevel)(categoryProgress.questionsAnswered, categoryProgress.questionsCorrect, totalQuestionsInCategory);
        // Update mastery level if changed
        if (newMasteryLevel !== categoryProgress.masteryLevel) {
            await prisma_1.default.userProgress.update({
                where: { id: categoryProgress.id },
                data: { masteryLevel: newMasteryLevel },
            });
        }
        // Update user total XP and recalculate level
        const newTotalXp = user.totalXp + xpEarned;
        const newLevel = (0, xp_1.calculateLevel)(newTotalXp);
        // Update streak if first answer of the day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastPlayed = user.lastPlayedDate ? new Date(user.lastPlayedDate) : null;
        lastPlayed?.setHours(0, 0, 0, 0);
        let newStreak = user.currentStreak;
        if (!lastPlayed || lastPlayed.getTime() !== today.getTime()) {
            // First answer of the day
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastPlayed && lastPlayed.getTime() === yesterday.getTime()) {
                // Consecutive day - increment streak
                newStreak = user.currentStreak + 1;
            }
            else if (!lastPlayed || lastPlayed.getTime() < yesterday.getTime()) {
                // Streak broken - reset to 1
                newStreak = 1;
            }
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                totalXp: newTotalXp,
                level: newLevel,
                currentStreak: newStreak,
                longestStreak: Math.max(user.longestStreak, newStreak),
                lastPlayedDate: today,
            },
        });
        // Check for new achievements
        const newAchievements = await (0, achievements_1.checkAchievements)(user.id);
        res.json({
            result: {
                isCorrect,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
                xpEarned,
                totalXp: updatedUser.totalXp,
                level: updatedUser.level,
                leveledUp: newLevel > user.level,
                streak: updatedUser.currentStreak,
                masteryLevel: newMasteryLevel,
                newAchievements,
            },
        });
    }
    catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({ error: { message: 'Failed to submit answer' } });
    }
});
// Get hint for a question (50/50 - returns 2 wrong answers to eliminate)
router.post('/:id/hint', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const HINT_COST = 25;
        // Get the question
        const question = await prisma_1.default.question.findUnique({
            where: { id },
            select: {
                id: true,
                correctAnswer: true,
                answerOptions: true,
            },
        });
        if (!question) {
            res.status(404).json({ error: { message: 'Question not found' } });
            return;
        }
        // Get user to check XP
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            res.status(404).json({ error: { message: 'User not found' } });
            return;
        }
        if (user.totalXp < HINT_COST) {
            res.status(400).json({ error: { message: 'Not enough XP for hint' } });
            return;
        }
        // Get wrong answers and pick 2 to eliminate
        const wrongAnswers = question.answerOptions.filter(opt => opt.trim().toLowerCase() !== question.correctAnswer.trim().toLowerCase());
        // Shuffle and pick 2 wrong answers to eliminate
        const shuffled = wrongAnswers.sort(() => Math.random() - 0.5);
        const toEliminate = shuffled.slice(0, 2);
        // Deduct XP from user
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { totalXp: user.totalXp - HINT_COST },
        });
        res.json({
            eliminatedOptions: toEliminate,
            xpSpent: HINT_COST,
            remainingXp: user.totalXp - HINT_COST,
        });
    }
    catch (error) {
        console.error('Get hint error:', error);
        res.status(500).json({ error: { message: 'Failed to get hint' } });
    }
});
exports.default = router;
//# sourceMappingURL=questions.js.map