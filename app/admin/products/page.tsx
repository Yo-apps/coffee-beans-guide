"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/src/components/ProductCard";
import type { AnalyzedProduct } from "@/src/types/types";

export default function ProductsManagement() {
  const [officialProducts, setOfficialProducts] = useState<AnalyzedProduct[]>([]);
  const [previewProducts, setPreviewProducts] = useState<AnalyzedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/get-data');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setOfficialProducts(data.products || []);
    } catch (error) {
      console.error('商品データの読み込みに失敗:', error);
      setStatusMessage('商品データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateData = async () => {
    try {
      setIsUpdating(true);
      setStatusMessage('商品データを更新中...');
      
      const response = await fetch('/api/admin/update-data', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'データの更新に失敗しました');
      }

      if (Array.isArray(data.products)) {
        setPreviewProducts(data.products);
        setStatusMessage(`商品データの更新が完了しました（${data.products.length}件）`);
      } else {
        throw new Error('不正なデータ形式です');
      }
    } catch (error) {
      console.error('データの更新に失敗:', error);
      setStatusMessage(`データの更新に失敗: ${error instanceof Error ? error.message : 'エラーが発生しました'}`);
      setPreviewProducts([]);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeployProducts = async () => {
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
    setPreviewProducts([]);
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
        <h1 className="text-3xl font-bold">商品データ管理</h1>
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

      {statusMessage && (
        <div className="mb-8 p-4 bg-blue-50 text-blue-700 rounded-lg">
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">正式版 商品データ</h2>
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
            <h2 className="text-xl font-semibold">プレビュー版 商品データ</h2>
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