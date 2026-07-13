export interface User {
  id: string;
  name: string;
  login: string;
  role: 'ADMIN' | 'STUDENT';
  points: number;
  avatar?: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  order: number;
  _count?: { categories: number };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  order: number;
  subjectId?: string | null;
  subject?: { id: string; name: string; slug: string } | null;
  _count?: { topics: number };
}

export interface Topic {
  id: string;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  title: string;
  description?: string;
  coverImage?: string;
  has3DModel: boolean;
  order: number;
  _count?: { materials: number; quizzes: number; gameLinks: number };
}

export type MaterialType = 'IMAGE' | 'VIDEO' | 'TEXT' | 'MODEL_3D' | 'DOCUMENT' | 'PRESENTATION' | 'INFOGRAPHIC';

export interface Material {
  id: string;
  topicId: string;
  type: MaterialType;
  title: string;
  content?: string;
  url?: string;
  order: number;
}

export interface Quiz {
  id: string;
  topicId: string;
  fileUrl?: string;
  fileType?: string;
  questionCount: number;
  timeLimit: number;
  answerKey?: Record<string, string>;
}

export interface QuizResult {
  id: string;
  quizId: string;
  score: number;
  correctCount: number;
  totalCount: number;
  earnedPoints: number;
  alreadyAnswered?: boolean;
}

export interface GameLink {
  id: string;
  topicId: string;
  title: string;
  url: string;
  description?: string;
  platform?: string;
  order: number;
}

export interface InfographicQuiz {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface InfographicBlock {
  label: string;
  color?: string;
  items: string[];
  theory?: string;
  imageUrl?: string;
  videoUrl?: string;
  quiz?: InfographicQuiz;
  aiEnabled?: boolean;
}

export type InfographicLayout = 'RADIAL' | 'TIMELINE';

export interface Infographic {
  id: string;
  topicId: string;
  title: string;
  imageUrl?: string | null;
  // Eski blokli format uchun saqlangan maydonlar
  centerLabel?: string | null;
  layout: InfographicLayout;
  note?: string | null;
  order: number;
  blocks: InfographicBlock[];
}

export type InteractiveKind = 'MODEL_3D' | 'SIMULATION' | 'VIRTUAL_LAB';

// Tashqi interaktiv resurs (Sketchfab, PhET va h.k.) — iframe'da ochiladi
export interface Interactive {
  id: string;
  topicId: string;
  kind: InteractiveKind;
  title: string;
  embedUrl: string;
  description?: string | null;
  order: number;
}

export interface TopicDetail extends Topic {
  materials: Material[];
  quizzes: Quiz[];
  gameLinks: GameLink[];
  infographics: Infographic[];
  interactives: Interactive[];
}
