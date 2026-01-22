"use strict";
// XP and Level calculation utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIME_LIMITS = exports.XP_REWARDS = void 0;
exports.calculateXP = calculateXP;
exports.calculateLevel = calculateLevel;
exports.xpForLevel = xpForLevel;
exports.getXpProgress = getXpProgress;
exports.calculateMasteryLevel = calculateMasteryLevel;
exports.XP_REWARDS = {
    easy: 50,
    medium: 100,
    hard: 150,
};
exports.TIME_LIMITS = {
    easy: 15,
    medium: 20,
    hard: 30,
};
/**
 * Calculate XP earned for a correct answer
 * Base XP + Speed Bonus * Streak Multiplier
 */
function calculateXP(baseXp, timeLimit, timeTaken, currentStreak) {
    // Speed bonus: 2 XP per second remaining
    const speedBonus = Math.max(0, (timeLimit - timeTaken) * 2);
    // Streak multiplier: 1 + (streak * 0.1), capped at 2x for 10+ day streak
    const streakMultiplier = Math.min(2, 1 + (currentStreak * 0.1));
    const totalXp = Math.floor((baseXp + speedBonus) * streakMultiplier);
    return totalXp;
}
/**
 * Calculate level from total XP
 * XP required for level N = 500 * N^1.5
 */
function calculateLevel(totalXp) {
    let level = 1;
    let xpRequired = 0;
    while (true) {
        const nextLevelXp = Math.floor(500 * Math.pow(level, 1.5));
        if (xpRequired + nextLevelXp > totalXp) {
            break;
        }
        xpRequired += nextLevelXp;
        level++;
    }
    return level;
}
/**
 * Get XP required to reach a specific level
 */
function xpForLevel(level) {
    let totalXp = 0;
    for (let i = 1; i < level; i++) {
        totalXp += Math.floor(500 * Math.pow(i, 1.5));
    }
    return totalXp;
}
/**
 * Get XP progress toward next level
 */
function getXpProgress(totalXp) {
    const currentLevel = calculateLevel(totalXp);
    const currentLevelXp = xpForLevel(currentLevel);
    const nextLevelXp = xpForLevel(currentLevel + 1);
    const xpInCurrentLevel = totalXp - currentLevelXp;
    const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
    const progress = xpInCurrentLevel / xpNeededForNextLevel;
    return {
        currentLevel,
        currentLevelXp,
        nextLevelXp,
        progress,
    };
}
/**
 * Calculate mastery level (0-5 stars) for a category
 * Based on accuracy and questions answered
 */
function calculateMasteryLevel(questionsAnswered, questionsCorrect, totalQuestionsInCategory) {
    if (questionsAnswered === 0)
        return 0;
    const accuracy = questionsCorrect / questionsAnswered;
    const completionRate = questionsAnswered / totalQuestionsInCategory;
    // Require both accuracy and completion for higher mastery
    if (accuracy >= 0.9 && completionRate >= 0.8)
        return 5;
    if (accuracy >= 0.8 && completionRate >= 0.6)
        return 4;
    if (accuracy >= 0.7 && completionRate >= 0.4)
        return 3;
    if (accuracy >= 0.6 && completionRate >= 0.2)
        return 2;
    if (accuracy >= 0.5 || completionRate >= 0.1)
        return 1;
    return 0;
}
//# sourceMappingURL=xp.js.map