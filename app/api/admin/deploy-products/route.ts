import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { AnalyzedProduct } from '@/src/types/types';

export async function POST(request: Request) {
  try {
    // リクエストボディからデータを取得
    const { products } = await request.json();
    
    if (!Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: '不正なデータ形式です' },
        { status: 400 }
      );
    }
    
    // データディレクトリのパスを設定
    const dataDir = path.join(process.cwd(), 'src/data/analyzed');
    
    // ディレクトリの存在確認
    try {
      await fs.access(dataDir);
    } catch (error) {
      // ディレクトリが存在しない場合は作成
      await fs.mkdir(dataDir, { recursive: true });
    }
    
    // タグ付きデータを保存
    const taggedDataPath = path.join(dataDir, 'taggedCoffeeData.json');
    await fs.writeFile(taggedDataPath, JSON.stringify(products, null, 2), 'utf-8');
    
    // 質問フローデータの存在確認
    const questionsPath = path.join(dataDir, 'questionFlow.json');
    try {
      await fs.access(questionsPath);
    } catch (error) {
      // 質問フローデータが存在しない場合は空の配列を保存
      await fs.writeFile(questionsPath, JSON.stringify([], null, 2), 'utf-8');
    }
    
    return NextResponse.json({ 
      success: true,
      message: '商品データのデプロイが完了しました'
    });
  } catch (error) {
    console.error('デプロイに失敗:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'デプロイに失敗しました'
      },
      { status: 500 }
    );
  }
} 