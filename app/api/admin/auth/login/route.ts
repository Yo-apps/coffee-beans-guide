import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { compare } from 'bcryptjs';

// 環境変数から認証情報を取得
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secure-jwt-secret-key-at-least-32-characters-long'
);

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    console.log('ログイン試行:', {
      入力されたユーザー名: username,
      設定されたユーザー名: ADMIN_USERNAME,
      パスワードハッシュ存在: !!ADMIN_PASSWORD_HASH
    });

    // ユーザー名の確認
    if (username !== ADMIN_USERNAME) {
      console.log('ユーザー名が一致しません');
      return NextResponse.json(
        { success: false, message: 'ユーザー名またはパスワードが間違っています' },
        { status: 401 }
      );
    }

    // パスワードハッシュが設定されていない場合
    if (!ADMIN_PASSWORD_HASH) {
      throw new Error('管理者パスワードが設定されていません');
    }

    // パスワードの検証
    const isValidPassword = await compare(password, ADMIN_PASSWORD_HASH);
    console.log('パスワード検証結果:', {
      検証結果: isValidPassword
    });

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'ユーザー名またはパスワードが間違っています' },
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

    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    // セキュアなクッキーにトークンを設定
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 // 24時間
    });

    return response;
  } catch (error) {
    console.error('ログインエラー:', error);
    return NextResponse.json(
      { success: false, message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
} 