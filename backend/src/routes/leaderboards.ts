import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get global leaderboard
router.get('/global', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = '100', offset = '0' } = req.query;

    const users = await prisma.user.findMany({
      orderBy: { totalXp: 'desc' },
      take: Math.min(parseInt(limit as string, 10), 100),
      skip: parseInt(offset as string, 10),
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        totalXp: true,
        level: true,
        currentStreak: true,
      },
    });

    // Add rank to each user
    const leaderboard = users.map((user, index) => ({
      rank: parseInt(offset as string, 10) + index + 1,
      ...user,
    }));

    // Get current user's rank if authenticated
    let userRank = null;
    if (req.user) {
      const higherRankedCount = await prisma.user.count({
        where: {
          totalXp: {
            gt: (
              await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { totalXp: true },
              })
            )?.totalXp || 0,
          },
        },
      });
      userRank = higherRankedCount + 1;
    }

    const totalUsers = await prisma.user.count();

    res.json({
      leaderboard,
      userRank,
      total: totalUsers,
    });
  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({ error: { message: 'Failed to get leaderboard' } });
  }
});

// Get weekly leaderboard
router.get('/weekly', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = '50', offset = '0' } = req.query;

    // Get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    // Aggregate XP earned this week by user
    const weeklyXp = await prisma.userAnswer.groupBy({
      by: ['userId'],
      where: {
        answeredAt: { gte: startOfWeek },
      },
      _sum: { xpEarned: true },
      orderBy: { _sum: { xpEarned: 'desc' } },
      take: Math.min(parseInt(limit as string, 10), 50),
      skip: parseInt(offset as string, 10),
    });

    // Get user details
    const userIds = weeklyXp.map((w) => w.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        level: true,
      },
    });

    const usersMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = weeklyXp.map((entry, index) => {
      const user: any = usersMap.get(entry.userId);
      return {
        rank: parseInt(offset as string, 10) + index + 1,
        id: user?.id,
        username: user?.username,
        displayName: user?.displayName,
        avatarUrl: user?.avatarUrl,
        level: user?.level,
        weeklyXp: entry._sum.xpEarned || 0,
      };
    });

    // Get current user's weekly rank if authenticated
    let userRank = null;
    let userWeeklyXp = 0;
    if (req.user) {
      const userWeeklyData = await prisma.userAnswer.aggregate({
        where: {
          userId: req.user.id,
          answeredAt: { gte: startOfWeek },
        },
        _sum: { xpEarned: true },
      });
      userWeeklyXp = userWeeklyData._sum.xpEarned || 0;

      if (userWeeklyXp > 0) {
        const higherRankedCount = await prisma.userAnswer.groupBy({
          by: ['userId'],
          where: {
            answeredAt: { gte: startOfWeek },
          },
          _sum: { xpEarned: true },
          having: {
            xpEarned: { _sum: { gt: userWeeklyXp } },
          },
        });
        userRank = higherRankedCount.length + 1;
      }
    }

    res.json({
      leaderboard,
      userRank,
      userWeeklyXp,
      weekStart: startOfWeek.toISOString(),
    });
  } catch (error) {
    console.error('Get weekly leaderboard error:', error);
    res.status(500).json({ error: { message: 'Failed to get weekly leaderboard' } });
  }
});

// Get category leaderboard
router.get('/category/:slug', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { limit = '25', offset = '0' } = req.query;

    const category = await prisma.quizCategory.findUnique({
      where: { slug },
    });

    if (!category) {
      res.status(404).json({ error: { message: 'Category not found' } });
      return;
    }

    const progress = await prisma.userProgress.findMany({
      where: { categoryId: category.id },
      orderBy: { categoryXp: 'desc' },
      take: Math.min(parseInt(limit as string, 10), 25),
      skip: parseInt(offset as string, 10),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            level: true,
          },
        },
      },
    });

    const leaderboard = progress.map((entry, index) => ({
      rank: parseInt(offset as string, 10) + index + 1,
      user: entry.user,
      categoryXp: entry.categoryXp,
      masteryLevel: entry.masteryLevel,
      questionsCorrect: entry.questionsCorrect,
      questionsAnswered: entry.questionsAnswered,
      accuracy:
        entry.questionsAnswered > 0
          ? (entry.questionsCorrect / entry.questionsAnswered) * 100
          : 0,
    }));

    // Get current user's rank if authenticated
    let userRank = null;
    if (req.user) {
      const userProgress = await prisma.userProgress.findUnique({
        where: {
          userId_categoryId: {
            userId: req.user.id,
            categoryId: category.id,
          },
        },
      });

      if (userProgress) {
        const higherRankedCount = await prisma.userProgress.count({
          where: {
            categoryId: category.id,
            categoryXp: { gt: userProgress.categoryXp },
          },
        });
        userRank = higherRankedCount + 1;
      }
    }

    res.json({
      category: { id: category.id, name: category.name, slug: category.slug },
      leaderboard,
      userRank,
    });
  } catch (error) {
    console.error('Get category leaderboard error:', error);
    res.status(500).json({ error: { message: 'Failed to get category leaderboard' } });
  }
});

export default router;
