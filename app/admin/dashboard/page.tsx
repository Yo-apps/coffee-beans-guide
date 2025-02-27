"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">管理者ダッシュボード</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link href="/admin/products" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">商品データ管理</h2>
            <p className="text-gray-600">商品情報の閲覧・更新を行います</p>
          </div>
        </Link>

        <Link href="/admin/questions" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">質問フロー管理</h2>
            <p className="text-gray-600">質問フローの生成・デプロイを行います</p>
          </div>
        </Link>
      </div>
    </div>
  );
} 