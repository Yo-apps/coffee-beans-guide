#!/usr/bin/env node
import { Command } from 'commander';
import { CrawlerService } from '../services/dataCrawlerService';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

interface CrawlResult {
  success: boolean;
  error?: string;
  data?: any;
}

interface UrlEntry {
  url: string;
  language: string;
  priority: number;
}

const program = new Command();

async function loadUrlList(filePath: string): Promise<UrlEntry[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
      throw new Error('URLリストは配列形式である必要があります');
    }
    return data.map((entry: any) => {
      if (!entry.url || typeof entry.url !== 'string') {
        throw new Error('各エントリにはURLが必要です');
      }
      return {
        url: entry.url,
        language: entry.language || 'ja',
        priority: entry.priority || 3
      };
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`URLリストファイルの読み込みに失敗しました: ${error.message}`));
    } else {
      console.error(chalk.red('URLリストファイルの読み込みに失敗しました'));
    }
    process.exit(1);
  }
}

program
  .version('1.0.0')
  .description('コーヒー関連情報クローラーCLIツール');

program
  .command('start')
  .description('クローラーを開始します')
  .requiredOption('-f, --file <path>', 'URLリストファイルのパス')
  .option('-l, --lang <language>', '言語設定（デフォルト: ja）', 'ja')
  .option('-p, --priority <number>', '優先度（1-5）', '3')
  .action(async (options) => {
    try {
      console.log(chalk.blue('URLリストを読み込んでいます...'));
      const entries = await loadUrlList(options.file);
      console.log(chalk.green(`${entries.length}個のURLを読み込みました`));

      const crawler = new CrawlerService();
      console.log(chalk.blue('クローリングを開始します...'));
      
      const results = await crawler.start(entries.map(e => e.url), {
        language: options.lang,
        priority: parseInt(options.priority, 10)
      });

      console.log(chalk.green('\nクローリング結果:'));
      results.forEach((result: CrawlResult, index: number) => {
        const url = entries[index].url;
        if (result.success) {
          console.log(chalk.green(`✓ ${url}: 成功`));
        } else {
          console.log(chalk.red(`✗ ${url}: 失敗`));
          if (result.error) {
            console.log(chalk.yellow(`  エラー: ${result.error}`));
          }
        }
      });

      const successCount = results.filter((r: CrawlResult) => r.success).length;
      const failCount = results.length - successCount;
      
      console.log(chalk.blue('\n集計:'));
      console.log(chalk.green(`成功: ${successCount}件`));
      console.log(chalk.red(`失敗: ${failCount}件`));
      
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`エラーが発生しました: ${error.message}`));
      } else {
        console.error(chalk.red('予期せぬエラーが発生しました'));
      }
      process.exit(1);
    }
  });

program.parse(); 