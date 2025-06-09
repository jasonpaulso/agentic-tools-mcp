import * as htmlParser from 'node-html-parser';

/**
 * Basic web scraper for documentation
 */
export class WebScraper {
  private maxContentLength: number;

  constructor(maxContentLength: number = 1000000) {
    this.maxContentLength = maxContentLength;
  }

  /**
   * Scrape content from a URL
   */
  async scrapeUrl(url: string): Promise<{ content: string; metadata: any }> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DocsScraper/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      
      // Limit content size
      if (html.length > this.maxContentLength) {
        throw new Error(`Content too large: ${html.length} bytes (max: ${this.maxContentLength})`);
      }

      // Parse HTML
      const root = htmlParser.parse(html);
      
      // Extract metadata
      const metadata = this.extractMetadata(root);
      
      // Convert to markdown-like format
      const content = this.htmlToMarkdown(root);

      return { content, metadata };
    } catch (error) {
      throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract metadata from HTML
   */
  private extractMetadata(root: htmlParser.HTMLElement): any {
    const metadata: any = {};

    // Extract title
    const titleEl = root.querySelector('title');
    if (titleEl) {
      metadata.title = titleEl.text.trim();
    }

    // Extract description
    const descEl = root.querySelector('meta[name="description"]');
    if (descEl) {
      metadata.description = descEl.getAttribute('content')?.trim();
    }

    // Extract last modified
    const modifiedEl = root.querySelector('meta[name="last-modified"]');
    if (modifiedEl) {
      metadata.lastModified = modifiedEl.getAttribute('content')?.trim();
    }

    return metadata;
  }

  /**
   * Convert HTML to markdown-like format
   */
  private htmlToMarkdown(root: htmlParser.HTMLElement): string {
    // Remove scripts and styles
    root.querySelectorAll('script, style, noscript').forEach(el => el.remove());

    // Process the main content areas
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.documentation',
      '#content',
      'body'
    ];

    let contentEl: htmlParser.HTMLElement | null = null;
    for (const selector of contentSelectors) {
      contentEl = root.querySelector(selector);
      if (contentEl) break;
    }

    if (!contentEl) {
      contentEl = root.querySelector('body') || root;
    }

    return this.processElement(contentEl);
  }

  /**
   * Process HTML element to text
   */
  private processElement(el: htmlParser.HTMLElement): string {
    let result = '';

    const processNode = (node: htmlParser.Node) => {
      if (node.nodeType === 3) { // Text node
        result += node.text;
        return;
      }

      if (node.nodeType !== 1) return; // Not an element

      const element = node as htmlParser.HTMLElement;
      const tagName = element.tagName?.toLowerCase();

      // Skip hidden elements
      const style = element.getAttribute('style');
      if (style && (style.includes('display:none') || style.includes('display: none'))) {
        return;
      }

      // Handle different tags
      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          const level = parseInt(tagName[1]);
          result += '\n\n' + '#'.repeat(level) + ' ' + element.text.trim() + '\n\n';
          break;

        case 'p':
          result += '\n\n' + element.text.trim() + '\n\n';
          break;

        case 'a':
          const href = element.getAttribute('href');
          if (href) {
            result += `[${element.text.trim()}](${href})`;
          } else {
            result += element.text.trim();
          }
          break;

        case 'code':
          if (element.parentNode && (element.parentNode as htmlParser.HTMLElement).tagName?.toLowerCase() === 'pre') {
            // Code block
            result += '\n\n```\n' + element.text + '\n```\n\n';
          } else {
            // Inline code
            result += '`' + element.text + '`';
          }
          break;

        case 'pre':
          // Skip if already handled by code tag
          if (!element.querySelector('code')) {
            result += '\n\n```\n' + element.text + '\n```\n\n';
          }
          break;

        case 'ul':
        case 'ol':
          result += '\n\n';
          element.childNodes.forEach((child, index) => {
            if ((child as htmlParser.HTMLElement).tagName?.toLowerCase() === 'li') {
              const prefix = tagName === 'ol' ? `${index + 1}. ` : '- ';
              result += prefix + (child as htmlParser.HTMLElement).text.trim() + '\n';
            }
          });
          result += '\n';
          break;

        case 'blockquote':
          result += '\n\n> ' + element.text.trim().replace(/\n/g, '\n> ') + '\n\n';
          break;

        case 'hr':
          result += '\n\n---\n\n';
          break;

        case 'br':
          result += '\n';
          break;

        case 'strong':
        case 'b':
          result += '**' + element.text.trim() + '**';
          break;

        case 'em':
        case 'i':
          result += '*' + element.text.trim() + '*';
          break;

        case 'table':
          // Simple table handling
          result += '\n\n' + element.text.replace(/\s+/g, ' ').trim() + '\n\n';
          break;

        default:
          // Process children for other elements
          element.childNodes.forEach(child => processNode(child));
          break;
      }
    };

    el.childNodes.forEach(child => processNode(child));

    // Clean up excessive whitespace
    return result
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }
}