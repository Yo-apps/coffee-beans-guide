import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createGenerateQuestionsPrompt } from '@/src/prompts/generateQuestions';

// Gemini APIの設定
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL_VERSION = process.env.GEMINI_MODEL_VERSION || 'gemini-2.0-flash';
const GEMINI_MAX_TOKENS = parseInt(process.env.GEMINI_MAX_TOKENS || '8192', 10);

console.log('環境変数の状態:', {
  GEMINI_API_KEY: GEMINI_API_KEY ? 'APIキーが設定されています' : 'APIキーが設定されていません',
  NODE_ENV: process.env.NODE_ENV,
});

// APIクライアントの初期化
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// モデル設定
const modelConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: GEMINI_MAX_TOKENS,
};

interface CoffeeProduct {
  name: string;
  price: string;
  description: string;
  extractedInfo?: string;
  link: string;
  roastLevel: string;
  flavorNotes: string[];
  features: string[];
  soldOut: boolean;
}

interface QuestionFlow {
  id: string;
  question: string;
  options: {
    text: string;
    nextQuestion?: string;
    result?: string[];
  }[];
}

export async function POST(request: Request) {
  try {
    // リクエストボディの検証
    const body = await request.json();
    if (!body.products || !Array.isArray(body.products)) {
      return NextResponse.json(
        { error: '商品データが正しい形式ではありません' },
        { status: 400 }
      );
    }

    const { products } = body;

    // Gemini APIキーの検証
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini APIキーが設定されていません' },
        { status: 500 }
      );
    }

    const prompt = createGenerateQuestionsPrompt(products);

    console.log('Gemini API接続を試行中...');
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL_VERSION,
      ...modelConfig
    });
    console.log('モデルの初期化に成功しました');
    
    const result = await model.generateContent(prompt);
    console.log('コンテンツの生成に成功しました');
    
    const response = await result.response;
    const text = response.text();
    console.log('レスポンスの取得に成功しました');

    // JSONの部分を抽出
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Geminiからの応答:', text);
      throw new Error('質問フローのJSONが見つかりませんでした');
    }

    let questionFlow: QuestionFlow[];
    try {
      questionFlow = JSON.parse(jsonMatch[0]) as QuestionFlow[];
      
      // 質問フローの構造を検証
      const validateQuestionFlow = (flow: QuestionFlow[]) => {
        if (!Array.isArray(flow)) {
          throw new Error('質問フローが配列ではありません');
        }
        
        flow.forEach((question, index) => {
          if (!question.id || !question.question || !Array.isArray(question.options)) {
            throw new Error(`質問${index + 1}の必須プロパティが不足しています`);
          }
          
          question.options.forEach((option, optIndex) => {
            if (!option.text) {
              throw new Error(`質問${index + 1}の選択肢${optIndex + 1}にテキストがありません`);
            }
            if (!option.nextQuestion && !option.result) {
              throw new Error(`質問${index + 1}の選択肢${optIndex + 1}に次の質問またはリザルトが設定されていません`);
            }
          });
        });
      };
      
      validateQuestionFlow(questionFlow);
    } catch (e) {
      console.error('JSON解析エラー:', e);
      console.error('解析対象のテキスト:', jsonMatch[0]);
      throw new Error('質問フローのJSONの解析に失敗しました');
    }

    // 商品名から商品オブジェクトへの変換
    const processedFlow = questionFlow.map(q => ({
      ...q,
      options: q.options.map(opt => ({
        ...opt,
        result: opt.result
          ? products.filter((p: CoffeeProduct) => opt.result?.includes(p.name))
          : undefined
      }))
    }));

    // 管理画面用のプレビューデータとして返す（ファイルには保存しない）
    return NextResponse.json(processedFlow);
  } catch (error) {
    console.error('質問フロー生成に失敗:', error);
    const errorMessage = error instanceof Error ? error.message : '質問フロー生成に失敗しました';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 