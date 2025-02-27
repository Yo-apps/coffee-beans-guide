import { createTagClassificationPrompt } from '@/src/prompts/classifyTags';

// キーワードベースの分類ルール
const KEYWORD_RULES = {
  roastKeywords: [
    'Lv1', 'Lv2', 'Lv3', 'Lv4', 'Lv5', 'Lv6', 'Lv7', 'Lv8',
    '浅煎り', '中煎り', '中深煎り', '深煎り',
    'ライトロースト', 'シナモンロースト', 'ミディアムロースト',
    'ハイロースト', 'シティーロースト', 'フルシティーロースト',
    'フレンチロースト', 'イタリアンロースト'
  ],
  flavorKeywords: [
    // 基本風味特性
    '酸味', '苦味', '甘味', 'コク', 'すっきり', '甘い',
    '香ばしい', '華やか', 'フルーティー',
    '濃厚', 'まろやか', '滑らか', 'なめらか',
    'クリーン', '上品', '複雑',
    
    // 果実系
    '柑橘', 'レモン', 'オレンジ', 'カシス', 'ブドウ',
    'ベリー', 'ストロベリー', 'アプリコット', 'マンゴー',
    'りんご', 'マスカット', 'グレープフルーツ',
    '赤紫の果実', '南国フルーツ', 'トロピカルフルーツ',
    '完熟', '果実',
    
    // 花・ハーブ系
    'フローラル', '花', 'ジャスミン', 'ローズ',
    'ハーブ', 'スパイシー', 'ハーバル',
    
    // ナッツ・チョコレート系
    'ナッツ', 'アーモンド', 'ヘーゼルナッツ',
    'チョコレート', 'ミルクチョコレート', 'ダークチョコレート',
    'カカオ',
    
    // その他の風味
    'アーシー', 'キャンディー', 'カラメル',
    '白ワイン', '発酵感', 'とろみ',
    '余韻', '後味', '風味'
  ],
  featureKeywords: [
    // 精製方法
    'ウォッシュド', 'ナチュラル', 'ハニー',
    'アナエロビック', 'スマトラ式',
    
    // 栽培・認証
    '無農薬', 'オーガニック', 'スペシャルティ',
    'Qグレード', 'レインフォレスト',
    'シェードグロウン', 'マイクロロット',
    '持続的',
    
    // 生産地特徴
    '標高', '火山性土壌',
    
    // 等級・品種
    'AA', 'SHB', 'G1',
    'ブルボン種', 'カツアイ種', 'カツーラ種',
    'SL28種', 'パカマラ種', 'ゲイシャ種', 'ティピカ種'
  ]
};

// キーワードベースの分類
export const classifyTagByKeywords = (tag: string): '焙煎度' | '風味' | '特徴' => {
  if (KEYWORD_RULES.roastKeywords.some(keyword => tag.includes(keyword))) {
    return '焙煎度';
  }
  if (KEYWORD_RULES.flavorKeywords.some(keyword => tag.includes(keyword))) {
    return '風味';
  }
  if (KEYWORD_RULES.featureKeywords.some(keyword => tag.includes(keyword))) {
    return '特徴';
  }
  return '特徴'; // デフォルト
};

// GEMINIによる分類
export const classifyTagByGemini = async (tag: string): Promise<{
  category: '焙煎度' | '風味' | '特徴';
  explanation: string;
}> => {
  const prompt = createTagClassificationPrompt(tag);
  // TODO: GEMINIのAPI呼び出し処理を実装
  // 仮実装
  return {
    category: '特徴',
    explanation: 'GEMINI APIによる分類結果'
  };
};

// ハイブリッド分類
export const classifyTag = async (
  tag: string,
  useGemini: boolean = false
): Promise<{
  category: '焙煎度' | '風味' | '特徴';
  explanation?: string;
}> => {
  // まずキーワードベースで確実な分類を試みる
  const keywordCategory = classifyTagByKeywords(tag);
  
  // キーワードで焙煎度に分類された場合は確実なので、そのまま返す
  if (keywordCategory === '焙煎度') {
    return { category: keywordCategory };
  }
  
  // GEMINIを使用する場合
  if (useGemini) {
    try {
      const geminiResult = await classifyTagByGemini(tag);
      // キーワードで風味に分類された場合は、GEMINIの結果と比較
      if (keywordCategory === '風味') {
        return geminiResult.category === '特徴' 
          ? { category: keywordCategory } // キーワードの風味分類を優先
          : geminiResult; // GEMINIの分類を採用
      }
      return geminiResult;
    } catch (error) {
      console.error('GEMINI分類エラー:', error);
      return { category: keywordCategory }; // エラー時はキーワード分類を使用
    }
  }
  
  // GEMINIを使用しない場合はキーワード分類を返す
  return { category: keywordCategory };
}; 