// XP and Level calculation utilities

export const XP_REWARDS = {
  easy: 50,
  medium: 100,
  hard: 150,
} as const;

export const TIME_LIMITS = {
  easy: 15,
  medium: 20,
  hard: 30,
} as const;

/**
 * Calculate XP earned for a correct answer
 * Base XP + Speed Bonus * Streak Multiplier
 */
export function calculateXP(
  baseXp: number,
  timeLimit: number,
  timeTaken: number,
  currentStreak: number
): number {
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
export function calculateLevel(totalXp: number): number {
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
export function xpForLevel(level: number): number {
  let totalXp = 0;
  for (let i = 1; i < level; i++) {
    totalXp += Math.floor(500 * Math.pow(i, 1.5));
  }
  return totalXp;
}

/**
 * Get XP progress toward next level
 */
export function getXpProgress(totalXp: number): {
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
} {
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
export function calculateMasteryLevel(
  questionsAnswered: number,
  questionsCorrect: number,
  totalQuestionsInCategory: number
): number {
  if (questionsAnswered === 0) return 0;

  const accuracy = questionsCorrect / questionsAnswered;
  const completionRate = questionsAnswered / totalQuestionsInCategory;

  // Require both accuracy and completion for higher mastery
  if (accuracy >= 0.9 && completionRate >= 0.8) return 5;
  if (accuracy >= 0.8 && completionRate >= 0.6) return 4;
  if (accuracy >= 0.7 && completionRate >= 0.4) return 3;
  if (accuracy >= 0.6 && completionRate >= 0.2) return 2;
  if (accuracy >= 0.5 || completionRate >= 0.1) return 1;

  return 0;
}
