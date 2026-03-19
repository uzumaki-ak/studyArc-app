# StudyArc Mobile (Expo)

React Native app — shares the same Supabase DB as the web app.

## Setup

```bash
cd studyarc-mobile
npm install -g expo-cli
npm install
cp .env.example .env.local
```

Fill `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
EXPO_PUBLIC_API_URL=https://your-web.vercel.app   # or http://localhost:3000 for dev
```

## Run

```bash
npx expo start
```

Scan QR with Expo Go app (iOS/Android).

## Screens

| Screen | Route | Feature |
|---|---|---|
| Login | /(auth)/login | Email/password sign in |
| Signup | /(auth)/signup | Role selection (student/teacher) |
| Home | /(tabs)/ | Streak, hearts, XP, enrolled courses |
| Courses | /(tabs)/courses | Browse + enroll |
| Battle | /(tabs)/battle | Hub for quiz + boss |
| Pets | /(tabs)/pets | Gacha pull, interact |
| Profile | /(tabs)/profile | Stats, badges, sign out |
| Course path | /course/[id] | Duolingo zigzag path |
| Skill | /skill/[id] | Challenge list |
| Challenge | /challenge/[id] | MCQ/short answer, XP animation |
| Quiz Lobby | /quiz/lobby | Create/join room, wager XP |
| Quiz Room | /quiz/[roomId] | Real-time multiplayer |
| Boss | /boss | Solo boss fight |
| Focus | /focus | Shame blocker — AppState detects background |
| Friends | /friends | Add friends, shame inbox, forgive |

## Key mobile feature — Shame Blocker

Uses React Native `AppState` API:
- Start a focus session
- App detects when you switch to another app (goes to background)
- Shame modal opens — pick a message, send to friend
- App stays locked until friend opens the friends screen and taps "Forgive"
- Session resumes automatically

No special Android permissions needed — `AppState` works on both platforms.

## Pet sprites

Drop PNG/GIF files into `assets/pets/`:
```
pet-1.gif ... pet-8.gif
pet-1-evolved.gif ... pet-8-evolved.gif
```

Same files as web. Copy from `studyarc-web/public/pets/`.

## API

All game logic (XP, shame, quiz) calls the web app's API routes via `EXPO_PUBLIC_API_URL`.
This means you only maintain one backend (Next.js) for both platforms.
