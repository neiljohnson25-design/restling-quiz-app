"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get featured belt of the week (rotates based on week number)
router.get('/featured', async (req, res) => {
    try {
        // Get all belts
        const belts = await prisma_1.default.championshipBelt.findMany({
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
        const weekNumber = Math.floor((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const beltIndex = weekNumber % belts.length;
        res.json({ belt: belts[beltIndex] });
    }
    catch (error) {
        console.error('Get featured belt error:', error);
        res.status(500).json({ error: { message: 'Failed to get featured belt' } });
    }
});
// Get all championship belts
router.get('/', async (req, res) => {
    try {
        const belts = await prisma_1.default.championshipBelt.findMany({
            orderBy: [{ rarity: 'asc' }, { name: 'asc' }],
            include: {
                category: {
                    select: { id: true, name: true, slug: true },
                },
            },
        });
        res.json({ belts });
    }
    catch (error) {
        console.error('Get belts error:', error);
        res.status(500).json({ error: { message: 'Failed to get belts' } });
    }
});
// Get current user's belts
router.get('/user', auth_1.authenticate, async (req, res) => {
    try {
        const userBelts = await prisma_1.default.userBelt.findMany({
            where: { userId: req.user.id },
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
        const allBelts = await prisma_1.default.championshipBelt.findMany({
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
    }
    catch (error) {
        console.error('Get user belts error:', error);
        res.status(500).json({ error: { message: 'Failed to get user belts' } });
    }
});
// Toggle belt display status
router.put('/:id/display', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userBelt = await prisma_1.default.userBelt.findFirst({
            where: {
                beltId: id,
                userId: req.user.id,
            },
        });
        if (!userBelt) {
            res.status(404).json({ error: { message: 'Belt not owned' } });
            return;
        }
        // If displaying, limit to 3 displayed belts
        if (!userBelt.isDisplayed) {
            const displayedCount = await prisma_1.default.userBelt.count({
                where: { userId: req.user.id, isDisplayed: true },
            });
            if (displayedCount >= 3) {
                res.status(400).json({
                    error: { message: 'Maximum 3 belts can be displayed. Hide one first.' },
                });
                return;
            }
        }
        const updated = await prisma_1.default.userBelt.update({
            where: { id: userBelt.id },
            data: { isDisplayed: !userBelt.isDisplayed },
            include: { belt: true },
        });
        res.json({ belt: updated });
    }
    catch (error) {
        console.error('Toggle belt display error:', error);
        res.status(500).json({ error: { message: 'Failed to update belt' } });
    }
});
// Get belt details with Big Blue Cage product link
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const belt = await prisma_1.default.championshipBelt.findUnique({
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
    }
    catch (error) {
        console.error('Get belt details error:', error);
        res.status(500).json({ error: { message: 'Failed to get belt details' } });
    }
});
exports.default = router;
//# sourceMappingURL=belts.js.map