import { generatePlan } from '@/lib/gemini';

export interface AgentStep {
  step_number: number;
  action: 'navigate' | 'search' | 'click' | 'extract' | 'fill_form' | 'submit' | 'wait' | 'save';
  target: string;
  description: string;
  extract_fields?: string[];
  form_data?: Record<string, string>;
}

export interface AgentPlan {
  workflow_name: string;
  objective: string;
  steps: AgentStep[];
  expected_output: string;
}

export async function planWorkflow(command: string): Promise<AgentPlan> {
  try {
    const planJson = await generatePlan(command);
    const plan: AgentPlan = JSON.parse(planJson);
    if (!plan.workflow_name || !plan.steps || !Array.isArray(plan.steps)) {
      throw new Error('Invalid plan structure from Gemini');
    }
    return plan;
  } catch (error) {
    console.error('Planner error:', error);
    return getFallbackPlan(command);
  }
}

// ── Extract named products/companies from the command ────────────────────────
// Returns list of specific names mentioned (e.g. ["MongoDB", "Stripe"])
export function extractTargets(command: string): string[] {
  const c = command.toLowerCase();

  // All known named products we have data for
  const KNOWN: Record<string, string> = {
    // Marketplaces & eCommerce
    'amazon': 'Amazon', 'flipkart': 'Flipkart', 'shopify': 'Shopify',
    'woocommerce': 'WooCommerce', 'etsy': 'Etsy', 'ebay': 'eBay',
    'meesho': 'Meesho', 'snapdeal': 'Snapdeal', 'myntra': 'Myntra',
    // Databases
    'mongodb': 'MongoDB', 'postgres': 'PostgreSQL', 'postgresql': 'PostgreSQL',
    'mysql': 'MySQL', 'redis': 'Redis', 'supabase': 'Supabase', 'planetscale': 'PlanetScale',
    'firebase': 'Firebase', 'cockroachdb': 'CockroachDB', 'neon': 'Neon',
    // CRM
    'hubspot': 'HubSpot', 'salesforce': 'Salesforce', 'pipedrive': 'Pipedrive',
    'zoho': 'Zoho CRM', 'freshsales': 'Freshsales',
    // Project management
    'asana': 'Asana', 'notion': 'Notion', 'linear': 'Linear', 'monday': 'Monday.com',
    'jira': 'Jira', 'clickup': 'ClickUp', 'trello': 'Trello',
    // Cloud storage
    'dropbox': 'Dropbox', 'box': 'Box', 'google drive': 'Google Drive',
    // Communication
    'slack': 'Slack', 'discord': 'Discord', 'zoom': 'Zoom', 'loom': 'Loom',
    // Dev tools
    'github': 'GitHub', 'gitlab': 'GitLab', 'vercel': 'Vercel', 'netlify': 'Netlify',
    // Payments
    'stripe': 'Stripe', 'paddle': 'Paddle', 'razorpay': 'Razorpay', 'paytm': 'Paytm',
    // Email marketing
    'mailchimp': 'Mailchimp', 'convertkit': 'ConvertKit', 'activecampaign': 'ActiveCampaign',
    'klaviyo': 'Klaviyo', 'sendgrid': 'SendGrid',
    // Analytics
    'mixpanel': 'Mixpanel', 'amplitude': 'Amplitude', 'segment': 'Segment',
    'posthog': 'PostHog', 'hotjar': 'Hotjar',
    // Support
    'zendesk': 'Zendesk', 'intercom': 'Intercom', 'freshdesk': 'Freshdesk',
    // Cloud infra
    'aws': 'AWS', 'azure': 'Azure', 'gcp': 'Google Cloud', 'cloudflare': 'Cloudflare',
    'datadog': 'Datadog', 'sentry': 'Sentry',
    // HR
    'gusto': 'Gusto', 'bamboohr': 'BambooHR', 'rippling': 'Rippling',
    // Marketing
    'semrush': 'SEMrush', 'ahrefs': 'Ahrefs',
    // AI tools
    'openai': 'OpenAI', 'anthropic': 'Anthropic', 'cohere': 'Cohere',
  };

  const found: string[] = [];
  for (const [keyword, name] of Object.entries(KNOWN)) {
    if (c.includes(keyword) && !found.includes(name)) {
      found.push(name);
    }
  }
  return found;
}

