// 英語のキーを持つ型定義
export interface ProductAnalysisEnglish {
  name: string;
  description: string;
  roastLevel: string;
  flavorNotes: string[];
  features: string[];
  summary: string;
}

// 日本語のキーを持つ型定義
export interface ProductAnalysis {
  name: string;
  description: string;
  焙煎度: string;
  風味ノート: string[];
  特徴: string[];
  要約: string;
}

// タグ生成結果の型定義
export interface TagsResult {
  焙煎度タグ: string[];
  風味タグ: string[];
  特徴タグ: string[];
}

// スクレイピングした商品データの型定義
export interface ScrapedProduct {
  name: string;
  price: string;
  description: string;
  link: string;
  soldOut: boolean;
}

// 分析済み商品データの型定義
export interface AnalyzedProduct extends ScrapedProduct, ProductAnalysis {
  soldOut: boolean;
  tags?: TagsResult;
}

export interface CoffeeProduct {
  name: string;
  price: string;
  description: string;
  link: string;
  roastLevel: string;
  flavorNotes: string[];
  features: string[];
  soldOut: boolean;
}

export interface FlavorProfile {
  id: string;
  question: string;
  options: {
    text: string;
    nextQuestion?: string;
    result?: AnalyzedProduct[];
  }[];
} 