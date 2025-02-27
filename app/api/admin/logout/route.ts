import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // レスポンスの作成
    const response = NextResponse.json({ success: true });

    // 認証クッキーを削除
    response.cookies.delete('admin_token');

    return response;
  } catch (error) {
    console.error('ログアウトエラー:', error);
    return NextResponse.json(
      { error: 'ログアウト処理に失敗しました' },
      { status: 500 }
    );
  }
} 