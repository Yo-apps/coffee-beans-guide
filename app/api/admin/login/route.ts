import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// 環境変数から設定を取得
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-at-least-32-characters'
);

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // 認証チェック
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // JWTトークンの生成
    const token = await new SignJWT({
      username: ADMIN_USERNAME,
      role: 'admin'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // レスポンスの作成
    const response = NextResponse.json({ success: true });

    // クッキーにトークンを設定
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24時間
    });

    return response;
  } catch (error) {
    console.error('ログインエラー:', error);
    return NextResponse.json(
      { error: 'ログイン処理に失敗しました' },
      { status: 500 }
    );
  }
} 