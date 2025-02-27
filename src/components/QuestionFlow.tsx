import { useState } from "react";
import { ProductCard } from "./ProductCard";
import { AnalyzedProduct, ProductAnalysis } from "@/src/types/types";
import Image from "next/image";

type FlavorProfile = {
  id: string;
  question: string;
  options: {
    text: string;
    nextQuestion?: string;
    result?: AnalyzedProduct[];
  }[];
};

interface QuestionFlowProps {
  flavorQuestions: FlavorProfile[];
  onReset: () => void;
  onQuestionsUpdate?: (newQuestions: FlavorProfile[]) => void;
  products: AnalyzedProduct[];
}

interface Option {
  text: string;
  nextQuestion?: string;
  result?: AnalyzedProduct[];
}

interface QuestionHistory {
  questionId: string;
  selectedOptionIndex: number;
}

export const QuestionFlow: React.FC<QuestionFlowProps> = ({
  flavorQuestions,
  onReset,
  onQuestionsUpdate,
  products
}) => {
  const [currentQuestion, setCurrentQuestion] = useState("Q1");
  const [questionHistory, setQuestionHistory] = useState<QuestionHistory[]>([]);
  const [selectedBeans, setSelectedBeans] = useState<AnalyzedProduct[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isAIBaristaModeEnabled, setIsAIBaristaModeEnabled] = useState(false);

  const handleOptionClick = (option: Option, optionIndex: number) => {
    // 履歴に現在の質問と選択したオプションを追加
    setQuestionHistory(prev => [...prev, {
      questionId: currentQuestion,
      selectedOptionIndex: optionIndex
    }]);

    if (option.nextQuestion) {
      setCurrentQuestion(option.nextQuestion);
    }
    if (option.result) {
      setSelectedBeans(option.result);
    }
  };

  const handleBack = () => {
    if (questionHistory.length === 0) {
      handleReset();
      return;
    }

    // 履歴から最後の項目を削除
    const newHistory = [...questionHistory];
    const lastQuestion = newHistory.pop();
    setQuestionHistory(newHistory);

    // 前の質問に戻る
    if (lastQuestion) {
      setCurrentQuestion(lastQuestion.questionId);
    } else {
      setCurrentQuestion("Q1");
    }

    // 結果表示をクリア
    setSelectedBeans([]);
  };

  const handleReset = () => {
    setCurrentQuestion("Q1");
    setQuestionHistory([]);
    setSelectedBeans([]);
    // AIバリスタモードが有効な場合は、元の質問フローに戻らない
    if (!isAIBaristaModeEnabled) {
      onReset();
    }
  };

  const handleAIBaristaModeChange = (enabled: boolean) => {
    setIsAIBaristaModeEnabled(enabled);
    if (!enabled) {
      // AIバリスタモードを解除したら質問フローをリセット
      handleReset();
    }
  };

  const handleRegenerateQuestions = async () => {
    try {
      setIsRegenerating(true);
      const response = await fetch('/api/regenerate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products }),
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error || '質問フローの生成に失敗しました');
      }

      // AIバリスタが生成した質問フローを使用
      setCurrentQuestion("Q1");
      setQuestionHistory([]);
      setSelectedBeans([]);
      onReset();

      // 一時的な質問フローとして使用（保存はしない）
      if (onQuestionsUpdate) {
        onQuestionsUpdate(data);
      }
    } catch (error) {
      console.error('質問の再生成に失敗:', error);
      alert(`質問フローの生成に失敗しました。\n${error instanceof Error ? error.message : 'エラーが発生しました。'}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const currentQ = flavorQuestions.find(q => q.id === currentQuestion);

  if (!selectedBeans.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleRegenerateQuestions}
              disabled={isRegenerating || !isAIBaristaModeEnabled}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-md ${
                isAIBaristaModeEnabled
                  ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white hover:from-fuchsia-700 hover:to-purple-700 hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRegenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>AIバリスタに相談</span>
                </>
              )}
            </button>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAIBaristaModeEnabled}
                onChange={(e) => handleAIBaristaModeChange(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">AIバリスタモード（研修中）</span>
            </label>
          </div>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-700">
              {currentQ?.question}
            </h2>
            {questionHistory.length > 0 && (
              <button
                onClick={handleBack}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
              >
                戻る
              </button>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {currentQ?.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionClick(option, index)}
              className="w-full p-3 text-left rounded-md bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200 text-gray-800"
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
      <div className="flex justify-end mb-6 gap-4">
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
        >
          前に戻る
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
        >
          最初からやり直す
        </button>
      </div>
      <h2 className="text-xl font-semibold mb-6 text-gray-700">
        おすすめのコーヒー豆
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {selectedBeans.map((bean, index) => (
          <ProductCard
            key={index}
            productName={bean.name}
            productAnalysis={{
              name: bean.name,
              description: bean.description,
              焙煎度: bean.焙煎度,
              風味ノート: bean.風味ノート,
              特徴: bean.特徴,
              要約: bean.要約
            }}
            tags={bean.tags || {
              焙煎度タグ: [],
              風味タグ: [],
              特徴タグ: []
            }}
            price={bean.price}
            link={bean.link}
          />
        ))}
      </div>
    </div>
  );
}; 