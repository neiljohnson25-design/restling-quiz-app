import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get featured belt of the week (rotates based on week number)
router.get('/featured', async (req, res): Promise<void> => {
  try {
    // Get all belts
    const belts = await prisma.championshipBelt.findMany({
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (belts.length === 0) {
      res.json({ belt: null });
      return;
    }

    // Rotate based on the current week of the year
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.floor(
      (now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    const beltIndex = weekNumber % belts.length;

    res.json({ belt: belts[beltIndex] });
  } catch (error) {
    console.error('Get featured belt error:', error);
    res.status(500).json({ error: { message: 'Failed to get featured belt' } });
  }
});

// Get all championship belts
router.get('/', async (req, res): Promise<void> => {
  try {
    const belts = await prisma.championshipBelt.findMany({
      orderBy: [{ rarity: 'asc' }, { name: 'asc' }],
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.json({ belts });
  } catch (error) {
    console.error('Get belts error:', error);
    res.status(500).json({ error: { message: 'Failed to get belts' } });
  }
});

// Get current user's belts
router.get('/user', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userBelts = await prisma.userBelt.findMany({
      where: { userId: req.user!.id },
      include: {
        belt: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { earnedAt: 'desc' },
    });

    // Get all belts to show progress
    const allBelts = await prisma.championshipBelt.findMany({
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const ownedBeltIds = new Set(userBelts.map((ub) => ub.beltId));

    const beltsWithStatus = allBelts.map((belt) => {
      const userBelt = userBelts.find((ub) => ub.beltId === belt.id);
      return {
        ...belt,
        owned: ownedBeltIds.has(belt.id),
        earnedAt: userBelt?.earnedAt || null,
        isDisplayed: userBelt?.isDisplayed || false,
      };
    });

    res.json({ belts: beltsWithStatus });
  } catch (error) {
    console.error('Get user belts error:', error);
    res.status(500).json({ error: { message: 'Failed to get user belts' } });
  }
});

// Toggle belt display status
router.put('/:id/display', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const userBelt = await prisma.userBelt.findFirst({
      where: {
        beltId: id,
        userId: req.user!.id,
      },
    });

    if (!userBelt) {
      res.status(404).json({ error: { message: 'Belt not owned' } });
      return;
    }

    // If displaying, limit to 3 displayed belts
    if (!userBelt.isDisplayed) {
      const displayedCount = await prisma.userBelt.count({
        where: { userId: req.user!.id, isDisplayed: true },
      });

      if (displayedCount >= 3) {
        res.status(400).json({
          error: { message: 'Maximum 3 belts can be displayed. Hide one first.' },
        });
        return;
      }
    }

    const updated = await prisma.userBelt.update({
      where: { id: userBelt.id },
      data: { isDisplayed: !userBelt.isDisplayed },
      include: { belt: true },
    });

    res.json({ belt: updated });
  } catch (error) {
    console.error('Toggle belt display error:', error);
    res.status(500).json({ error: { message: 'Failed to update belt' } });
  }
});

// Get belt details with Big Blue Cage product link
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    const belt = await prisma.championshipBelt.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { userBelts: true },
        },
      },
    });

    if (!belt) {
      res.status(404).json({ error: { message: 'Belt not found' } });
      return;
    }

    res.json({
      belt: {
        ...belt,
        ownedByCount: belt._count.userBelts,
      },
    });
  } catch (error) {
    console.error('Get belt details error:', error);
    res.status(500).json({ error: { message: 'Failed to get belt details' } });
  }
});

export default router;
