import type { ToolResult } from '../../../shared/types.js';

export class SearchTool {
  async search(query: string): Promise<ToolResult> {
    try {
      // Try DuckDuckGo instant answer API
      const encoded = encodeURIComponent(query);
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encoded}&format=json&no_redirect=1`
      );

      if (!response.ok) {
        return this.fallbackSearch(query);
      }

      const data = await response.json();

      const results: string[] = [];

      if (data.Abstract) {
        results.push(`**${data.AbstractSource}**: ${data.Abstract}`);
        if (data.AbstractURL) {
          results.push(`URL: ${data.AbstractURL}`);
        }
      }

      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        results.push('\n**Related:**');
        for (const topic of data.RelatedTopics.slice(0, 5)) {
          if (topic.Text) {
            results.push(`- ${topic.Text}`);
            if (topic.FirstURL) {
              results.push(`  URL: ${topic.FirstURL}`);
            }
          }
        }
      }

      if (results.length === 0) {
        return this.fallbackSearch(query);
      }

      return {
        success: true,
        output: results.join('\n'),
      };
    } catch (error: any) {
      return this.fallbackSearch(query);
    }
  }

  private fallbackSearch(query: string): ToolResult {
    return {
      success: true,
      output: `Web search for "${query}" did not return structured results. Try refining the query or use the browse tool to visit a specific URL like https://www.google.com/search?q=${encodeURIComponent(query)}`,
    };
  }
}
