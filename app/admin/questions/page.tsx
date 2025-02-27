"use client";

import { useState, useEffect } from "react";
import { AdminQuestionFlow } from "@/src/components/AdminQuestionFlow";
import type { FlavorProfile, AnalyzedProduct } from "@/src/types/types";

export default function QuestionsManagement() {
  const [officialQuestions, setOfficialQuestions] = useState<FlavorProfile[]>([]);
  const [previewQuestions, setPreviewQuestions] = useState<FlavorProfile[]>([]);
  const [products, setProducts] = useState<AnalyzedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/get-data');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setOfficialQuestions(data.questions || []);
      setProducts(data.products || []);
    } catch (error) {
      console.error('データの読み込みに失敗:', error);
      setStatusMessage('データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateQuestions = async () => {
    try {
      setIsRegenerating(true);
      setStatusMessage('質問フローを生成中...');
      
      const response = await fetch('/api/admin/regenerate-questions', {
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

      setPreviewQuestions(data);
      setStatusMessage('質問フローの生成が完了しました');
    } catch (error) {
      console.error('質問の再生成に失敗:', error);
      setStatusMessage(`質問フローの生成に失敗: ${error instanceof Error ? error.message : 'エラーが発生しました'}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDeployQuestions = async () => {
    try {
      setIsDeploying(true);
      setStatusMessage('質問フローをデプロイ中...');
      
      const response = await fetch('/api/admin/deploy-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions: previewQuestions }),
      });
      
      if (!response.ok) {
        throw new Error('質問フローのデプロイに失敗しました');
      }
      
      await loadData();
      setPreviewQuestions([]);
      setStatusMessage('質問フローのデプロイが完了しました');
    } catch (error) {
      console.error('デプロイに失敗:', error);
      setStatusMessage(`デプロイに失敗: ${error instanceof Error ? error.message : 'エラーが発生しました'}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDiscardPreview = () => {
    setPreviewQuestions([]);
    setStatusMessage('プレビュー版を破棄しました');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">質問フロー管理</h1>
        <button
          onClick={handleRegenerateQuestions}
          disabled={isRegenerating}
          className={`px-4 py-2 rounded-lg transition-all ${
            isRegenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRegenerating ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              生成中...
            </span>
          ) : (
            '質問フローを生成'
          )}
        </button>
      </div>

      {statusMessage && (
        <div className="mb-8 p-4 bg-blue-50 text-blue-700 rounded-lg">
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 正式版 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">正式版</h2>
          <div className="space-y-4">
            <p className="text-gray-600">現在トップページで使用中の質問フロー</p>
            <AdminQuestionFlow
              officialQuestions={officialQuestions}
              previewQuestions={[]}
            />
          </div>
        </div>

        {/* プレビュー版 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">プレビュー版</h2>
              <p className="text-sm text-gray-600 mt-1">新しく生成された質問フロー</p>
            </div>
            {previewQuestions.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleDeployQuestions}
                  disabled={isDeploying}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    isDeploying
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isDeploying ? '適用中...' : 'トップページに適用'}
                </button>
                <button
                  onClick={handleDiscardPreview}
                  className="px-3 py-1 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white"
                >
                  破棄
                </button>
              </div>
            )}
          </div>
          <AdminQuestionFlow
            officialQuestions={[]}
            previewQuestions={previewQuestions}
          />
        </div>
      </div>
    </div>
  );
} 