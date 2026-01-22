import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { calculateXP, calculateLevel, calculateMasteryLevel } from '../utils/xp';
import { checkAchievements } from '../services/achievements';

const router = Router();

// Get random questions for a quiz session
router.get('/random', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categorySlug, difficulty, count = '10' } = req.query;

    // Build query conditions
    const where: any = { isActive: true };

    if (categorySlug) {
      const category = await prisma.quizCategory.findUnique({
        where: { slug: categorySlug as string },
      });
      if (!category) {
        res.status(404).json({ error: { message: 'Category not found' } });
        return;
      }
      where.categoryId = category.id;
    }

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty as string)) {
      where.difficulty = difficulty;
    }

    // Get random questions using raw query for better randomization
    const questionCount = Math.min(parseInt(count as string, 10), 20);

    // Get all question IDs matching criteria
    const allQuestions = await prisma.question.findMany({
      where,
      select: { id: true },
    });

    // Shuffle and take the requested number
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selectedIds = shuffled.slice(0, questionCount).map((q) => q.id);

    // Fetch full question data
    const questions = await prisma.question.findMany({
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
      answerOptions: (q.answerOptions as string[]).sort(() => Math.random() - 0.5),
    }));

    res.json({ questions: questionsWithShuffledOptions });
  } catch (error) {
    console.error('Get random questions error:', error);
    res.status(500).json({ error: { message: 'Failed to get questions' } });
  }
});

// Submit an answer
router.post(
  '/:id/answer',
  authenticate,
  [
    body('answer').notEmpty().withMessage('Answer is required'),
    body('timeTaken').isInt({ min: 0 }).withMessage('Time taken must be a positive integer'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
        return;
      }

      const { id } = req.params;
      const { answer, timeTaken } = req.body;

      // Get the question
      const question = await prisma.question.findUnique({
        where: { id },
        include: { category: true },
      });

      if (!question) {
        res.status(404).json({ error: { message: 'Question not found' } });
        return;
      }

      // Check if already answered (prevent duplicate submissions)
      const existingAnswer = await prisma.userAnswer.findFirst({
        where: {
          userId: req.user!.id,
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
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        res.status(404).json({ error: { message: 'User not found' } });
        return;
      }

      // Check answer
      const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

      // Calculate XP
      const xpEarned = isCorrect
        ? calculateXP(question.xpReward, question.timeLimit, timeTaken, user.currentStreak)
        : 0;

      // Save answer
      await prisma.userAnswer.create({
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
      const categoryProgress = await prisma.userProgress.upsert({
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
      const totalQuestionsInCategory = await prisma.question.count({
        where: { categoryId: question.categoryId, isActive: true },
      });

      const newMasteryLevel = calculateMasteryLevel(
        categoryProgress.questionsAnswered,
        categoryProgress.questionsCorrect,
        totalQuestionsInCategory
      );

      // Update mastery level if changed
      if (newMasteryLevel !== categoryProgress.masteryLevel) {
        await prisma.userProgress.update({
          where: { id: categoryProgress.id },
          data: { masteryLevel: newMasteryLevel },
        });
      }

      // Update user total XP and recalculate level
      const newTotalXp = user.totalXp + xpEarned;
      const newLevel = calculateLevel(newTotalXp);

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
        } else if (!lastPlayed || lastPlayed.getTime() < yesterday.getTime()) {
          // Streak broken - reset to 1
          newStreak = 1;
        }
      }

      const updatedUser = await prisma.user.update({
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
      const newAchievements = await checkAchievements(user.id);

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
    } catch (error) {
      console.error('Submit answer error:', error);
      res.status(500).json({ error: { message: 'Failed to submit answer' } });
    }
  }
);

// Get hint for a question (50/50 - returns 2 wrong answers to eliminate)
router.post('/:id/hint', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const HINT_COST = 25;

    // Get the question
    const question = await prisma.question.findUnique({
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
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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
    const wrongAnswers = (question.answerOptions as string[]).filter(
      opt => opt.trim().toLowerCase() !== question.correctAnswer.trim().toLowerCase()
    );

    // Shuffle and pick 2 wrong answers to eliminate
    const shuffled = wrongAnswers.sort(() => Math.random() - 0.5);
    const toEliminate = shuffled.slice(0, 2);

    // Deduct XP from user
    await prisma.user.update({
      where: { id: user.id },
      data: { totalXp: user.totalXp - HINT_COST },
    });

    res.json({
      eliminatedOptions: toEliminate,
      xpSpent: HINT_COST,
      remainingXp: user.totalXp - HINT_COST,
    });
  } catch (error) {
    console.error('Get hint error:', error);
    res.status(500).json({ error: { message: 'Failed to get hint' } });
  }
});

export default router;
