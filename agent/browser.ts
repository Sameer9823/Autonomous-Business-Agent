/**
 * browser.ts
 * Handles browser navigation using Playwright as fallback when TinyFish is unavailable.
 * Primary automation is handled by TinyFish Web Agent API via executor.ts
 */

export interface BrowserAction {
  type: 'navigate' | 'click' | 'type' | 'extract' | 'screenshot' | 'wait';
  selector?: string;
  url?: string;
  text?: string;
  timeout?: number;
}

export interface BrowserResult {
  success: boolean;
  data?: Record<string, unknown>;
  screenshot?: string;
  error?: string;
  url?: string;
  title?: string;
}

export interface ExtractedData {
  title?: string;
  description?: string;
  pricing?: PricingEntry[];
  contacts?: ContactEntry[];
  links?: string[];
  text_content?: string;
  meta?: Record<string, string>;
}

export interface PricingEntry {
  plan_name: string;
  price: string;
  billing?: string;
  features?: string[];
}

export interface ContactEntry {
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * Simulated browser automation for demo purposes.
 * In production, this integrates with Playwright for fallback automation.
 */
export async function executeBrowserAction(action: BrowserAction): Promise<BrowserResult> {
  // Simulate browser action delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));

  switch (action.type) {
    case 'navigate':
      return {
        success: true,
        url: action.url,
        title: `Page at ${action.url}`,
        data: { loaded: true, url: action.url },
      };

    case 'extract':
      return {
        success: true,
        data: generateMockExtractedData(action.url || ''),
      };

    case 'click':
      return { success: true, data: { clicked: action.selector } };

    case 'type':
      return { success: true, data: { typed: action.text } };

    case 'wait':
      return { success: true, data: { waited: action.timeout || 1000 } };

    default:
      return { success: false, error: `Unknown action type: ${action.type}` };
  }
}

function generateMockExtractedData(url: string): ExtractedData {
  if (url.includes('pricing') || url.includes('price')) {
    return {
      title: 'Pricing Plans',
      pricing: [
        { plan_name: 'Starter', price: '$29/month', billing: 'monthly', features: ['5 users', '10GB storage', 'Basic analytics'] },
        { plan_name: 'Professional', price: '$79/month', billing: 'monthly', features: ['25 users', '100GB storage', 'Advanced analytics', 'API access'] },
        { plan_name: 'Enterprise', price: '$199/month', billing: 'monthly', features: ['Unlimited users', 'Unlimited storage', 'Custom integrations', 'SLA support'] },
      ],
    };
  }

  if (url.includes('contact')) {
    return {
      title: 'Contact Us',
      contacts: [
        { email: 'hello@example.com', phone: '+1-555-0123', address: '123 Business Ave, San Francisco, CA' },
      ],
    };
  }

  return {
    title: 'Web Page',
    description: 'Extracted content from web page',
    text_content: 'Page content extracted successfully',
    links: [`${url}/about`, `${url}/pricing`, `${url}/contact`],
  };
}

/**
 * Initialize a real Playwright browser instance.
 * Used as fallback when TinyFish API is unavailable.
 */
export async function createPlaywrightBrowser() {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    return browser;
  } catch (error) {
    console.error('Playwright browser creation failed:', error);
    return null;
  }
}
