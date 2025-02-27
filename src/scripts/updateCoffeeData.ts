// import axios from 'axios';
// import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import { createAdvancedAnalyzeProductPrompt } from '../prompts/analyzeProduct';
import { createAdvancedGenerateTagsPrompt } from '../prompts/generateTags';
import type { 
  ProductAnalysis as ProductAnalysisType,
  ProductAnalysisEnglish,
  AnalyzedProduct,
  ScrapedProduct
} from '../types/types';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config({ path: '.env.local' });

// 定数定義
const DATA_DIR = path.join(process.cwd(), 'src/data');
const SCRAPED_DATA_PATH = path.join(DATA_DIR, 'scraped/rawCoffeeData.json');
const ANALYZED_DATA_PATH = path.join(DATA_DIR, 'analyzed/analyzedCoffeeData.json');
const BASE_URL = 'https://somacoffee.shopselect.net';

// Gemini APIの設定
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEYが設定されていません');
}

// APIキーの状態をログ出力
console.log('環境変数の状態:', {
  GEMINI_API_KEY: GEMINI_API_KEY ? 'APIキーが設定されています' : 'APIキーが設定されていません',
  NODE_ENV: process.env.NODE_ENV,
  GEMINI_MODEL_VERSION: process.env.GEMINI_MODEL_VERSION
});

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL_VERSION || 'gemini-pro',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8192'),
  },
});

