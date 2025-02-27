import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

export async function POST() {
  try {
    // スクリプトのパスを取得（相対パスを使用）
    const scriptPath = path.join(process.cwd(), 'scripts', 'updateCoffeeData.ts');
    
    // ts-nodeの実行パスを取得
    const tsNodePath = path.join(process.cwd(), 'node_modules', '.bin', 'ts-node');
    
    // コマンドを構築（Windows環境を考慮）
    const command = `"${tsNodePath}" "${scriptPath}"`;

    console.log('実行するコマンド:', command);

    // コマンドを実行
    const { stdout, stderr } = await execPromise(command, {
      env: {
        ...process.env,
        NODE_PATH: path.join(process.cwd(), 'node_modules'),
        TS_NODE_PROJECT: path.join(process.cwd(), 'tsconfig.json'),
        GEMINI_API_KEY: process.env.GEMINI_API_KEY
      },
      cwd: process.cwd()
    });

    // 出力をログに記録
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    return NextResponse.json({ message: 'データ更新が完了しました' });
  } catch (error) {
    console.error('データ更新に失敗:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'データ更新に失敗しました' },
      { status: 500 }
    );
  }
} 