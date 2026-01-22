"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAchievements = checkAchievements;
exports.checkBeltUnlocks = checkBeltUnlocks;
const prisma_1 = __importDefault(require("../utils/prisma"));
async function checkAchievements(userId) {
    const newlyUnlocked = [];
    try {
        // Get user data
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                achievements: true,
                progress: {
                    include: { category: true },
                },
            },
        });
        if (!user)
            return [];
        // Get user stats
        const totalAnswers = await prisma_1.default.userAnswer.count({
            where: { userId },
        });
        const correctAnswers = await prisma_1.default.userAnswer.count({
            where: { userId, isCorrect: true },
        });
        // Get all achievements user doesn't have
        const unlockedIds = user.achievements.map((a) => a.achievementId);
        const availableAchievements = await prisma_1.default.achievement.findMany({
            where: {
                id: { notIn: unlockedIds },
            },
        });
        for (const achievement of availableAchievements) {
            const criteria = achievement.unlockCriteria;
            let unlocked = false;
            switch (criteria.type) {
                case 'first_quiz':
                    unlocked = totalAnswers >= 1;
                    break;
                case 'total_correct':
                    unlocked = correctAnswers >= (criteria.value || 0);
                    break;
                case 'total_answers':
                    unlocked = totalAnswers >= (criteria.value || 0);
                    break;
                case 'level':
                    unlocked = user.level >= (criteria.value || 0);
                    break;
                case 'streak':
                    unlocked = user.currentStreak >= (criteria.streak || criteria.value || 0);
                    break;
                case 'category_correct':
                    if (criteria.categorySlug) {
                        const categoryProgress = user.progress.find((p) => p.category.slug === criteria.categorySlug);
                        unlocked = categoryProgress
                            ? categoryProgress.questionsCorrect >= (criteria.value || 0)
                            : false;
                    }
                    break;
                case 'category_accuracy':
                    if (criteria.categorySlug) {
                        const categoryProgress = user.progress.find((p) => p.category.slug === criteria.categorySlug);
                        if (categoryProgress && categoryProgress.questionsAnswered >= 10) {
                            const accuracy = (categoryProgress.questionsCorrect / categoryProgress.questionsAnswered) * 100;
                            unlocked = accuracy >= (criteria.accuracy || 80);
                        }
                    }
                    break;
                case 'category_mastery':
                    if (criteria.categorySlug) {
                        const categoryProgress = user.progress.find((p) => p.category.slug === criteria.categorySlug);
                        unlocked = categoryProgress
                            ? categoryProgress.masteryLevel >= (criteria.value || 5)
                            : false;
                    }
                    break;
                case 'all_categories':
                    const allCategories = await prisma_1.default.quizCategory.count();
                    const userCategoriesPlayed = user.progress.filter((p) => p.questionsAnswered > 0).length;
                    unlocked = userCategoriesPlayed >= allCategories;
                    break;
                case 'speed_demon':
                    // Check if user has answered X questions in under Y seconds each
                    const fastAnswers = await prisma_1.default.userAnswer.count({
                        where: {
                            userId,
                            isCorrect: true,
                            timeTaken: { lte: criteria.value || 5 },
                        },
                    });
                    unlocked = fastAnswers >= 10;
                    break;
                case 'perfect_quiz':
                    // This would need to be tracked per quiz session
                    // For now, check if user has 10 consecutive correct answers
                    const recentAnswers = await prisma_1.default.userAnswer.findMany({
                        where: { userId },
                        orderBy: { answeredAt: 'desc' },
                        take: 10,
                    });
                    unlocked =
                        recentAnswers.length >= 10 && recentAnswers.every((a) => a.isCorrect);
                    break;
            }
            if (unlocked) {
                // Award achievement
                const userAchievement = await prisma_1.default.userAchievement.create({
                    data: {
                        userId,
                        achievementId: achievement.id,
                    },
                    include: { achievement: true },
                });
                // Award bonus XP
                if (achievement.xpReward > 0) {
                    await prisma_1.default.user.update({
                        where: { id: userId },
                        data: { totalXp: { increment: achievement.xpReward } },
                    });
                }
                newlyUnlocked.push(userAchievement);
            }
        }
        return newlyUnlocked;
    }
    catch (error) {
        console.error('Check achievements error:', error);
        return [];
    }
}
async function checkBeltUnlocks(userId) {
    const newlyUnlocked = [];
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                belts: true,
                progress: {
                    include: { category: true },
                },
            },
        });
        if (!user)
            return [];
        const totalCorrect = await prisma_1.default.userAnswer.count({
            where: { userId, isCorrect: true },
        });
        // Get all belts user doesn't have
        const ownedBeltIds = user.belts.map((b) => b.beltId);
        const availableBelts = await prisma_1.default.championshipBelt.findMany({
            where: {
                id: { notIn: ownedBeltIds },
            },
            include: { category: true },
        });
        for (const belt of availableBelts) {
            const criteria = belt.unlockCriteria;
            let unlocked = false;
            switch (criteria.type) {
                case 'category_complete':
                    if (belt.category) {
                        const categoryProgress = user.progress.find((p) => p.categoryId === belt.categoryId);
                        const totalQuestions = await prisma_1.default.question.count({
                            where: { categoryId: belt.categoryId, isActive: true },
                        });
                        unlocked = categoryProgress
                            ? categoryProgress.questionsAnswered >= totalQuestions
                            : false;
                    }
                    break;
                case 'category_mastery':
                    if (belt.category) {
                        const categoryProgress = user.progress.find((p) => p.categoryId === belt.categoryId);
                        const accuracy = categoryProgress
                            ? (categoryProgress.questionsCorrect / categoryProgress.questionsAnswered) * 100
                            : 0;
                        unlocked =
                            categoryProgress &&
                                categoryProgress.questionsAnswered >= 20 &&
                                accuracy >= (criteria.accuracy || 90);
                    }
                    break;
                case 'total_correct':
                    unlocked = totalCorrect >= (criteria.value || 100);
                    break;
                case 'total_belts':
                    unlocked = user.belts.length >= (criteria.value || 5);
                    break;
            }
            if (unlocked) {
                const userBelt = await prisma_1.default.userBelt.create({
                    data: {
                        userId,
                        beltId: belt.id,
                    },
                    include: { belt: true },
                });
                newlyUnlocked.push(userBelt);
            }
        }
        return newlyUnlocked;
    }
    catch (error) {
        console.error('Check belt unlocks error:', error);
        return [];
    }
}
//# sourceMappingURL=achievements.js.map