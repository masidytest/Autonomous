import { chromium, type Browser, type Page } from 'playwright';
import type { ToolResult } from '@shared/types.js';

interface BrowserInput {
  action: 'navigate' | 'screenshot' | 'click' | 'type' | 'scroll' | 'wait';
  url?: string;
  selector?: string;
  text?: string;
  waitTime?: number;
}

export class BrowserTool {
  private browser: Browser | null = null;
  private page: Page | null = null;

  private async ensureBrowser(): Promise<Page> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    }
    if (!this.page) {
      this.page = await this.browser.newPage({
        viewport: { width: 1280, height: 720 },
      });
    }
    return this.page;
  }

  async execute(input: BrowserInput): Promise<ToolResult> {
    try {
      const page = await this.ensureBrowser();

      switch (input.action) {
        case 'navigate': {
          if (!input.url) {
            return { success: false, output: '', error: 'URL is required for navigate action' };
          }
          await page.goto(input.url, { waitUntil: 'networkidle', timeout: 30000 });
          const screenshotBuf = await page.screenshot();
          const screenshotB64 = screenshotBuf.toString('base64');
          const title = await page.title();
          return {
            success: true,
            output: `Navigated to: ${input.url}\nTitle: ${title}`,
            metadata: {
              url: input.url,
              title,
              screenshot: screenshotB64,
            },
          };
        }

        case 'screenshot': {
          const screenshotBuf = await page.screenshot();
          const screenshotB64 = screenshotBuf.toString('base64');
          const url = page.url();
          return {
            success: true,
            output: `Screenshot taken of ${url}`,
            metadata: {
              url,
              screenshot: screenshotB64,
            },
          };
        }

        case 'click': {
          if (!input.selector) {
            return { success: false, output: '', error: 'Selector is required for click action' };
          }
          await page.click(input.selector, { timeout: 10000 });
          return { success: true, output: `Clicked: ${input.selector}` };
        }

        case 'type': {
          if (!input.selector || input.text === undefined) {
            return {
              success: false,
              output: '',
              error: 'Selector and text are required for type action',
            };
          }
          await page.fill(input.selector, input.text, { timeout: 10000 });
          return { success: true, output: `Typed "${input.text}" into ${input.selector}` };
        }

        case 'scroll': {
          await page.evaluate(() => window.scrollBy(0, 500));
          return { success: true, output: 'Scrolled down 500px' };
        }

        case 'wait': {
          const ms = input.waitTime || 1000;
          await page.waitForTimeout(ms);
          return { success: true, output: `Waited ${ms}ms` };
        }

        default:
          return { success: false, output: '', error: `Unknown action: ${input.action}` };
      }
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close().catch(() => {});
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }
}
