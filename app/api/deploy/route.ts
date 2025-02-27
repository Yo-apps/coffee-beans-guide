import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { type, data } = await request.json();

    // データを保存するパスを設定
    const dataPath = path.join(process.cwd(), 'data', 'analyzed');
    const filePath = type === 'questions' 
      ? path.join(dataPath, 'questionFlow.json')
      : path.join(dataPath, 'taggedCoffeeData.json');

    // データをJSONファイルとして保存
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('デプロイエラー:', error);
    return NextResponse.json(
      { error: 'デプロイに失敗しました' },
      { status: 500 }
    );
  }
} 