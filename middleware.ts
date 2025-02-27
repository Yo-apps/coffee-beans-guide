import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// 環境変数からJWTシークレットを取得
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-at-least-32-characters'
);

export async function middleware(request: NextRequest) {
  // ログインページへのアクセスは認証をスキップ
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  // 管理者ページのパスチェック
  if (request.nextUrl.pathname.startsWith('/admin')) {
    try {
      // セッショントークンの取得と検証
      const token = request.cookies.get('admin_token')?.value;
      if (!token) {
        throw new Error('認証トークンがありません');
      }

      // JWTトークンの検証
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (error) {
      // 認証エラー時はログインページにリダイレクト
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}

// 管理者ページのパスパターンを指定
export const config = {
  matcher: '/admin/:path*'
}; 