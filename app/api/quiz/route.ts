import { NextResponse } from 'next/server';
import { generateRandomQuiz } from '@/src/scripts/quizGenerator';

export async function GET() {
  try {
    const quiz = await generateRandomQuiz();
    return NextResponse.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('クイズの生成に失敗しました:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'クイズの生成に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
        retryAfter: 3 // 3秒後に再試行を推奨
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { language, category, difficulty } = body;

    // パラメータのバリデーション
    const validLanguages = ['ja', 'en'];
    const validCategories = ['basic', 'beans', 'roast', 'origin', 'brewing', 'storage'];
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];

    const validationErrors = [];

    if (language && !validLanguages.includes(language)) {
      validationErrors.push({
        field: 'language',
        message: '無効な言語が指定されました',
        validValues: validLanguages
      });
    }

    if (category && !validCategories.includes(category)) {
      validationErrors.push({
        field: 'category',
        message: '無効なカテゴリーが指定されました',
        validValues: validCategories
      });
    }

    if (difficulty && !validDifficulties.includes(difficulty)) {
      validationErrors.push({
        field: 'difficulty',
        message: '無効な難易度が指定されました',
        validValues: validDifficulties
      });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'パラメータが無効です',
          validationErrors
        },
        { status: 400 }
      );
    }

    // クイズの生成
    const quiz = await generateRandomQuiz({ language, category, difficulty });
    
    return NextResponse.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('クイズの生成に失敗しました:', error);
    
    // エラーメッセージに基づいて適切なステータスコードを設定
    let statusCode = 500;
    if (error instanceof Error) {
      if (error.message.includes('フィルター条件を緩和')) {
        statusCode = 422; // Unprocessable Entity
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'クイズの生成に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
        retryAfter: 3 // 3秒後に再試行を推奨
      },
      { status: statusCode }
    );
  }
} 