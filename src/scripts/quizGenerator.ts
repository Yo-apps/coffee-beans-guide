import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from 'dotenv';

// 環境変数の読み込み
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// 環境変数の設定
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL_VERSION = process.env.GEMINI_MODEL_VERSION || 'gemini-pro';
const GEMINI_MAX_TOKENS = parseInt(process.env.GEMINI_MAX_TOKENS || '8192');
const MAX_RETRIES = 3; // 最大再試行回数

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
interface QuizQuestion {
  id: string;
  question: string;
  options: {
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  source: string;
  language: string;
}

// ナレッジベースからランダムなトピックを取得
async function getRandomTopic(excludeFiles: string[] = []): Promise<{content: string, metadata: any, _filename: string}> {
  const processedDir = path.join(process.cwd(), 'database', 'processed');
  const files = await fs.readdir(processedDir);
  const jsonFiles = files
    .filter(file => file.endsWith('.json'))
    .filter(file => !excludeFiles.includes(file));
  
  if (jsonFiles.length === 0) {
    throw new Error('利用可能な処理済みデータがありません');
  }
  
  const randomFile = jsonFiles[Math.floor(Math.random() * jsonFiles.length)];
  const filePath = path.join(processedDir, randomFile);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  
  return { 
    ...(JSON.parse(fileContent)),
    _filename: randomFile // 内部使用のためにファイル名を追加
  };
}

// クイズの生成
async function generateQuiz(topic: {content: string, metadata: any}): Promise<QuizQuestion> {
  const prompt = `
以下のコーヒーに関する情報から、クイズを1問生成してください。
以下の形式でJSONを生成してください：

{
  "id": "${Date.now()}_${Math.random().toString(36).substring(7)}",
  "question": "質問文（できるだけ具体的で明確な質問を作成してください）",
  "options": [
    {
      "text": "選択肢1（正解）",
      "isCorrect": true,
      "explanation": "この選択肢が正解である理由を詳しく説明"
    },
    {
      "text": "選択肢2",
      "isCorrect": false,
      "explanation": "この選択肢が不正解である理由を説明"
    },
    {
      "text": "選択肢3",
      "isCorrect": false,
      "explanation": "この選択肢が不正解である理由を説明"
    }
  ],
  "difficulty": "beginner/intermediate/advanced（コンテンツの難易度に応じて選択）",
  "category": "以下のカテゴリーから選択：
    - basic（基礎知識）
    - beans（豆の特徴）
    - roast（焙煎）
    - origin（産地）
    - brewing（抽出）
    - storage（保存）",
  "source": "${topic.metadata.url}",
  "language": "${topic.metadata.language}"
}

情報：
${topic.content}

注意事項：
1. 質問は明確で具体的に作成してください
2. 選択肢は必ず3つ作成してください
3. 正解は必ず1つだけにしてください
4. 各選択肢には詳細な説明を付けてください
5. 難易度は内容に応じて適切に設定してください
6. カテゴリーは内容に最も適したものを選択してください
7. 質問と選択肢は${topic.metadata.language === 'ja' ? '日本語' : '英語'}で作成してください
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
    
    const jsonText = text.substring(startIndex, endIndex);
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('クイズの生成中にエラーが発生しました:', error);
    throw error;
  }
}

// クイズの検証
function validateQuiz(quiz: QuizQuestion): { isValid: boolean; error?: string } {
  // 基本的な構造の検証
  if (!quiz.id || !quiz.question || !Array.isArray(quiz.options)) {
    return { isValid: false, error: 'クイズの基本構造が不正です' };
  }
  
  // 選択肢の検証
  if (quiz.options.length !== 3) {
    return { isValid: false, error: '選択肢は3つである必要があります' };
  }
  
  // 正解が1つあることを確認
  const correctAnswers = quiz.options.filter(opt => opt.isCorrect);
  if (correctAnswers.length !== 1) {
    return { isValid: false, error: '正解は1つである必要があります' };
  }
  
  // 必須フィールドの検証
  const requiredFields = ['difficulty', 'category', 'source', 'language'];
  for (const field of requiredFields) {
    if (!quiz[field as keyof QuizQuestion]) {
      return { isValid: false, error: `${field}フィールドが必要です` };
    }
  }
  
  return { isValid: true };
}

// メイン実行関数
export async function generateRandomQuiz(params?: {
  language?: string;
  category?: string;
  difficulty?: string;
}): Promise<QuizQuestion> {
  const usedFiles: string[] = [];
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      attempts++;
      console.log(`試行 ${attempts}/${MAX_RETRIES}`);

      // 1. ランダムなトピックの取得
      console.log('トピックを取得中...');
      const topic = await getRandomTopic(usedFiles);
      usedFiles.push(topic._filename);

      // パラメータによるフィルタリング
      if (params) {
        if (params.language && topic.metadata.language !== params.language) {
          console.log('言語が一致しないためスキップ');
          continue;
        }
      }
      
      // 2. クイズの生成
      console.log('クイズを生成中...');
      const quiz = await generateQuiz(topic);
      
      // 3. クイズの検証
      console.log('クイズを検証中...');
      const validation = validateQuiz(quiz);
      
      if (!validation.isValid) {
        console.log(`検証エラー: ${validation.error}`);
        continue;
      }

      // パラメータによる追加フィルタリング
      if (params) {
        if (params.category && quiz.category !== params.category) {
          console.log('カテゴリーが一致しないためスキップ');
          continue;
        }
        if (params.difficulty && quiz.difficulty !== params.difficulty) {
          console.log('難易度が一致しないためスキップ');
          continue;
        }
      }
      
      return quiz;
    } catch (error) {
      console.error(`試行 ${attempts} でエラーが発生:`, error);
      if (attempts >= MAX_RETRIES) {
        throw new Error('クイズの生成に失敗しました。後でもう一度お試しください。');
      }
    }
  }
  
  throw new Error('有効なクイズを生成できませんでした。フィルター条件を緩和してお試しください。');
}

// テスト実行
if (require.main === module) {
  generateRandomQuiz()
    .then(quiz => {
      console.log('生成されたクイズ:');
      console.log(JSON.stringify(quiz, null, 2));
    })
    .catch(error => {
      console.error('エラーが発生しました:', error);
      process.exit(1);
    });
} 