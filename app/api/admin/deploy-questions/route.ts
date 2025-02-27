import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { FlavorProfile } from '@/src/types/types';

export async function POST(request: Request) {
  try {
    const { questions } = await request.json() as { questions: FlavorProfile[] };

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: '質問データが不正です' },
        { status: 400 }
      );
    }

    // データディレクトリの存在確認
    const dataDir = path.join(process.cwd(), 'src/data/analyzed');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    // 質問フローを保存
    const questionsPath = path.join(process.cwd(), 'src/data/analyzed', 'questionFlow.json');
    await fs.writeFile(questionsPath, JSON.stringify(questions, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('質問フローのデプロイに失敗:', error);
    return NextResponse.json(
      { error: '質問フローのデプロイに失敗しました' },
      { status: 500 }
    );
  }
} 