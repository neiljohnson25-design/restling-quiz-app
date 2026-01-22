import { create } from 'zustand';
import api from '../api/client';
import type { Question, AnswerResult, Category } from '../types';

interface QuizState {
  categories: Category[];
  currentQuestions: Question[];
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  answerResult: AnswerResult | null;
  sessionStats: {
    correct: number;
    total: number;
    xpEarned: number;
  };
  isLoading: boolean;
  isAnswering: boolean;
  quizComplete: boolean;
  error: string | null;

  fetchCategories: () => Promise<void>;
  startQuiz: (categorySlug?: string, difficulty?: string, count?: number) => Promise<void>;
  submitAnswer: (questionId: string, answer: string, timeTaken: number) => Promise<AnswerResult>;
  nextQuestion: () => void;
  selectAnswer: (answer: string) => void;
  resetQuiz: () => void;
  clearError: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  categories: [],
  currentQuestions: [],
  currentQuestionIndex: 0,
  selectedAnswer: null,
  answerResult: null,
  sessionStats: { correct: 0, total: 0, xpEarned: 0 },
  isLoading: false,
  isAnswering: false,
  quizComplete: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/categories');
      set({ categories: response.data.categories, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Failed to fetch categories',
      });
    }
  },

  startQuiz: async (categorySlug?: string, difficulty?: string, count = 10) => {
    set({ isLoading: true, error: null, quizComplete: false });
    try {
      const params = new URLSearchParams();
      if (categorySlug) params.append('categorySlug', categorySlug);
      if (difficulty) params.append('difficulty', difficulty);
      params.append('count', count.toString());

      const response = await api.get(`/questions/random?${params}`);
      set({
        currentQuestions: response.data.questions,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        answerResult: null,
        sessionStats: { correct: 0, total: 0, xpEarned: 0 },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Failed to start quiz',
      });
    }
  },

  submitAnswer: async (questionId: string, answer: string, timeTaken: number) => {
    set({ isAnswering: true });
    try {
      const response = await api.post(`/questions/${questionId}/answer`, {
        answer,
        timeTaken,
      });
      const result: AnswerResult = response.data.result;

      const stats = get().sessionStats;
      set({
        answerResult: result,
        isAnswering: false,
        sessionStats: {
          correct: stats.correct + (result.isCorrect ? 1 : 0),
          total: stats.total + 1,
          xpEarned: stats.xpEarned + result.xpEarned,
        },
      });

      return result;
    } catch (error: any) {
      set({ isAnswering: false });
      throw error;
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, currentQuestions } = get();
    if (currentQuestionIndex < currentQuestions.length - 1) {
      set({
        currentQuestionIndex: currentQuestionIndex + 1,
        selectedAnswer: null,
        answerResult: null,
      });
    } else {
      set({ quizComplete: true });
    }
  },

  selectAnswer: (answer: string) => {
    set({ selectedAnswer: answer });
  },

  resetQuiz: () => {
    set({
      currentQuestions: [],
      currentQuestionIndex: 0,
      selectedAnswer: null,
      answerResult: null,
      sessionStats: { correct: 0, total: 0, xpEarned: 0 },
      quizComplete: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
