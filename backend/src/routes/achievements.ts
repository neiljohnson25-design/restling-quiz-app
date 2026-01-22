import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all achievements
router.get('/', async (req, res): Promise<void> => {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: [{ beltTier: 'asc' }, { xpReward: 'asc' }],
    });

    res.json({ achievements });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: { message: 'Failed to get achievements' } });
  }
});

// Get current user's achievements
router.get('/user', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: req.user!.id },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    });

    // Get all achievements to show progress
    const allAchievements = await prisma.achievement.findMany();

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    const achievementsWithStatus = allAchievements.map((achievement) => {
      const userAchievement = userAchievements.find(
        (ua) => ua.achievementId === achievement.id
      );
      return {
        ...achievement,
        unlocked: unlockedIds.has(achievement.id),
        unlockedAt: userAchievement?.unlockedAt || null,
        isEquipped: userAchievement?.isEquipped || false,
      };
    });

    res.json({ achievements: achievementsWithStatus });
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ error: { message: 'Failed to get user achievements' } });
  }
});

// Toggle achievement equip status
router.put('/:id/equip', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const userAchievement = await prisma.userAchievement.findFirst({
      where: {
        achievementId: id,
        userId: req.user!.id,
      },
    });

    if (!userAchievement) {
      res.status(404).json({ error: { message: 'Achievement not unlocked' } });
      return;
    }

    // If equipping, limit to 3 equipped achievements
    if (!userAchievement.isEquipped) {
      const equippedCount = await prisma.userAchievement.count({
        where: { userId: req.user!.id, isEquipped: true },
      });

      if (equippedCount >= 3) {
        res.status(400).json({
          error: { message: 'Maximum 3 achievements can be equipped. Unequip one first.' },
        });
        return;
      }
    }

    const updated = await prisma.userAchievement.update({
      where: { id: userAchievement.id },
      data: { isEquipped: !userAchievement.isEquipped },
      include: { achievement: true },
    });

    res.json({ achievement: updated });
  } catch (error) {
    console.error('Toggle achievement equip error:', error);
    res.status(500).json({ error: { message: 'Failed to update achievement' } });
  }
});

export default router;
