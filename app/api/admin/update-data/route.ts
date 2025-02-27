import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

export async function POST() {
  try {
    // スクリプトのパスを取得（絶対パスを使用）
    const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'updateCoffeeData.ts');
    
    // PowerShell用のコマンドを構築
    const command = `npx ts-node "${scriptPath}"`;
    
    console.log('データ更新を開始します...');
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
      cwd: process.cwd()
    });

    // 出力をログに記録
    if (stdout) console.log('標準出力:', stdout);
    if (stderr) console.error('標準エラー:', stderr);

    return NextResponse.json({ 
      success: true,
      message: 'データ更新が完了しました',
      details: { stdout, stderr }
    });

  } catch (error) {
    console.error('データ更新に失敗:', error);
    const errorMessage = error instanceof Error ? 
      `${error.message}\n${(error as any).stderr || ''}` : 
      'データ更新に失敗しました';

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: error
      },
      { status: 500 }
    );
  }
} 