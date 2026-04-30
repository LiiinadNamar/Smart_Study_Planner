/**
 * TypeScript interfaces matching backend Pydantic schemas exactly.
 */

// ===== Auth =====
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// ===== User =====
export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

// ===== Subject =====
export interface Subject {
  id: string;
  title: string;
  target_grade: number;
  credit_hours: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SubjectCreate {
  title: string;
  target_grade?: number;
  credit_hours?: number;
}

export interface SubjectUpdate {
  title?: string;
  target_grade?: number;
  credit_hours?: number;
}

// ===== Task =====
export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: TaskStatus;
  priority: number;
  subject_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  deadline?: string;
  status?: TaskStatus;
  priority?: number;
  subject_id?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  deadline?: string;
  status?: TaskStatus;
  priority?: number;
  subject_id?: string;
}

// ===== Grade =====
export interface Grade {
  id: string;
  score: number;
  weight: number;
  label: string | null;
  date: string;
  subject_id: string;
  created_at: string;
}

export interface GradeCreate {
  score: number;
  weight: number;
  label?: string;
  date: string;
  subject_id: string;
}

export interface GradeForecast {
  subject_id: string;
  subject_title: string;
  target_grade: number;
  current_weighted_average: number;
  total_weight_used: number;
  remaining_weight: number;
  required_score: number | null;
  is_achievable: boolean;
  message: string;
}

// ===== Learning Material =====
export interface LearningMaterial {
  id: string;
  file_url: string | null;
  content_text: string | null;
  ai_summary: string | null;
  subject_id: string;
  created_at: string;
  updated_at: string;
}

export interface SummarizeResponse {
  material_id: string;
  summary: string;
}

// ===== Quiz =====
export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

export interface Quiz {
  id: string;
  material_id: string;
  questions: QuizQuestion[];
  total_questions: number;
  created_at: string;
}

export interface GenerateQuizResponse {
  quiz_id: string;
  questions: QuizQuestion[];
  total_questions: number;
}

// ===== Roadmap =====
export interface RoadmapStep {
  week: number;
  title: string;
  description: string;
  tasks: string[];
}

export interface RoadmapRequest {
  goal: string;
  weeks?: number;
  subject_id?: string;
}

export interface RoadmapResponse {
  goal: string;
  weeks: number;
  roadmap: RoadmapStep[];
  tasks_created: number;
}
