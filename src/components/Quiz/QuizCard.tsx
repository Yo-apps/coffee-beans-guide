import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface QuizOption {
  text: string;
  isCorrect: boolean;
  explanation: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  source: string;
  language: string;
}

interface QuizCardProps {
  quiz: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
  onNext: () => void;
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800'
};

const categoryIcons = {
  basic: '📚',
  beans: '☕',
  roast: '🔥',
  origin: '🌍',
  brewing: '⚗️',
  storage: '📦'
};

export const QuizCard: React.FC<QuizCardProps> = ({ quiz, onAnswer, onNext }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return; // 既に回答済みの場合は何もしない
    setSelectedOption(index);
    setShowExplanation(true);
    onAnswer(quiz.options[index].isCorrect);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg"
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[quiz.difficulty]}`}>
          {quiz.difficulty}
        </span>
        <span className="text-2xl" title={quiz.category}>
          {categoryIcons[quiz.category as keyof typeof categoryIcons]}
        </span>
      </div>

      {/* 質問 */}
      <h3 className="text-xl font-bold mb-6">{quiz.question}</h3>

      {/* 選択肢 */}
      <div className="space-y-4">
        {quiz.options.map((option, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: selectedOption === null ? 1.02 : 1 }}
            whileTap={{ scale: selectedOption === null ? 0.98 : 1 }}
            onClick={() => handleOptionSelect(index)}
            className={`w-full p-4 text-left rounded-lg transition-colors ${
              selectedOption === null
                ? 'hover:bg-gray-50 border border-gray-200'
                : selectedOption === index
                ? option.isCorrect
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-red-100 border-2 border-red-500'
                : option.isCorrect && showExplanation
                ? 'bg-green-100 border-2 border-green-500'
                : 'bg-gray-50 border border-gray-200'
            }`}
            disabled={selectedOption !== null}
          >
            <div className="font-medium">{option.text}</div>
            {showExplanation && (selectedOption === index || option.isCorrect) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 text-sm text-gray-600"
              >
                {option.explanation}
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* フッター */}
      <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
        <a
          href={quiz.source}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-700"
        >
          出典を見る
        </a>
        {showExplanation && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            次の問題へ
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}; 