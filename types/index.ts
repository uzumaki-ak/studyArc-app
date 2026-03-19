export type Rarity = "common" | "rare" | "epic" | "legendary";
export type Role = "student" | "teacher" | "admin";
export type ChallengeType = "mcq" | "code" | "short";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: Role;
  streak_count: number;
  last_active_date: string | null;
  total_xp: number;
  level: number;
  hearts: number;
  heart_last_regen: string;
  streak_freeze_count: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  published: boolean;
  teacher_id: string;
}

export interface Skill {
  id: string;
  course_id: string;
  name: string;
  order_index: number;
}

export interface Challenge {
  id: string;
  skill_id: string;
  type: ChallengeType;
  question_data: {
    text: string;
    options?: string[];
    hints?: string[];
  };
  correct_answer: string;
  difficulty: number;
  xp_reward: number;
}

export interface Pet {
  id: string;
  name: string;
  sprite_file: string;
  rarity: Rarity;
  min_xp_to_evolve: number;
}

export interface UserPet {
  id: string;
  pet_id: string;
  nickname: string | null;
  xp: number;
  level: number;
  last_interacted: string;
  pets: Pet;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  rarity: Rarity;
}
