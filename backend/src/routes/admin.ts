import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ============ QUESTIONS ============

// Get all questions with pagination
router.get('/questions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = '50', offset = '0', category, difficulty, search } = req.query;

    const where: any = {};
    if (category) {
      where.category = { slug: category };
    }
    if (difficulty) {
      where.difficulty = difficulty;
    }
    if (search) {
      where.questionText = { contains: search as string, mode: 'insensitive' };
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.question.count({ where }),
    ]);

    res.json({ questions, total });
  } catch (error) {
    console.error('Admin get questions error:', error);
    res.status(500).json({ error: { message: 'Failed to get questions' } });
  }
});

// Create question
router.post(
  '/questions',
  [
    body('categoryId').isUUID(),
    body('questionText').notEmpty(),
    body('difficulty').isIn(['easy', 'medium', 'hard']),
    body('correctAnswer').notEmpty(),
    body('answerOptions').isArray({ min: 2 }),
    body('xpReward').isInt({ min: 1 }),
    body('timeLimit').isInt({ min: 5 }),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
        return;
      }

      const question = await prisma.question.create({
        data: req.body,
        include: { category: true },
      });

      res.status(201).json({ question });
    } catch (error) {
      console.error('Admin create question error:', error);
      res.status(500).json({ error: { message: 'Failed to create question' } });
    }
  }
);

// Update question
router.put('/questions/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const question = await prisma.question.update({
      where: { id },
      data: req.body,
      include: { category: true },
    });

    res.json({ question });
  } catch (error) {
    console.error('Admin update question error:', error);
    res.status(500).json({ error: { message: 'Failed to update question' } });
  }
});

// Delete question
router.delete('/questions/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.question.delete({ where: { id } });

    res.json({ message: 'Question deleted' });
  } catch (error) {
    console.error('Admin delete question error:', error);
    res.status(500).json({ error: { message: 'Failed to delete question' } });
  }
});

// Bulk import questions
router.post('/questions/bulk', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ error: { message: 'Questions array required' } });
      return;
    }

    const created = await prisma.question.createMany({
      data: questions,
      skipDuplicates: true,
    });

    res.status(201).json({ created: created.count });
  } catch (error) {
    console.error('Admin bulk import error:', error);
    res.status(500).json({ error: { message: 'Failed to import questions' } });
  }
});

// ============ CATEGORIES ============

// Create category
router.post(
  '/categories',
  [
    body('name').notEmpty(),
    body('slug').notEmpty().matches(/^[a-z0-9-]+$/),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
        return;
      }

      const category = await prisma.quizCategory.create({
        data: req.body,
      });

      res.status(201).json({ category });
    } catch (error) {
      console.error('Admin create category error:', error);
      res.status(500).json({ error: { message: 'Failed to create category' } });
    }
  }
);

// Update category
router.put('/categories/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await prisma.quizCategory.update({
      where: { id },
      data: req.body,
    });

    res.json({ category });
  } catch (error) {
    console.error('Admin update category error:', error);
    res.status(500).json({ error: { message: 'Failed to update category' } });
  }
});

// ============ ACHIEVEMENTS ============

// Create achievement
router.post('/achievements', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const achievement = await prisma.achievement.create({
      data: req.body,
    });

    res.status(201).json({ achievement });
  } catch (error) {
    console.error('Admin create achievement error:', error);
    res.status(500).json({ error: { message: 'Failed to create achievement' } });
  }
});

// Update achievement
router.put('/achievements/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const achievement = await prisma.achievement.update({
      where: { id },
      data: req.body,
    });

    res.json({ achievement });
  } catch (error) {
    console.error('Admin update achievement error:', error);
    res.status(500).json({ error: { message: 'Failed to update achievement' } });
  }
});

// ============ BELTS ============

// Create belt
router.post('/belts', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const belt = await prisma.championshipBelt.create({
      data: req.body,
    });

    res.status(201).json({ belt });
  } catch (error) {
    console.error('Admin create belt error:', error);
    res.status(500).json({ error: { message: 'Failed to create belt' } });
  }
});

// Update belt
router.put('/belts/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const belt = await prisma.championshipBelt.update({
      where: { id },
      data: req.body,
    });

    res.json({ belt });
  } catch (error) {
    console.error('Admin update belt error:', error);
    res.status(500).json({ error: { message: 'Failed to update belt' } });
  }
});

// ============ USERS ============

// Get all users
router.get('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = '50', offset = '0', search } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          totalXp: true,
          level: true,
          currentStreak: true,
          isAdmin: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: { message: 'Failed to get users' } });
  }
});

// Update user (admin actions)
router.put('/users/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { totalXp, level, isAdmin } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(totalXp !== undefined && { totalXp }),
        ...(level !== undefined && { level }),
        ...(isAdmin !== undefined && { isAdmin }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        totalXp: true,
        level: true,
        isAdmin: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ error: { message: 'Failed to update user' } });
  }
});

// ============ ANALYTICS ============

router.get('/analytics', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      totalQuestions,
      totalAnswersToday,
      totalAnswersWeek,
      categoryStats,
      difficultyStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.question.count({ where: { isActive: true } }),
      prisma.userAnswer.count({ where: { answeredAt: { gte: today } } }),
      prisma.userAnswer.count({ where: { answeredAt: { gte: sevenDaysAgo } } }),
      prisma.userProgress.groupBy({
        by: ['categoryId'],
        _sum: { questionsAnswered: true },
        _avg: { questionsCorrect: true },
      }),
      prisma.question.groupBy({
        by: ['difficulty'],
        _count: true,
      }),
    ]);

    // Get active users (users who answered at least 1 question)
    const activeUsersToday = await prisma.userAnswer.groupBy({
      by: ['userId'],
      where: { answeredAt: { gte: today } },
    });

    const activeUsersWeek = await prisma.userAnswer.groupBy({
      by: ['userId'],
      where: { answeredAt: { gte: sevenDaysAgo } },
    });

    res.json({
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersWeek,
        newThisMonth: newUsersMonth,
        activeToday: activeUsersToday.length,
        activeThisWeek: activeUsersWeek.length,
      },
      questions: {
        total: totalQuestions,
        byDifficulty: difficultyStats,
      },
      answers: {
        today: totalAnswersToday,
        thisWeek: totalAnswersWeek,
      },
      categories: categoryStats,
    });
  } catch (error) {
    console.error('Admin get analytics error:', error);
    res.status(500).json({ error: { message: 'Failed to get analytics' } });
  }
});

export default router;
