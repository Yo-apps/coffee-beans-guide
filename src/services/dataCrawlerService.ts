import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

interface CrawlerOptions {
  language?: string;
  priority?: number;
  maxRetries?: number;
  retryDelay?: number;
  saveDir?: string;
}

interface CrawlResult {
  success: boolean;
  error?: string;
  data?: {
    title: string;
    content: string;
    metadata: {
      url: string;
      language: string;
      source: string;
      scrapedAt: string;
    };
  };
}

export class CrawlerService {
  private userAgent = 'CoffeeKnowledgeBot/1.0 (Educational Purpose)';
  private defaultOptions: Required<CrawlerOptions> = {
    language: 'ja',
    priority: 3,
    maxRetries: 3,
    retryDelay: 1000,
    saveDir: path.join(process.cwd(), 'database', 'raw')
  };

  constructor() {}

  async start(urls: string[], options: CrawlerOptions = {}): Promise<CrawlResult[]> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const results: CrawlResult[] = [];
    
    // 保存ディレクトリの作成
    await this.ensureDirectory(mergedOptions.saveDir);
    
    for (const url of urls) {
      try {
        console.log(`クローリング中: ${url}`);
        const data = await this.scrapeWithRetry(url, mergedOptions);
        
        // データの保存
        if (data) {
          await this.saveData(data, url, mergedOptions.saveDir);
        }
        
        results.push({
          success: true,
          data
        });
      } catch (error) {
        let errorMessage = '不明なエラー';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (axios.isAxiosError(error)) {
          errorMessage = `HTTP ${error.response?.status || 'unknown'}: ${error.message}`;
        }
        
        results.push({
          success: false,
          error: errorMessage
        });
        
        console.error(`エラー (${url}):`, errorMessage);
      }
    }

    return results;
  }

  private async scrapeWithRetry(url: string, options: Required<CrawlerOptions>): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        return await this.scrapePage(url, options.language);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < options.maxRetries) {
          console.log(`リトライ ${attempt}/${options.maxRetries}: ${url}`);
          await new Promise(resolve => setTimeout(resolve, options.retryDelay * attempt));
        }
      }
    }
    
    throw lastError || new Error('全てのリトライが失敗しました');
  }

  private async scrapePage(url: string, language: string): Promise<any> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': language,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br'
        },
        timeout: 10000,
        maxRedirects: 5
      });

      if (response.status === 200) {
        const $ = cheerio.load(response.data);
        
        // メインコンテンツの抽出を試みる
        const title = this.extractTitle($);
        const content = this.extractContent($);
        
        if (!content) {
          throw new Error('コンテンツが見つかりませんでした');
        }

        return {
          title,
          content,
          metadata: {
            url,
            language,
            source: new URL(url).hostname,
            scrapedAt: new Date().toISOString()
          }
        };
      } else {
        throw new Error(`HTTPエラー: ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`リクエストエラー: ${error.message}`);
      }
      throw error;
    }
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    // タイトルの抽出を試みる（優先順位順）
    return (
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('title').text().trim() ||
      '無題'
    );
  }

  private extractContent($: cheerio.CheerioAPI): string {
    // メインコンテンツの抽出を試みる（優先順位順）
    const selectors = [
      'article',
      '.post-content',
      '.entry-content',
      '.main-content',
      'main',
      '#main',
      '.content'
    ];

    for (const selector of selectors) {
      const content = $(selector).text().trim();
      if (content.length > 100) { // 最小コンテンツ長のチェック
        return content;
      }
    }

    // セレクターでの抽出が失敗した場合、段落を収集
    const paragraphs = $('p').map((_, el) => $(el).text().trim()).get();
    const content = paragraphs.join('\n\n').trim();
    
    return content.length > 100 ? content : '';
  }

  private async ensureDirectory(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async saveData(data: any, url: string, saveDir: string): Promise<void> {
    const timestamp = new Date().getTime();
    const urlObj = new URL(url);
    const filename = `${timestamp}_${urlObj.hostname.replace(/[^a-z0-9]/gi, '_')}.json`;
    const filePath = path.join(saveDir, filename);
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`データを保存しました: ${filePath}`);
  }
} 