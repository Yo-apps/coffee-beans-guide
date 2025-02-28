"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/src/components/ProductCard";
import { TagCloud } from "@/src/components/TagCloud";
import { QuestionFlow } from "@/src/components/QuestionFlow";
import { QuizCard } from "@/src/components/Quiz/QuizCard";
import { QuizFilters } from "@/src/components/Quiz/QuizFilters";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalyzedProduct } from "@/src/types/types";

type FlavorProfile = {
  id: string;
  question: string;
  options: {
    text: string;
    nextQuestion?: string;
    result?: AnalyzedProduct[];
  }[];
};

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

export default function BeanSelector() {
  const [coffeeProducts, setCoffeeProducts] = useState<AnalyzedProduct[]>([]);
  const [officialQuestions, setOfficialQuestions] = useState<FlavorProfile[]>([]);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<FlavorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const productListRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'guide' | 'quiz'>('guide');
  const [quiz, setQuiz] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizFilters, setQuizFilters] = useState({
    language: '',
    category: '',
    difficulty: ''
  });
  const [quizStats, setQuizStats] = useState<QuizStats>(() => {
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/get-data', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new TypeError("応答がJSONではありません");
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (!Array.isArray(data.products) || !Array.isArray(data.questions)) {
          throw new TypeError("データの形式が正しくありません");
        }

        setCoffeeProducts(data.products);
        setOfficialQuestions(data.questions);
      } catch (error) {
        console.error('データの読み込みに失敗:', error);
        // エラーメッセージを表示するなどの処理を追加
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag) ? [] : [tag];
      if (newTags.length > 0) {
        setTimeout(() => {
          productListRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      }
      return newTags;
    });
  };

  const filteredProducts = coffeeProducts.filter(product => {
    if (selectedTags.length === 0) return true;
    
    const allTags = [
      ...(product.tags?.焙煎度タグ || []),
      ...(product.tags?.風味タグ || []),
      ...(product.tags?.特徴タグ || [])
    ];
    
    return selectedTags.every(tag => allTags.includes(tag));
  });

  const fetchQuiz = async (params?: any, isRetry = false) => {
    try {
      if (!isRetry) {
        setQuizLoading(true);
      }
      
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params || quizFilters)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'クイズの取得に失敗しました');
      }
      
      setQuiz(data.data);
      setQuizError(null);
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      if (!isRetry) {
        setQuizLoading(false);
      }
    }
  };

  const handleQuizFilterChange = (filter: string, value: string) => {
    const newFilters = { ...quizFilters, [filter]: value };
    setQuizFilters(newFilters);
    fetchQuiz(newFilters);
  };

  const handleQuizAnswer = (isCorrect: boolean) => {
    setQuizStats((prev: QuizStats) => {
      const newStats = {
        total: prev.total + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        streak: isCorrect ? prev.streak + 1 : 0,
        categories: {
          ...prev.categories,
          [quiz.category]: (prev.categories[quiz.category] || 0) + 1
        }
      };
      localStorage.setItem('quizStats', JSON.stringify(newStats));
      return newStats;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="w-full bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-8 py-4">
          <div className="flex items-center mb-4">
            <Link href="https://somacoffee.net" className="mr-8">
              <Image
                src="/soma-logo.png"
                alt="Soma Coffee Logo"
                width={180}
                height={90}
                priority
                style={{
                  width: '180px',
                  height: 'auto',
                  objectFit: 'contain',
                  maxWidth: '100%'
                }}
              />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Coffee Beans Guide
              </h1>
              <p className="text-gray-600 mt-1">
                当店のAIバリスタがお好みの豆選びをお手伝いします
              </p>
            </div>
          </div>
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'guide'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              豆選びガイド
            </button>
            <button
              onClick={() => {
                setActiveTab('quiz');
                if (!quiz) fetchQuiz();
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'quiz'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              コーヒークイズ
            </button>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'guide' ? (
            <>
              <QuestionFlow
                flavorQuestions={aiGeneratedQuestions.length > 0 ? aiGeneratedQuestions : officialQuestions}
                onReset={() => {
                  setSelectedTags([]);
                  setAiGeneratedQuestions([]);
                }}
                onQuestionsUpdate={(newQuestions) => {
                  setAiGeneratedQuestions(newQuestions);
                  setSelectedTags([]);
                }}
                products={coffeeProducts}
              />

              {/* タグクラウド */}
              <div className="mt-8 mb-8">
                <TagCloud
                  allTags={coffeeProducts.map(p => p.tags || {
                    焙煎度タグ: [],
                    風味タグ: [],
                    特徴タグ: []
                  })}
                  onTagClick={handleTagClick}
                  selectedTags={selectedTags}
                />
              </div>

              {/* コーヒー豆一覧セクション */}
              <div ref={productListRef} className="bg-white rounded-lg shadow-md p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-700">
                    オンラインショップのコーヒー豆一覧
                  </h2>
                  <Link
                    href="https://somacoffee.shopselect.net/"
                    className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    オンラインショップTOPへ
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={index}
                      productName={product.name}
                      productAnalysis={{
                        name: product.name,
                        description: product.description,
                        焙煎度: product.焙煎度,
                        風味ノート: product.風味ノート,
                        特徴: product.特徴,
                        要約: product.要約
                      }}
                      tags={product.tags || {
                        焙煎度タグ: [],
                        風味タグ: [],
                        特徴タグ: []
                      }}
                      price={product.price}
                      link={product.link}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-8">
              {/* スコアボード */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white rounded-lg shadow-md"
              >
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-gray-600">正解率</p>
                    <p className="text-2xl font-bold">
                      {quizStats.total > 0
                        ? Math.round((quizStats.correct / quizStats.total) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">連続正解</p>
                    <p className="text-2xl font-bold">{quizStats.streak}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">総問題数</p>
                    <p className="text-2xl font-bold">{quizStats.total}</p>
                  </div>
                </div>
              </motion.div>

              {/* フィルター */}
              <QuizFilters
                language={quizFilters.language}
                category={quizFilters.category}
                difficulty={quizFilters.difficulty}
                onFilterChange={handleQuizFilterChange}
              />

              {/* クイズカード */}
              <AnimatePresence mode="wait">
                {quizLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center items-center h-64"
                  >
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </motion.div>
                ) : quizError ? (
                  <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
                    <p className="text-gray-600 mb-4">{quizError}</p>
                    <button
                      onClick={() => fetchQuiz()}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      再試行
                    </button>
                  </div>
                ) : quiz ? (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    onAnswer={handleQuizAnswer}
                    onNext={() => fetchQuiz()}
                  />
                ) : null}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* フッター */}
      <footer className="w-full bg-gray-800 text-white py-6">
        <div className="max-w-4xl mx-auto px-8 flex justify-between items-center">
          <p className="text-sm">© 2024 SOMA COFFEE KYOTO</p>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            管理ページ
          </Link>
        </div>
      </footer>
    </div>
  );
}
