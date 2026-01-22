import prisma from '../utils/prisma';

interface UnlockCriteria {
  type: string;
  value?: number;
  categorySlug?: string;
  accuracy?: number;
  streak?: number;
}

export async function checkAchievements(userId: string): Promise<any[]> {
  const newlyUnlocked: any[] = [];

  try {
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: true,
        progress: {
          include: { category: true },
        },
      },
    });

    if (!user) return [];

    // Get user stats
    const totalAnswers = await prisma.userAnswer.count({
      where: { userId },
    });

    const correctAnswers = await prisma.userAnswer.count({
      where: { userId, isCorrect: true },
    });

    // Get all achievements user doesn't have
    const unlockedIds = user.achievements.map((a) => a.achievementId);
    const availableAchievements = await prisma.achievement.findMany({
      where: {
        id: { notIn: unlockedIds },
      },
    });

    for (const achievement of availableAchievements) {
      const criteria = achievement.unlockCriteria as UnlockCriteria;
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
            const categoryProgress = user.progress.find(
              (p) => p.category.slug === criteria.categorySlug
            );
            unlocked = categoryProgress
              ? categoryProgress.questionsCorrect >= (criteria.value || 0)
              : false;
          }
          break;

        case 'category_accuracy':
          if (criteria.categorySlug) {
            const categoryProgress = user.progress.find(
              (p) => p.category.slug === criteria.categorySlug
            );
            if (categoryProgress && categoryProgress.questionsAnswered >= 10) {
              const accuracy =
                (categoryProgress.questionsCorrect / categoryProgress.questionsAnswered) * 100;
              unlocked = accuracy >= (criteria.accuracy || 80);
            }
          }
          break;

        case 'category_mastery':
          if (criteria.categorySlug) {
            const categoryProgress = user.progress.find(
              (p) => p.category.slug === criteria.categorySlug
            );
            unlocked = categoryProgress
              ? categoryProgress.masteryLevel >= (criteria.value || 5)
              : false;
          }
          break;

        case 'all_categories':
          const allCategories = await prisma.quizCategory.count();
          const userCategoriesPlayed = user.progress.filter(
            (p) => p.questionsAnswered > 0
          ).length;
          unlocked = userCategoriesPlayed >= allCategories;
          break;

        case 'speed_demon':
          // Check if user has answered X questions in under Y seconds each
          const fastAnswers = await prisma.userAnswer.count({
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
          const recentAnswers = await prisma.userAnswer.findMany({
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
        const userAchievement = await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
          include: { achievement: true },
        });

        // Award bonus XP
        if (achievement.xpReward > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { totalXp: { increment: achievement.xpReward } },
          });
        }

        newlyUnlocked.push(userAchievement);
      }
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('Check achievements error:', error);
    return [];
  }
}

export async function checkBeltUnlocks(userId: string): Promise<any[]> {
  const newlyUnlocked: any[] = [];

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        belts: true,
        progress: {
          include: { category: true },
        },
      },
    });

    if (!user) return [];

    const totalCorrect = await prisma.userAnswer.count({
      where: { userId, isCorrect: true },
    });

    // Get all belts user doesn't have
    const ownedBeltIds = user.belts.map((b) => b.beltId);
    const availableBelts = await prisma.championshipBelt.findMany({
      where: {
        id: { notIn: ownedBeltIds },
      },
      include: { category: true },
    });

    for (const belt of availableBelts) {
      const criteria = belt.unlockCriteria as any;
      let unlocked = false;

      switch (criteria.type) {
        case 'category_complete':
          if (belt.category) {
            const categoryProgress = user.progress.find(
              (p) => p.categoryId === belt.categoryId
            );
            const totalQuestions = await prisma.question.count({
              where: { categoryId: belt.categoryId, isActive: true },
            });
            unlocked = categoryProgress
              ? categoryProgress.questionsAnswered >= totalQuestions
              : false;
          }
          break;

        case 'category_mastery':
          if (belt.category) {
            const categoryProgress = user.progress.find(
              (p) => p.categoryId === belt.categoryId
            );
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
        const userBelt = await prisma.userBelt.create({
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
  } catch (error) {
    console.error('Check belt unlocks error:', error);
    return [];
  }
}
