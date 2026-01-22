export declare const XP_REWARDS: {
    readonly easy: 50;
    readonly medium: 100;
    readonly hard: 150;
};
export declare const TIME_LIMITS: {
    readonly easy: 15;
    readonly medium: 20;
    readonly hard: 30;
};
/**
 * Calculate XP earned for a correct answer
 * Base XP + Speed Bonus * Streak Multiplier
 */
export declare function calculateXP(baseXp: number, timeLimit: number, timeTaken: number, currentStreak: number): number;
/**
 * Calculate level from total XP
 * XP required for level N = 500 * N^1.5
 */
export declare function calculateLevel(totalXp: number): number;
/**
 * Get XP required to reach a specific level
 */
export declare function xpForLevel(level: number): number;
/**
 * Get XP progress toward next level
 */
export declare function getXpProgress(totalXp: number): {
    currentLevel: number;
    currentLevelXp: number;
    nextLevelXp: number;
    progress: number;
};
/**
 * Calculate mastery level (0-5 stars) for a category
 * Based on accuracy and questions answered
 */
export declare function calculateMasteryLevel(questionsAnswered: number, questionsCorrect: number, totalQuestionsInCategory: number): number;
//# sourceMappingURL=xp.d.ts.map