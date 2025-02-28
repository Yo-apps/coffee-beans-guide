'use client';

import React, { useState, useEffect } from 'react';
import { QuizCard } from '../components/Quiz/QuizCard';
import { QuizFilters } from '../components/Quiz/QuizFilters';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizStats {
  total: number;
  correct: number;
  streak: number;
  categories: { [key: string]: number };
}

interface QuizFiltersState {
  language: string;
  category: string;
  difficulty: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  retryAfter?: number;
  validationErrors?: Array<{
    field: string;
    message: string;
    validValues: string[];
  }>;
}

export default function QuizPage() {
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [filters, setFilters] = useState<QuizFiltersState>({
    language: '',
    category: '',
    difficulty: ''
  });
  const [stats, setStats] = useState<QuizStats>(() => {
    // LocalStorageから統計データを読み込む
    if (typeof window !== 'undefined') {
      const savedStats = localStorage.getItem('quizStats');
      return savedStats ? JSON.parse(savedStats) : {
        total: 0,
        correct: 0,
        streak: 0,
        categories: {}
      };
    }
    return {
      total: 0,
      correct: 0,
      streak: 0,
      categories: {}
    };
  });

  const fetchQuiz = async (params?: QuizFiltersState, isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
      }
      
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params || filters)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        const errorResponse = data as ErrorResponse;
        
        // バリデーションエラーの場合
        if (errorResponse.validationErrors) {
          const errorMessages = errorResponse.validationErrors
            .map(err => `${err.field}: ${err.message}`)
            .join('\n');
          throw new Error(errorMessages);
        }
        
        // 再試行可能なエラーの場合
        if (errorResponse.retryAfter && retryCount < 3) {
          console.log(`${errorResponse.retryAfter}秒後に再試行します...`);
          setRetryCount(prev => prev + 1);
          await new Promise(resolve => setTimeout(resolve, (errorResponse.retryAfter || 3) * 1000));
          return fetchQuiz(params, true);
        }
        
        // フィルター条件が厳しすぎる場合
        if (errorResponse.error?.includes('フィルター条件を緩和')) {
          setFilters({
            language: '',
            category: '',
            difficulty: ''
          });
          return fetchQuiz({
            language: '',
            category: '',
            difficulty: ''
          }, true);
        }
        
        throw new Error(errorResponse.error || 'クイズの取得に失敗しました');
      }
      
      setQuiz(data.data);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, []);

  const handleFilterChange = (filter: keyof QuizFiltersState, value: string) => {
    const newFilters = { ...filters, [filter]: value };
    setFilters(newFilters);
    fetchQuiz(newFilters);
  };

  const handleAnswer = (isCorrect: boolean) => {
    setStats(prev => {
      const newStats = {
        total: prev.total + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        streak: isCorrect ? prev.streak + 1 : 0,
        categories: {
          ...prev.categories,
          [quiz.category]: (prev.categories[quiz.category] || 0) + 1
        }
      };
      
      // LocalStorageに保存
      localStorage.setItem('quizStats', JSON.stringify(newStats));
      return newStats;
    });
  };

  const handleNext = () => {
    fetchQuiz();
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    fetchQuiz();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4 whitespace-pre-line">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* スコアボード */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-white rounded-lg shadow-md"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-600">正解率</p>
              <p className="text-2xl font-bold">
                {stats.total > 0
                  ? Math.round((stats.correct / stats.total) * 100)
                  : 0}%
              </p>
            </div>
            <div>
              <p className="text-gray-600">連続正解</p>
              <p className="text-2xl font-bold">{stats.streak}</p>
            </div>
            <div>
              <p className="text-gray-600">総問題数</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </motion.div>

        {/* フィルター */}
        <QuizFilters
          language={filters.language}
          category={filters.category}
          difficulty={filters.difficulty}
          onFilterChange={handleFilterChange}
        />

        {/* クイズカード */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-64"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </motion.div>
          ) : quiz ? (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onAnswer={handleAnswer}
              onNext={handleNext}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
} 