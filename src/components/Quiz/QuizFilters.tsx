import React from 'react';
import { motion } from 'framer-motion';

interface QuizFiltersProps {
  language: string;
  category: string;
  difficulty: string;
  onFilterChange: (filter: 'language' | 'category' | 'difficulty', value: string) => void;
}

const languages = [
  { value: '', label: '全て' },
  { value: 'ja', label: '日本語' },
  { value: 'en', label: '英語' }
];

const categories = [
  { value: '', label: '全て' },
  { value: 'basic', label: '基礎知識 📚' },
  { value: 'beans', label: '豆の特徴 ☕' },
  { value: 'roast', label: '焙煎 🔥' },
  { value: 'origin', label: '産地 🌍' },
  { value: 'brewing', label: '抽出 ⚗️' },
  { value: 'storage', label: '保存 📦' }
];

const difficulties = [
  { value: '', label: '全て' },
  { value: 'beginner', label: '初級' },
  { value: 'intermediate', label: '中級' },
  { value: 'advanced', label: '上級' }
];

export const QuizFilters: React.FC<QuizFiltersProps> = ({
  language,
  category,
  difficulty,
  onFilterChange
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow-md mb-6"
    >
      {/* 言語フィルター */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          言語
        </label>
        <select
          value={language}
          onChange={(e) => onFilterChange('language', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* カテゴリーフィルター */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          カテゴリー
        </label>
        <select
          value={category}
          onChange={(e) => onFilterChange('category', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* 難易度フィルター */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          難易度
        </label>
        <select
          value={difficulty}
          onChange={(e) => onFilterChange('difficulty', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {difficulties.map((diff) => (
            <option key={diff.value} value={diff.value}>
              {diff.label}
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  );
}; 