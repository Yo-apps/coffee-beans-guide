import { NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs/promises';

export async function GET() {
  try {
    // パスを修正
    const taggedDataPath = path.join(process.cwd(), 'src/data/analyzed', 'taggedCoffeeData.json');
    const questionsPath = path.join(process.cwd(), 'src/data/analyzed', 'questionFlow.json');

    // ファイルの存在確認
    await Promise.all([
      fs.access(taggedDataPath),
      fs.access(questionsPath)
    ]);

    const [productsData, questionsData] = await Promise.all([
      fs.readFile(taggedDataPath, 'utf-8'),
      fs.readFile(questionsPath, 'utf-8')
    ]);

    // JSONをパース
    const products = JSON.parse(productsData);
    const questions = JSON.parse(questionsData);

    return new NextResponse(
      JSON.stringify({
        products,
        questions
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    console.error('データの取得に失敗:', error);
    
    return new NextResponse(
      JSON.stringify({ error: 'データの取得に失敗しました' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 