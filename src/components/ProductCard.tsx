import React from 'react';
import { ProductAnalysis, TagsResult } from '@/src/types/types';

interface ProductCardProps {
  productName: string;
  productAnalysis: ProductAnalysis;
  tags: TagsResult;
  price: string;
  link: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  productName,
  productAnalysis,
  tags,
  price,
  link
}) => {
  // 商品名から不要な文字列を削除
  const cleanProductName = productName
    .replace(/送料無料/g, '')
    .replace(/100g/g, '')
    .trim();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <h3 className="text-xl font-bold mb-3">{cleanProductName}</h3>
      
      {/* 要約 */}
      <p className="text-gray-600 mb-4">{productAnalysis.要約}</p>
      
      {/* 焙煎度 */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">焙煎度</h4>
        <div className="flex flex-wrap gap-2">
          {tags.焙煎度タグ.map((tag, index) => (
            <span key={index} className="bg-brown-100 text-brown-800 px-2 py-1 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* 風味ノート */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">風味ノート</h4>
        <div className="flex flex-wrap gap-2">
          {tags.風味タグ.map((tag, index) => (
            <span key={index} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* 特徴 */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">特徴</h4>
        <div className="flex flex-wrap gap-2">
          {tags.特徴タグ.map((tag, index) => (
            <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 価格情報 */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">価格</h4>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>100g</span>
          <span>{price}</span>
          <span>送料無料</span>
        </div>
      </div>

      {/* 商品ページリンク */}
      <div className="flex justify-end">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm"
        >
          商品ページ
        </a>
      </div>
    </div>
  );
}; 