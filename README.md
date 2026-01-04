# AI Coaching Platform Demo

A personalized AI life coaching platform with real-time chat, crisis detection, challenge tracking, and gamification.

## Features

- **AI Chat** - Real-time conversations with Claude AI as your personal coach
- **Personalized Coaching** - AI adapts based on your goals, challenges, and communication preferences
- **Crisis Detection** - Automatic keyword scanning with safety resources (safety critical)
- **Challenge Tracking** - AI automatically detects goals from conversations and tracks them
- **Gamification** - Streaks, achievements, and progress stats
- **Admin Dashboard** - Monitor users, review crisis alerts, view platform stats

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude API (Anthropic)

## Setup

### 1. Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Anthropic API key

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase-schema.sql`
3. Get your project URL and keys from Settings > API

### 3. Environment Variables

**Backend** (`backend/.env`):
```env
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
ANTHROPIC_API_KEY=your_anthropic_api_key
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001
```

### 4. Install Dependencies

```bash
npm run install:all
```

### 5. Run Development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/onboarding` - Complete onboarding

### Chat
- `GET /api/chat/conversations` - List conversations
- `POST /api/chat/conversations` - Create conversation
- `GET /api/chat/conversations/:id/messages` - Get messages
- `POST /api/chat/conversations/:id/messages` - Send message (+ AI response)

### Challenges
- `GET /api/challenges` - List challenges
- `POST /api/challenges` - Create challenge
- `PATCH /api/challenges/:id` - Update challenge

### Stats & Gamification
- `GET /api/stats` - Get user stats
- `GET /api/stats/achievements` - Get achievements

### Admin (requires admin role)
- `GET /api/admin/users` - List all users
- `GET /api/admin/crisis-alerts` - Get crisis alerts
- `PATCH /api/admin/crisis-alerts/:id/review` - Mark alert reviewed
- `GET /api/admin/stats` - Platform statistics

## Project Structure

```
ai-coaching-demo/
├── backend/
│   └── src/
│       ├── config/         # Supabase client
│       ├── controllers/    # Route handlers
│       ├── middleware/     # Auth middleware
│       ├── routes/         # API routes
│       ├── services/       # Business logic (AI, crisis, gamification)
│       ├── types/          # TypeScript types
│       └── index.ts        # Express app
├── frontend/
│   └── src/
│       ├── components/     # React components
│       ├── context/        # Auth context
│       ├── pages/          # Page components
│       ├── services/       # API client
│       ├── types/          # TypeScript types
│       └── App.tsx         # Main app with routing
├── supabase-schema.sql     # Database schema
└── README.md
```

## Key Implementation Details

### Crisis Detection
The system scans messages for keywords related to self-harm or suicide and:
1. Flags the message in the database
2. Creates an alert for admin review
3. Shows safety resources to the user
4. Adjusts AI response to be more supportive

### Challenge Detection
When you mention goals in chat (e.g., "I want to exercise more"), the AI:
1. Detects the goal using Claude
2. Automatically creates a challenge entry
3. Tracks it in your dashboard

### Personalization
During onboarding, you select:
- Goals (what you want to achieve)
- Challenges (what's holding you back)
- Communication style (supportive, direct, or motivational)
- Focus areas (career, health, relationships, etc.)

This information is used to customize the AI's system prompt.

## License

MIT
