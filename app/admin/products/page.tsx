"use client";

import { useState, useEffect, useCallback } from "react";
import { ProductCard } from "@/src/components/ProductCard";
import type { AnalyzedProduct } from "@/src/types/types";

interface ProgressInfo {
  stage: string;
  message: string;
  percentage: number;
}

export default function ProductsManagement() {
  const [officialProducts, setOfficialProducts] = useState<AnalyzedProduct[]>([]);
  const [previewProducts, setPreviewProducts] = useState<AnalyzedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
  const [updateDuration, setUpdateDuration] = useState<number | null>(null);
  const [progress, setProgress] = useState<ProgressInfo>({
    stage: '',
    message: '',
    percentage: 0
  });

  // 進捗状況を定期的に確認
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2秒

    const checkProgress = async () => {
      try {
        const response = await fetch('/api/admin/update-data', {
          method: 'OPTIONS',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.progress) {
          setProgress(data.progress);
          setStatusMessage(`${data.progress.stage}: ${data.progress.message}`);
          // エラーカウントをリセット
          retryCount = 0;
        }
      } catch (error) {
        console.error('進捗状況の取得に失敗:', error);
        retryCount++;
        
        if (retryCount >= MAX_RETRIES) {
          setStatusMessage('進捗状況の取得に失敗しました。更新処理は継続中です。');
          // 更新中フラグは維持
        } else {
          // 一定時間待ってから再試行
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    };

    if (isUpdating) {
      // 初回は即時実行
      checkProgress();
      // その後は定期的に実行
      intervalId = setInterval(checkProgress, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isUpdating]);

  // データ読み込み関数をuseCallbackでメモ化
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/update-data', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setOfficialProducts(data.products || []);
      if (data.fromCache) {
        console.log('キャッシュされたデータを使用しています');
      }
      if (data.progress) {
        setProgress(data.progress);
      }
    } catch (error) {
      console.error('商品データの読み込みに失敗:', error);
      setStatusMessage('商品データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleUpdateData = async () => {
    try {
      setIsUpdating(true);
      setStatusMessage('商品データを更新中...');
      setProgress({
        stage: '準備',
        message: 'データ更新の準備を開始しています...',
        percentage: 0
      });
      
      const startTime = Date.now();
      const response = await fetch('/api/admin/update-data', {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // プレビュー版に更新されたデータを設定
      setPreviewProducts(data.products || []);
      setLastUpdateTime(new Date().toLocaleString());
      setUpdateDuration(data.executionTime);
      if (data.progress) {
        setProgress(data.progress);
      }
      setStatusMessage(
        `商品データの更新が完了しました（${data.products?.length || 0}件）\n` +
        `実行時間: ${(data.executionTime / 1000).toFixed(2)}秒`
      );
    } catch (error) {
      console.error('データの更新に失敗:', error);
      setStatusMessage(`データの更新に失敗: ${error instanceof Error ? error.message : 'エラーが発生しました'}`);
      setPreviewProducts([]);
      setProgress({
        stage: 'エラー',
        message: error instanceof Error ? error.message : 'エラーが発生しました',
        percentage: 0
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeployProducts = async () => {
    if (!window.confirm('本当に商品データを本番環境に反映しますか？')) {
      return;
    }

    try {
      setIsDeploying(true);
      setStatusMessage('商品データをデプロイ中...');
      
      const response = await fetch('/api/admin/deploy-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products: previewProducts }),
      });
      
      if (!response.ok) {
        throw new Error('商品データのデプロイに失敗しました');
      }
      
      await loadProducts();
      setPreviewProducts([]);
      setStatusMessage('商品データのデプロイが完了しました');
    } catch (error) {
      console.error('デプロイに失敗:', error);
      setStatusMessage(`デプロイに失敗: ${error instanceof Error ? error.message : 'エラーが発生しました'}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDiscardPreview = () => {
    if (window.confirm('プレビュー版のデータを破棄してもよろしいですか？')) {
      setPreviewProducts([]);
      setStatusMessage('プレビュー版を破棄しました');
    }
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
        <div>
          <h1 className="text-3xl font-bold">商品データ管理</h1>
          {lastUpdateTime && (
            <p className="text-sm text-gray-600 mt-2">
              最終更新: {lastUpdateTime}
              {updateDuration && ` (所要時間: ${(updateDuration / 1000).toFixed(2)}秒)`}
            </p>
          )}
        </div>
        <button
          onClick={handleUpdateData}
          disabled={isUpdating}
          className={`px-4 py-2 rounded-lg transition-all ${
            isUpdating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isUpdating ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              更新中...
            </span>
          ) : (
            '商品データを更新'
          )}
        </button>
      </div>

      {(statusMessage || isUpdating) && (
        <div className="mb-8">
          <div className="p-4 bg-blue-50 text-blue-700 rounded-lg whitespace-pre-line">
            {statusMessage}
          </div>
          {isUpdating && (
            <div className="mt-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      {progress.stage}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {progress.percentage}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div
                    style={{ width: `${progress.percentage}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            正式版 商品データ
            <span className="text-sm text-gray-600 ml-2">
              ({officialProducts.length}件)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officialProducts.map((product, index) => (
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

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              プレビュー版 商品データ
              <span className="text-sm text-gray-600 ml-2">
                ({previewProducts.length}件)
              </span>
            </h2>
            {previewProducts.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleDeployProducts}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {previewProducts.map((product, index) => (
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
      </div>
    </div>
  );
} 