import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

// 環境変数の読み込み
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// 環境変数の設定
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL_VERSION = process.env.GEMINI_MODEL_VERSION || 'gemini-pro';
const GEMINI_MAX_TOKENS = parseInt(process.env.GEMINI_MAX_TOKENS || '8192');

if (!GEMINI_API_KEY) {
  console.error('環境変数GEMINI_API_KEYが設定されていません');
  process.exit(1);
}

// Gemini APIの初期化
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: GEMINI_MODEL_VERSION,
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: GEMINI_MAX_TOKENS,
  },
});

// データ型定義
interface RawData {
  title: string;
  content: string;
  metadata: {
    url: string;
    language: string;
    source: string;
    scrapedAt: string;
  };
}

interface ProcessedData {
  title: string;
  content: string;
  metadata: {
    url: string;
    language: string;
    source: string;
    scrapedAt: string;
    processedAt: string;
  };
  analysis: {
    topics: string[];
    keyPoints: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    summary: string;
    trustScore: number;
  };
  translation?: {
    title: string;
    content: string;
    analysis: {
      topics: string[];
      keyPoints: string[];
      summary: string;
    };
  };
}

// Webスクレイピング関数
async function scrapeWebsite(url: string): Promise<RawData> {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // ここでサイトに応じたスクレイピングロジックを実装
    const title = $('h1').first().text().trim();
    const content = $('article').text().trim();
    
    return {
      title,
      content,
      metadata: {
        url,
        language: 'en',
        source: new URL(url).hostname,
        scrapedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    throw error;
  }
}

// Geminiを使用したコンテンツ分析
async function analyzeContent(data: RawData): Promise<ProcessedData> {
  const prompt = `
コーヒーに関する以下の記事を分析し、JSONフォーマットで結果を返してください。
マークダウンやコードブロックは使用せず、純粋なJSONのみを返してください。

以下の形式で結果を生成してください：
{
  "topics": ["トピック1", "トピック2", ...],
  "keyPoints": ["重要なポイント1", "重要なポイント2", ...],
  "difficulty": "beginner/intermediate/advanced",
  "summary": "300文字程度の要約",
  "trustScore": 0-100の信頼性スコア
}

記事のタイトル：${data.title}
記事の内容：
${data.content}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // JSONの開始位置と終了位置を見つける
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}') + 1;
    
    if (startIndex === -1 || endIndex === 0) {
      throw new Error('有効なJSONが見つかりませんでした');
    }
    
    // JSONの部分だけを抽出して解析
    const jsonText = text.substring(startIndex, endIndex);
    const analysis = JSON.parse(jsonText);
    
    return {
      ...data,
      metadata: {
        ...data.metadata,
        processedAt: new Date().toISOString()
      },
      analysis
    };
  } catch (error) {
    console.error('コンテンツの分析中にエラーが発生しました:', error);
    if (error instanceof Error) {
      console.error('エラーの詳細:', error.message);
    }
    throw error;
  }
}

// 翻訳機能
async function translateContent(data: ProcessedData): Promise<ProcessedData> {
  if (data.metadata.language !== 'en') {
    return data;
  }

  const prompt = `
以下の英語のコーヒーに関する記事を日本語に翻訳してください。
専門用語は正確に、かつ自然な日本語になるように翻訳してください。
結果は以下の形式のJSONで返してください：

{
  "title": "タイトルの翻訳",
  "content": "本文の翻訳",
  "analysis": {
    "topics": ["トピック1の翻訳", "トピック2の翻訳", ...],
    "keyPoints": ["重要ポイント1の翻訳", "重要ポイント2の翻訳", ...],
    "summary": "要約の翻訳"
  }
}

原文：
タイトル：${data.title}
本文：${data.content}
トピック：${JSON.stringify(data.analysis.topics)}
重要ポイント：${JSON.stringify(data.analysis.keyPoints)}
要約：${data.analysis.summary}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}') + 1;
    
    if (startIndex === -1 || endIndex === 0) {
      throw new Error('有効なJSONが見つかりませんでした');
    }
    
    const jsonText = text.substring(startIndex, endIndex);
    const translation = JSON.parse(jsonText);
    
    return {
      ...data,
      translation
    };
  } catch (error) {
    console.error('翻訳中にエラーが発生しました:', error);
    if (error instanceof Error) {
      console.error('エラーの詳細:', error.message);
    }
    throw error;
  }
}

// データの保存
async function saveProcessedData(data: ProcessedData): Promise<void> {
  const processedDir = path.join(process.cwd(), 'database', 'processed');
  await ensureDirectory(processedDir);
  
  const timestamp = new Date().getTime();
  const filename = `${timestamp}_${new URL(data.metadata.url).hostname.replace(/[^a-z0-9]/gi, '_')}.json`;
  const filePath = path.join(processedDir, filename);
  
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`処理済みデータを保存しました: ${filePath}`);
}

// ディレクトリの作成
async function ensureDirectory(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// 生データの読み込み
async function loadRawData(): Promise<RawData[]> {
  const rawDir = path.join(process.cwd(), 'database', 'raw');
  const files = await fs.readdir(rawDir);
  const jsonFiles = files.filter(file => file.endsWith('.json'));
  
  const rawDataList: RawData[] = [];
  for (const file of jsonFiles) {
    const filePath = path.join(rawDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    rawDataList.push(JSON.parse(content));
  }
  
  return rawDataList;
}

// メイン実行関数
export async function buildKnowledgeBase() {
  try {
    // 1. 生データの読み込み
    console.log('生データを読み込んでいます...');
    const rawDataList = await loadRawData();
    console.log(`${rawDataList.length}件の生データを読み込みました`);
    
    // 2. データの分析と処理
    console.log('\nデータを分析しています...');
    for (const rawData of rawDataList) {
      try {
        console.log(`分析中: ${rawData.metadata.url}`);
        const processedData = await analyzeContent(rawData);
        
        // 3. 英語コンテンツの翻訳
        if (processedData.metadata.language === 'en') {
          console.log(`翻訳中: ${rawData.metadata.url}`);
          const translatedData = await translateContent(processedData);
          await saveProcessedData(translatedData);
        } else {
          await saveProcessedData(processedData);
        }
      } catch (error) {
        console.error(`データの処理に失敗しました (${rawData.metadata.url}):`, error);
      }
    }
    
    console.log('\nナレッジベースの構築が完了しました');
  } catch (error) {
    console.error('ナレッジベースの構築に失敗しました:', error);
    throw error;
  }
}

// スクリプト実行
if (require.main === module) {
  buildKnowledgeBase()
    .then(() => console.log('処理が完了しました'))
    .catch(console.error);
} 