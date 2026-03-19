# 🎓 StudyArc Mobile

> **Gamified Learning & AI-Powered Collaboration**
>
> StudyArc Mobile is a high-performance React Native application built with Expo, designed to transform studying into an engaging, social, and gamified experience. Integrated with a shared Supabase backend, it offers seamless cross-platform synchronization with the StudyArc Web ecosystem.

---

## 🌟 Core Features

### 🎮 Gamified Learning Hub
- **XP & Leveling System**: Earn experience points for every activity. Progress from **Novice** to **Legend**.
- **Streak & Hearts**: Maintain daily streaks to boost rewards. Use "Hearts" for challenges—lose them all, and you'll need to rest or study to recover.
- **Leaderboards**: Compete with friends and global users to climb the ranks.

### 🤖 AI Study Companion (Study Room)
- **Real-time AI Tutor**: Get instant explanations, feedback on answers, and guidance on complex topics.
- **On-Demand Flashcards**: Simply ask the AI to "generate flashcards" and watch them appear in your shared session.
- **Group Study**: Join real-time sessions with friends to study together, share chat, and collaborate on cards.

### ⚔️ Battle Modes
- **Quiz Battle**: Enter the lobby to match with 2–5 players. Wager your XP in high-stakes MCQ matches—winner takes all.
- **Boss Fight**: Test your speed and accuracy in solo battles against specialized AI bosses.

### 🛡️ social Productivity: "The Shame Blocker"
A unique focus system designed for accountability:
- **AppState Detection**: The app monitors when you switch away to distractions (Instagram, YouTube, etc.).
- **Social Penalty**: If you break your focus, a "Shame Message" is automatically sent to your friends.
- **Accountability Lock**: The app stays restricted until a friend "Forgives" you through their own interface.

### 🐾 Companion System (Pets)
- Collect unique pets through study progress.
- Evolve your companions as you hit major learning milestones.

---

## 🗺️ Route Map & Navigation

The application uses **Expo Router** for a robust, file-based navigation experience.

### Authentication & Onboarding
- `/(auth)/login`: Secure email/password authentication.
- `/(auth)/signup`: Multi-role registration (Student/Teacher).

### Main Dashboard (Tabs)
- `/(tabs)/index`: **The Nexus** — Overview of streaks, hearts, XP, and active enrollments.
- `/(tabs)/battle`: **The Arena** — Hub for Quiz Battles and Boss Fights.
- `/(tabs)/courses`: **The Library** — Discover and enroll in new learning paths.
- `/(tabs)/leaderboard`: **The Rankings** — Competitive global and friend standings.
- `/(tabs)/pets`: **The Sanctuary** — Manage and evolve your study companions.
- `/(tabs)/profile`: **User Command** — Statistics, badges, and account management.

### Deep Learning & Tools
- `/study-room`: Real-time collaboration with AI-driven flashcard generation.
- `/focus`: High-accountability productivity timer ("Shame Blocker").
- `/course/[id]`: Interactive step-by-step learning paths.
- `/challenge/[id]`: Performance-based MCQs and short-answer challenges.
- `/quiz/[roomId]`: Real-time multiplayer battle arena.

---

## 🛠️ Technical Architecture

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (Typed Routes)
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Real-time)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Typography & Theme**: Custom design system with modern HSL palettes and glassmorphism-inspired UI.

---

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- Expo Go app on iOS/Android

### Installation
1. Clone the repository and navigate to the mobile directory:
   ```bash
   cd studyarc-mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env.local` file and populate it with your Supabase and API credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   EXPO_PUBLIC_API_URL=your_backend_api_url
   ```

### Running the App
Start the development server:
```bash
npx expo start
```
Scan the QR code with **Expo Go** to begin your learning journey.

---

Built with ❤️ by the StudyArc Team.
