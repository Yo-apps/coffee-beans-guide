import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { performance } from 'perf_hooks';

const execPromise = promisify(exec);

// キャッシュの設定
const CACHE_DURATION = 5 * 60 * 1000; // 5分
let dataCache = {
  timestamp: 0,
  data: null,
  progress: {
    stage: '',
    message: '',
    percentage: 0
  }
};

// 進捗状況を更新する関数
function updateProgress(stage: string, message: string, percentage: number) {
  dataCache.progress = {
    stage,
    message,
    percentage
  };
  console.log(`進捗状況更新: ${stage} - ${message} (${percentage}%)`);
}

// 進捗状況を取得するためのエンドポイント
export async function OPTIONS() {
  return NextResponse.json({
    progress: dataCache.progress
  });
}

export async function POST() {
  try {
    const startTime = performance.now();
    console.log('データ更新プロセスを開始します...');
    updateProgress('準備', 'データ更新の準備を開始しています...', 0);

    // スクリプトのパスを取得（絶対パスを使用）
    const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'updateCoffeeData.ts');
    const dataPath = path.join(process.cwd(), 'src', 'data', 'analyzed', 'analyzedCoffeeData.json');
    
    // バックアップの作成
    try {
      updateProgress('バックアップ', 'データのバックアップを作成中...', 10);
      const backupPath = path.join(process.cwd(), 'src', 'data', 'analyzed', 'backup');
      await fs.mkdir(backupPath, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await fs.copyFile(
        dataPath,
        path.join(backupPath, `analyzedCoffeeData-${timestamp}.json`)
      );
    } catch (error) {
      console.warn('バックアップの作成に失敗しました:', error);
    }

    updateProgress('データ収集', '商品データの収集を開始しています...', 20);

    // PowerShell用のコマンドを構築
    const command = `npx ts-node "${scriptPath}"`;
    
    console.log('実行コマンド:', command);
    console.log('作業ディレクトリ:', process.cwd());
    
    // スクリプトを実行
    const { stdout, stderr } = await execPromise(command, {
      env: {
        ...process.env,
        PATH: process.env.PATH,
        NODE_PATH: path.join(process.cwd(), 'node_modules'),
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY
      },
      cwd: process.cwd(),
      timeout: 5 * 60 * 1000 // 5分のタイムアウト
    });

    updateProgress('データ解析', '商品データの解析と生成を実行中...', 60);

    // 出力をログに記録
    if (stdout) console.log('標準出力:', stdout);
    if (stderr) console.error('標準エラー:', stderr);

    updateProgress('データ読み込み', '更新されたデータを読み込み中...', 80);

    // 更新されたデータを読み込む
    const productsData = await fs.readFile(dataPath, 'utf-8');
    const products = JSON.parse(productsData);

    updateProgress('完了', 'データの更新が完了しました', 100);

    // キャッシュを更新
    dataCache = {
      timestamp: Date.now(),
      data: products,
      progress: {
        stage: '完了',
        message: 'データの更新が完了しました',
        percentage: 100
      }
    };

    const endTime = performance.now();
    const executionTime = endTime - startTime;
    console.log(`データ更新が完了しました（実行時間: ${executionTime.toFixed(2)}ms）`);

    return NextResponse.json({ 
      success: true,
      message: 'データ更新が完了しました',
      details: { stdout, stderr },
      products: products,
      executionTime: executionTime,
      progress: dataCache.progress
    });

  } catch (error) {
    console.error('データ更新に失敗:', error);
    
    // エラーの種類に応じて適切なメッセージを返す
    let errorMessage = 'データ更新に失敗しました';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('ETIMEDOUT')) {
        errorMessage = 'データ更新がタイムアウトしました';
        statusCode = 504; // Gateway Timeout
      } else if (error.message.includes('ENOENT')) {
        errorMessage = 'スクリプトまたはデータファイルが見つかりません';
        statusCode = 404;
      }
      errorMessage = `${errorMessage}: ${error.message}`;
    }

    // エラー時の進捗状況を更新
    updateProgress('エラー', errorMessage, 0);

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined,
        progress: dataCache.progress
      },
      { status: statusCode }
    );
  }
}

// GETメソッドを追加してキャッシュされたデータを返す
export async function GET() {
  try {
    // キャッシュが有効な場合はキャッシュを返す
    if (dataCache.data && (Date.now() - dataCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        products: dataCache.data,
        fromCache: true,
        progress: dataCache.progress
      });
    }

    // キャッシュが無効な場合はファイルから読み込む
    const dataPath = path.join(process.cwd(), 'src', 'data', 'analyzed', 'analyzedCoffeeData.json');
    const productsData = await fs.readFile(dataPath, 'utf-8');
    const products = JSON.parse(productsData);

    // キャッシュを更新
    dataCache = {
      timestamp: Date.now(),
      data: products,
      progress: {
        stage: '完了',
        message: 'データの読み込みが完了しました',
        percentage: 100
      }
    };

    return NextResponse.json({
      success: true,
      products: products,
      fromCache: false,
      progress: dataCache.progress
    });

  } catch (error) {
    console.error('データの取得に失敗:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'データの取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
        progress: {
          stage: 'エラー',
          message: 'データの取得に失敗しました',
          percentage: 0
        }
      },
      { status: 500 }
    );
  }
} 