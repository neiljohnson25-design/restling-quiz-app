# Big Blue Cage Wrestling Quiz

A progressive wrestling trivia web application featuring leaderboards, user progression, collectibles, and championship belt rewards.

## Features

- **17 Quiz Categories** with 1,184 questions covering wrestling history
- **XP & Level Progression** - Earn XP for correct answers, level up to unlock content
- **Daily Challenges** - Complete daily challenges for bonus XP
- **Leaderboards** - Compete on global and weekly leaderboards
- **Achievements** - Unlock achievements for milestones
- **Championship Belts** - Collect virtual belts, linked to real Big Blue Cage products
- **Streak System** - Maintain daily streaks for XP multipliers

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- Rate Limiting

### Frontend
- React + TypeScript + Vite
- Tailwind CSS
- Zustand (State Management)
- React Query
- React Router

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone and Install

```bash
cd wrestling-quiz-app

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Create/edit `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wrestling_quiz?schema=public"

# JWT Secrets (change these in production!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL="http://localhost:5173"
```

### 3. Set Up Database

```bash
cd backend

# Create database (if needed)
createdb wrestling_quiz

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with questions, categories, achievements, and belts
npm run db:seed
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit http://localhost:5173

### Default Admin Account
- Email: `admin@bigbluecage.com`
- Password: `admin123`

## Project Structure

```
wrestling-quiz-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Database seeder
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth middleware
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities (XP calculation, etc.)
│   │   └── index.ts         # Express app
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── images/          # Logo and assets
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── stores/          # Zustand stores
│   │   ├── api/             # API client
│   │   └── types/           # TypeScript types
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Quiz
- `GET /api/categories` - List categories
- `GET /api/questions/random` - Get random questions
- `POST /api/questions/:id/answer` - Submit answer

### Leaderboards
- `GET /api/leaderboards/global` - Global leaderboard
- `GET /api/leaderboards/weekly` - Weekly leaderboard

### Achievements & Belts
- `GET /api/achievements/user` - User's achievements
- `GET /api/belts/user` - User's belts

### Admin (requires admin role)
- `GET /api/admin/questions` - Manage questions
- `GET /api/admin/analytics` - View analytics

## Progression System

### XP Calculation
```
Base XP = 50 (easy), 100 (medium), 150 (hard)
Speed Bonus = (time_limit - time_taken) * 2
Streak Multiplier = 1 + (streak_days * 0.1), max 2x
Total XP = (Base XP + Speed Bonus) * Streak Multiplier
```

### Levels
XP required for level N = 500 * N^1.5

## Deployment

### Recommended: Hetzner Cloud

1. Set up PostgreSQL database
2. Deploy backend as Node.js app
3. Build and deploy frontend as static site
4. Configure environment variables
5. Set up SSL with Cloudflare

### Environment Variables for Production
- Use strong, unique JWT secrets
- Set `NODE_ENV=production`
- Configure proper database URL
- Set frontend URL for CORS

## License

Private - Big Blue Cage