function getFallbackPlan(command: string): AgentPlan {
  const c = command.toLowerCase();
  const targets = extractTargets(command);

  // ── SPECIFIC PRODUCT PRICING ─────────────────────────────────────────────
  if (targets.length > 0 && (c.includes('pric') || c.includes('plan') || c.includes('cost') || c.includes('info') || c.includes('detail'))) {
    const steps: AgentStep[] = [
      { step_number: 1, action: 'navigate', target: 'https://www.google.com', description: 'Open Google search engine' },
      { step_number: 2, action: 'search', target: `${targets[0]} pricing plans 2024`, description: `Search for ${targets[0]} pricing` },
      { step_number: 3, action: 'click', target: `${targets[0].toLowerCase().replace(/\s/g, '')}.com/pricing`, description: `Open ${targets[0]} official pricing page` },
      { step_number: 4, action: 'extract', target: `${targets[0]} pricing page`, description: `Extract ${targets[0]} pricing tiers and costs`, extract_fields: ['plan_name', 'price', 'features', 'limits'] },
    ];

    // If multiple targets, extract each
    if (targets.length > 1) {
      steps.push(
        { step_number: 5, action: 'navigate', target: `https://www.google.com/search?q=${encodeURIComponent(targets[1] + ' pricing')}`, description: `Search ${targets[1]} pricing` },
        { step_number: 6, action: 'extract', target: `${targets[1]} pricing page`, description: `Extract ${targets[1]} pricing tiers`, extract_fields: ['plan_name', 'price', 'features', 'billing_cycle'] },
      );
      steps.push({ step_number: 7, action: 'save', target: 'mongodb', description: `Save ${targets.join(' + ')} pricing comparison to database` });
    } else {
      steps.push({ step_number: 5, action: 'save', target: 'mongodb', description: `Save ${targets[0]} pricing data to database` });
    }

    return {
      workflow_name: `${targets.join(' + ')} Pricing Research`,
      objective: `Extract real pricing data for: ${targets.join(', ')}`,
      expected_output: `Pricing plans and costs for ${targets.join(', ')}`,
      steps,
    };
  }

  // ── COMPETITOR PRICING (no specific name) ────────────────────────────────
  if (c.includes('pric') || c.includes('competitor') || c.includes('monitor')) {
    // Build a smarter search query from the command itself
    const searchQuery = command.length > 10 ? command : 'SaaS tools pricing comparison 2024';
    return {
      workflow_name: 'Competitor Price Monitoring',
      objective: `Monitor pricing: ${command}`,
      expected_output: 'Price data from competitors',
      steps: [
        { step_number: 1, action: 'navigate', target: 'https://www.google.com', description: 'Open Google search engine' },
        { step_number: 2, action: 'search', target: searchQuery, description: `Search: ${searchQuery}` },
        { step_number: 3, action: 'click', target: 'first organic search result', description: 'Open first competitor result' },
        { step_number: 4, action: 'navigate', target: '/pricing', description: 'Navigate to pricing page' },
        { step_number: 5, action: 'extract', target: 'pricing section', description: 'Extract pricing tiers and costs', extract_fields: ['plan_name', 'price', 'features'] },
        { step_number: 6, action: 'navigate', target: 'second competitor URL', description: 'Open second competitor site' },
        { step_number: 7, action: 'extract', target: 'pricing table', description: 'Extract competitor 2 pricing data', extract_fields: ['plan_name', 'price', 'billing_cycle'] },
        { step_number: 8, action: 'save', target: 'mongodb', description: 'Save all pricing data to database' },
      ],
    };
  }

  // ── LEAD GEN ─────────────────────────────────────────────────────────────
  if (c.includes('lead') || c.includes('contact') || c.includes('email') ||
      c.includes('company') || c.includes('startup') || c.includes('founder') ||
      c.includes('b2b') || c.includes('find compan') || c.includes('find startup') ||
      c.includes('phone') || c.includes('outreach') || c.includes('prospect')) {
    const industry = c.includes('fintech') ? 'fintech' : c.includes('health') ? 'healthtech' :
                     c.includes('ecommerce') || c.includes('e-commerce') ? 'ecommerce' :
                     c.includes('developer') || c.includes('devtool') ? 'devtools' :
                     c.includes('marketing') ? 'marketing' : c.includes('hr') ? 'hr' :
                     c.includes('ai ') || c.includes('artificial') ? 'ai' : 'saas';
    return {
      workflow_name: 'Lead Generation Agent',
      objective: `Find and extract contact info: ${command}`,
      expected_output: 'Company names, emails, phones and contact pages',
      steps: [
        { step_number: 1, action: 'navigate', target: 'https://www.google.com', description: 'Open Google search' },
        { step_number: 2, action: 'search', target: `${industry} startups companies contact email 2024`, description: `Search for ${industry} companies` },
        { step_number: 3, action: 'click', target: 'first result', description: 'Open first company website' },
        { step_number: 4, action: 'navigate', target: '/contact', description: 'Navigate to contact page' },
        { step_number: 5, action: 'extract', target: 'contact information', description: `Extract contact details from ${industry} companies`, extract_fields: ['company_name', 'email', 'phone', 'industry', 'founder', 'contact_form_url'] },
        { step_number: 6, action: 'navigate', target: 'second company website', description: 'Open second company' },
        { step_number: 7, action: 'extract', target: 'contact page', description: `Extract more ${industry} company contacts`, extract_fields: ['company_name', 'email', 'phone', 'industry', 'founder', 'contact_form_url'] },
        { step_number: 8, action: 'save', target: 'mongodb', description: 'Save all leads to database' },
      ],
    };
  }

  // ── DEFAULT RESEARCH ─────────────────────────────────────────────────────
  return {
    workflow_name: 'Web Research Agent',
    objective: command,
    expected_output: 'Researched data and insights',
    steps: [
      { step_number: 1, action: 'navigate', target: 'https://www.google.com', description: 'Open Google search engine' },
      { step_number: 2, action: 'search', target: command, description: `Search for: ${command}` },
      { step_number: 3, action: 'click', target: 'first result', description: 'Open most relevant result' },
      { step_number: 4, action: 'extract', target: 'main content', description: 'Extract relevant information', extract_fields: ['title', 'description', 'key_data'] },
      { step_number: 5, action: 'save', target: 'mongodb', description: 'Save results to database' },
    ],
  };
}
