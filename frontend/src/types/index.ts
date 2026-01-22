export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate?: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface UserStats {
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  totalBelts: number;
  totalAchievements: number;
}

export interface XpProgress {
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  unlockLevel: number;
  colorTheme: string;
  sortOrder: number;
  questionCount: number;
  userProgress?: UserProgress;
  isLocked: boolean;
}

export interface UserProgress {
  id: string;
  questionsAnswered: number;
  questionsCorrect: number;
  categoryXp: number;
  masteryLevel: number;
  lastAttempted?: string;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'IMAGE_ID' | 'AUDIO_CLIP' | 'TIMELINE';
  difficulty: 'easy' | 'medium' | 'hard';
  mediaUrl?: string;
  answerOptions: string[];
  xpReward: number;
  timeLimit: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  xpEarned: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  streak: number;
  masteryLevel: number;
  newAchievements: UserAchievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  badgeIconUrl?: string;
  unlockCriteria: Record<string, any>;
  xpReward: number;
  beltTier?: 'bronze' | 'silver' | 'gold' | 'championship';
  unlocked?: boolean;
  unlockedAt?: string;
  isEquipped?: boolean;
}

export interface UserAchievement {
  id: string;
  unlockedAt: string;
  isEquipped: boolean;
  achievement: Achievement;
}

export interface Belt {
  id: string;
  name: string;
  description?: string;
  beltImageUrl: string;
  categoryId?: string;
  unlockCriteria: Record<string, any>;
  bigBlueCageProductUrl?: string;
  rarity: 'common' | 'rare' | 'legendary';
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  owned?: boolean;
  earnedAt?: string;
  isDisplayed?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalXp?: number;
  weeklyXp?: number;
  categoryXp?: number;
  level: number;
  currentStreak?: number;
  masteryLevel?: number;
}

export interface DailyChallenge {
  id: string;
  date: string;
  bonusXp: number;
  questionCount: number;
  completed: boolean;
  score: number;
  completedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
