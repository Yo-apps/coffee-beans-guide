"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export const AdminSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { name: 'ダッシュボード', path: '/admin/dashboard' },
    { name: '商品データ管理', path: '/admin/products' },
    { name: '質問フロー管理', path: '/admin/questions' },
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('ログアウトに失敗しました');
      }

      // トップページにリダイレクト
      router.push('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      alert('ログアウトに失敗しました');
    }
  };

  return (
    <div className="w-64 bg-gray-800 min-h-screen text-white p-4 flex flex-col">
      <div className="text-xl font-bold mb-4 p-4">管理画面</div>

      {/* トップページとログアウトボタン */}
      <div className="px-2 mb-4 space-y-2">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="block px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          <div className="flex items-center">
            <span>トップページ</span>
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-left rounded-lg bg-red-700 hover:bg-red-600 transition-colors flex items-center"
        >
          <span>ログアウト</span>
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>

      {/* 区切り線 */}
      <div className="border-t border-gray-600 mb-4"></div>
      
      {/* メインナビゲーション */}
      <nav className="flex-grow">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700'
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}; 