// 商品URLの取得
async function getProductUrls(page: Page): Promise<string[]> {
  console.log('商品URLの取得を開始...');
  
  try {
    // 商品一覧ページに移動
    await page.goto(`${BASE_URL}/items`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // 商品カードの要素が表示されるまで待機
    await page.waitForSelector('#itemList', { timeout: 30000 });

    // 商品URLを取得（売り切れ商品を除外）
    const productUrls = await page.evaluate(() => {
      // 商品カードのセレクタを更新
      const productCards = document.querySelectorAll('#itemList > li');
      return Array.from(productCards)
        .filter(card => {
          // 売り切れ表示の有無をチェック
          const soldOutElement = card.querySelector('.items-grid_itemInfoLabels_5c97110f p, .soldout');
          const isSoldOut = soldOutElement?.textContent?.toLowerCase().includes('sold out') || false;
          return !isSoldOut;
        })
        .map(card => {
          const link = card.querySelector('a');
          return link ? link.href : '';
        })
        .filter(url => url !== '');
    });

    // 重複を除去
    const uniqueUrls = [...new Set(productUrls)];

    console.log(`${uniqueUrls.length}件の有効な商品URLを検出しました`);
    console.log('取得したURL:', uniqueUrls);

    if (uniqueUrls.length === 0) {
      console.error('商品URLが見つかりませんでした');
      // ページのHTMLをデバッグ用に出力
      const html = await page.content();
      console.log('ページのHTML:', html);
      throw new Error('商品URLが見つかりませんでした');
    }

    return uniqueUrls;
  } catch (error) {
    console.error('商品URL取得中にエラーが発生:', error);
    throw new Error(`商品URLの取得に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

// 商品情報のスクレイピング
async function scrapeSOMAcoffee(): Promise<ScrapedProduct[]> {
  console.log('スクレイピングを開始...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // リソースの読み込みを最適化
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // 商品URLを取得
    const productUrls = await getProductUrls(page);
    const products: ScrapedProduct[] = [];

    // 各商品ページをスクレイピング
    for (const url of productUrls) {
      try {
        console.log(`商品ページの処理中: ${url}`);
        
        // ページに移動し、主要な要素の読み込みを待機
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // 商品情報の要素が表示されるまで待機
        await Promise.all([
          page.waitForSelector('.item-detail_title_a0a8a677, h1, h2', { timeout: 10000 })
            .catch(() => console.warn('商品名の要素が見つかりませんでした')),
          page.waitForSelector('.item-detail_price_a0a8a677, .price', { timeout: 10000 })
            .catch(() => console.warn('価格の要素が見つかりませんでした')),
          page.waitForSelector('.item-detail_description_a0a8a677, .item-detail-text', { timeout: 10000 })
            .catch(() => console.warn('商品説明の要素が見つかりませんでした'))
        ]);

        // 少し待機して要素の読み込みを確実にする
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 商品情報を取得
        const productData = await page.evaluate(() => {
          // 商品名のセレクタを更新
          const nameSelectors = [
            'h1.item-detail_title_a0a8a677',
            'h2.item-detail_title_a0a8a677',
            '.item-detail_title_a0a8a677',
            'h1',
            'h2'
          ];
          let name = '';
          for (const selector of nameSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              name = element.textContent?.trim() || '';
              if (name) break;
            }
          }

          // 価格のセレクタを更新
          const priceSelectors = [
            '.item-detail_price_a0a8a677',
            '.price',
            'meta[property="product:price:amount"]'
          ];
          let price = '';
          for (const selector of priceSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              if (selector === 'meta[property="product:price:amount"]') {
                price = element.getAttribute('content') || '';
              } else {
                price = element.textContent?.trim() || '';
              }
              if (price) break;
            }
          }

          // 商品説明のセレクタを更新
          const descriptionSelectors = [
            '.item-detail_description_a0a8a677',
            '.item-detail-text',
            '[data-testid="description"]'
          ];
          let description = '';
          for (const selector of descriptionSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              description = element.textContent?.trim() || '';
              if (description) break;
            }
          }

          // 在庫状態の確認
          const soldOutElement = document.querySelector('.items-grid_itemInfoLabels_5c97110f p, .soldout');
          const isSoldOut = soldOutElement?.textContent?.toLowerCase().includes('sold out') || false;

          return { name, price, description, soldOut: isSoldOut };
        });

        // デバッグ情報を出力
        console.log('取得した商品データ:', {
          name: productData.name,
          price: productData.price,
          descriptionLength: productData.description.length,
          soldOut: productData.soldOut
        });

        if (!productData.name || !productData.price || !productData.description) {
          console.warn(`商品データの取得に失敗: ${url}`);
          console.warn('取得できなかった項目:', {
            name: !productData.name,
            price: !productData.price,
            description: !productData.description
          });
          continue;
        }

        products.push({
          name: cleanProductName(productData.name),
          price: productData.price.replace(/[^0-9]/g, ''),
          description: cleanProductDescription(productData.description),
          link: url,
          soldOut: productData.soldOut
        });

        // 連続アクセスを避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`商品ページの処理中にエラーが発生: ${url}`, error);
      }
    }

    if (products.length === 0) {
      throw new Error('有効な商品データが取得できませんでした');
    }

    console.log(`スクレイピング完了: ${products.length}件の商品データを取得`);
    return products;
  } finally {
    await browser.close();
  }
}

// 商品名の整形
function cleanProductName(name: string): string {
  return name
    .replace(/送料無料/g, '')
    .replace(/100g/g, '')
    .replace(/　+/g, ' ')
    .trim();
}

// 商品説明の整形
function cleanProductDescription(description: string): string {
  // 配送・パッケージに関する情報を除外
  const sections = description.split(/[-]{2,}|={2,}|\n{2,}/);
  const relevantSections = sections.filter(section => {
    const lowerSection = section.toLowerCase();
    return !lowerSection.includes('配送方法') &&
           !lowerSection.includes('お届け日') &&
           !lowerSection.includes('梱包') &&
           !lowerSection.includes('q&a') &&
           !lowerSection.includes('焙煎日') &&
           !section.includes('※');
  });

  return relevantSections.join('\n\n').trim();
}

// 商品データの解析
async function analyzeWithGemini(product: ScrapedProduct): Promise<ProductAnalysisType> {
  try {
    console.log(`商品「${product.name}」の解析を開始...`);
    
    const cleanedName = cleanProductName(product.name);
    const cleanedDescription = cleanProductDescription(product.description);
    
    const prompt = createAdvancedAnalyzeProductPrompt(cleanedName, cleanedDescription);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSONをパース
    const analysis = JSON.parse(text) as ProductAnalysisEnglish;
    
    // 解析結果を返す
    return {
      name: cleanedName,
      description: cleanedDescription,
      焙煎度: analysis.roastLevel,
      風味ノート: analysis.flavorNotes,
      特徴: analysis.features,
      要約: analysis.summary
    };
  } catch (error) {
    console.error(`商品「${product.name}」の解析に失敗:`, error);
    return {
      name: cleanProductName(product.name),
      description: cleanProductDescription(product.description),
      焙煎度: '不明',
      風味ノート: [],
      特徴: [],
      要約: '解析に失敗しました'
    };
  }
}

// メイン処理
async function updateCoffeeData(): Promise<void> {
  try {
    // データディレクトリの作成
    await fs.mkdir(path.join(DATA_DIR, 'scraped'), { recursive: true });
    await fs.mkdir(path.join(DATA_DIR, 'analyzed'), { recursive: true });
    
    // スクレイピングを実行
    const scrapedProducts = await scrapeSOMAcoffee();
    
    // スクレイピングしたデータを保存
    await fs.writeFile(
      SCRAPED_DATA_PATH,
      JSON.stringify(scrapedProducts, null, 2)
    );
    
    console.log('スクレイピングが完了しました');
    
    // 各商品を解析
    const analyzedProducts = await Promise.all(
      scrapedProducts.map(async (product) => {
        const analysis = await analyzeWithGemini(product);
        return {
          ...product,
          ...analysis,
          soldOut: false
        };
      })
    );
    
    // 解析済みデータを保存
    await fs.writeFile(
      ANALYZED_DATA_PATH,
      JSON.stringify(analyzedProducts, null, 2)
    );
    
    console.log('商品データの更新が完了しました');
  } catch (error) {
    console.error('商品データの更新に失敗:', error);
    throw error;
  }
}

// スクリプトとして実行された場合のみ実行
if (require.main === module) {
  updateCoffeeData().catch(console.error);
}

export { updateCoffeeData }; 
