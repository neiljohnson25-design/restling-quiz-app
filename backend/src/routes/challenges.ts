import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get today's daily challenge
router.get('/today', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's challenge
    let challenge = await prisma.dailyChallenge.findUnique({
      where: { challengeDate: today },
    });

    if (!challenge) {
      // Auto-generate a daily challenge
      const questions = await prisma.question.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      // Shuffle and pick 10 random questions
      const shuffled = questions.sort(() => Math.random() - 0.5);
      const questionIds = shuffled.slice(0, 10).map((q) => q.id);

      challenge = await prisma.dailyChallenge.create({
        data: {
          challengeDate: today,
          questionIds,
          bonusXp: 250,
        },
      });
    }

    // Check if user has already completed today's challenge
    const userChallenge = await prisma.userDailyChallenge.findUnique({
      where: {
        userId_challengeId: {
          userId: req.user!.id,
          challengeId: challenge.id,
        },
      },
    });

    // Get the questions for the challenge
    const questionIds = challenge.questionIds as string[];
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
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

    // Shuffle answer options
    const questionsWithShuffledOptions = questions.map((q) => ({
      ...q,
      answerOptions: (q.answerOptions as string[]).sort(() => Math.random() - 0.5),
    }));

    res.json({
      challenge: {
        id: challenge.id,
        date: challenge.challengeDate,
        bonusXp: challenge.bonusXp,
        questionCount: questionIds.length,
        completed: userChallenge?.completed || false,
        score: userChallenge?.score || 0,
        completedAt: userChallenge?.completedAt || null,
      },
      questions: userChallenge?.completed ? [] : questionsWithShuffledOptions,
    });
  } catch (error) {
    console.error('Get daily challenge error:', error);
    res.status(500).json({ error: { message: 'Failed to get daily challenge' } });
  }
});

// Complete daily challenge
router.post('/:id/complete', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { score, correctCount, totalQuestions } = req.body;

    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id },
    });

    if (!challenge) {
      res.status(404).json({ error: { message: 'Challenge not found' } });
      return;
    }

    // Check if already completed
    const existingChallenge = await prisma.userDailyChallenge.findUnique({
      where: {
        userId_challengeId: {
          userId: req.user!.id,
          challengeId: id,
        },
      },
    });

    if (existingChallenge?.completed) {
      res.status(400).json({ error: { message: 'Challenge already completed' } });
      return;
    }

    // Calculate bonus XP (full bonus for perfect score, scaled otherwise)
    const accuracy = correctCount / totalQuestions;
    const bonusXpEarned = Math.floor(challenge.bonusXp * accuracy);

    // Update or create user challenge record
    const userChallenge = await prisma.userDailyChallenge.upsert({
      where: {
        userId_challengeId: {
          userId: req.user!.id,
          challengeId: id,
        },
      },
      update: {
        completed: true,
        score,
        completedAt: new Date(),
      },
      create: {
        userId: req.user!.id,
        challengeId: id,
        completed: true,
        score,
        completedAt: new Date(),
      },
    });

    // Award bonus XP
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { totalXp: { increment: bonusXpEarned } },
    });

    res.json({
      result: {
        completed: true,
        score,
        correctCount,
        totalQuestions,
        accuracy: accuracy * 100,
        bonusXpEarned,
        totalXp: user.totalXp,
      },
    });
  } catch (error) {
    console.error('Complete challenge error:', error);
    res.status(500).json({ error: { message: 'Failed to complete challenge' } });
  }
});

// Get challenge history
router.get('/history', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = '30' } = req.query;

    const history = await prisma.userDailyChallenge.findMany({
      where: { userId: req.user!.id },
      orderBy: { challenge: { challengeDate: 'desc' } },
      take: parseInt(limit as string, 10),
      include: {
        challenge: {
          select: {
            id: true,
            challengeDate: true,
            bonusXp: true,
          },
        },
      },
    });

    // Get total challenges available in the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalChallenges = await prisma.dailyChallenge.count({
      where: { challengeDate: { gte: thirtyDaysAgo } },
    });

    const completedChallenges = history.filter((h) => h.completed).length;

    res.json({
      history,
      stats: {
        totalChallenges,
        completedChallenges,
        completionRate: totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Get challenge history error:', error);
    res.status(500).json({ error: { message: 'Failed to get challenge history' } });
  }
});

export default router;
