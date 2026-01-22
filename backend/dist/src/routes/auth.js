"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const uuid_1 = require("uuid");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Validation rules
const registerValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('username')
        .isLength({ min: 3, max: 20 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-20 characters, alphanumeric and underscores only'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
];
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password required'),
];
// Generate tokens
function generateAccessToken(user) {
    return jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') });
}
function generateRefreshToken() {
    return (0, uuid_1.v4)();
}
// Register
router.post('/register', registerValidation, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
            return;
        }
        const { email, username, password, displayName } = req.body;
        // Check if user exists
        const existingUser = await prisma_1.default.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });
        if (existingUser) {
            const field = existingUser.email === email ? 'email' : 'username';
            res.status(400).json({ error: { message: `User with this ${field} already exists` } });
            return;
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        // Create user
        const user = await prisma_1.default.user.create({
            data: {
                email,
                username,
                passwordHash,
                displayName: displayName || username,
            },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                totalXp: true,
                level: true,
                currentStreak: true,
                createdAt: true,
            },
        });
        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();
        // Store refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await prisma_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            },
        });
        res.status(201).json({
            user,
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: { message: 'Failed to register user' } });
    }
});
// Login
router.post('/login', loginValidation, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
            return;
        }
        const { email, password } = req.body;
        // Find user
        const user = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            res.status(401).json({ error: { message: 'Invalid email or password' } });
            return;
        }
        // Check password
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            res.status(401).json({ error: { message: 'Invalid email or password' } });
            return;
        }
        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();
        // Store refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await prisma_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            },
        });
        const { passwordHash, ...userWithoutPassword } = user;
        res.json({
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: { message: 'Failed to login' } });
    }
});
// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: { message: 'Refresh token required' } });
            return;
        }
        // Find and validate refresh token
        const storedToken = await prisma_1.default.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            res.status(401).json({ error: { message: 'Invalid or expired refresh token' } });
            return;
        }
        // Delete old refresh token
        await prisma_1.default.refreshToken.delete({
            where: { id: storedToken.id },
        });
        // Generate new tokens
        const accessToken = generateAccessToken(storedToken.user);
        const newRefreshToken = generateRefreshToken();
        // Store new refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await prisma_1.default.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: storedToken.user.id,
                expiresAt,
            },
        });
        res.json({
            accessToken,
            refreshToken: newRefreshToken,
        });
    }
    catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: { message: 'Failed to refresh token' } });
    }
});
// Logout
router.post('/logout', auth_1.authenticate, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await prisma_1.default.refreshToken.deleteMany({
                where: {
                    token: refreshToken,
                    userId: req.user.id,
                },
            });
        }
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: { message: 'Failed to logout' } });
    }
});
// Get current user
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                totalXp: true,
                level: true,
                currentStreak: true,
                longestStreak: true,
                lastPlayedDate: true,
                isAdmin: true,
                createdAt: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: { message: 'User not found' } });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: { message: 'Failed to get user' } });
    }
});
// Update profile
router.put('/profile', auth_1.authenticate, async (req, res) => {
    try {
        const { displayName, avatarUrl } = req.body;
        const updateData = {};
        if (displayName !== undefined) {
            if (displayName.length > 50) {
                res.status(400).json({ error: { message: 'Display name must be 50 characters or less' } });
                return;
            }
            updateData.displayName = displayName;
        }
        if (avatarUrl !== undefined) {
            // Validate avatar ID format (simple alphanumeric)
            if (!/^[a-z0-9_-]+$/.test(avatarUrl)) {
                res.status(400).json({ error: { message: 'Invalid avatar ID' } });
                return;
            }
            updateData.avatarUrl = avatarUrl;
        }
        const user = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                totalXp: true,
                level: true,
                currentStreak: true,
                longestStreak: true,
                lastPlayedDate: true,
                isAdmin: true,
                createdAt: true,
            },
        });
        res.json({ user });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: { message: 'Failed to update profile' } });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map