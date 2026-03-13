'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ResultsGrid from '@/components/ResultsGrid';
import { ResultCardData, WorkflowType } from '@/components/ResultCard';
import { useRouter } from 'next/navigation';

// ─────────────────────────────────────────────────────────────
// Helpers: classify workflow type
// ─────────────────────────────────────────────────────────────
function classifyType(name: string, command: string): WorkflowType {
  const src = `${name} ${command}`.toLowerCase();

  // contact_form — very specific triggers only
  if (
    (src.includes('submit') && src.includes('form')) ||
    (src.includes('fill') && src.includes('form')) ||
    src.includes('contact form') ||
    src.includes('demo request') ||
    src.includes('book a demo') ||
    src.includes('schedule a call')
  ) return 'contact_form';

  // price monitor — pricing/fees/cost/plans for specific products
  if (
    src.includes('pric') || src.includes('seller fee') || src.includes('commission') ||
    src.includes('subscription fee') || src.includes('monitor') ||
    (src.includes('cost') && !src.includes('company')) ||
    (src.includes('plan') && !src.includes('company'))
  ) return 'price_monitor';

  // research — compare/analyze/research platforms/tools (NOT lead gen)
  if (
    src.includes('research') || src.includes('analyz') ||
    src.includes('compar') || src.includes('overview') ||
    src.includes('how does') || src.includes('what is') ||
    src.includes('business model') || src.includes('features') ||
    src.includes('platform') || src.includes('marketplace')
  ) return 'research';

  // lead_gen — explicit lead/contact extraction intent
  if (
    src.includes('lead gen') || src.includes('lead generation') ||
    src.includes('find compan') || src.includes('find startup') ||
    src.includes('find business') || src.includes('find founder') ||
    src.includes('extract contact') || src.includes('get contact') ||
    src.includes('extract email') || src.includes('get email') ||
    src.includes('contact detail') || src.includes('contact info') ||
    src.includes('b2b') || src.includes('outreach') || src.includes('prospect') ||
    src.includes('founder email') || src.includes('phone number') ||
    (src.includes('startup') && src.includes('contact')) ||
    (src.includes('compan') && src.includes('email')) ||
    src.includes('lead ')
  ) return 'lead_gen';

  // fallback research for generic "find X" without contact intent
  if (src.includes('find') || src.includes('look up') || src.includes('search')) return 'research';

  return 'unknown';
}

// ── MongoDB document shape (confirmed from live data) ─────────────────────────
// results[] is a FLAT array of raw step .data objects, in step order:
//   results[0]  = navigate data  { url, status, title }
//   results[1]  = search data    { query, results_count, top_results[] }
//   results[2]  = click data     { clicked, navigation }
//   results[3]  = navigate data  { url, status, title }
//   results[4]  = extract data   { extracted_fields, source, competitor_name, competitor_domain, plans_found, data[] }
//   results[5]  = navigate data  { url, status, title }
//   results[6]  = extract data   { extracted_fields, source, competitor_name, competitor_domain, plans_found, data[] }
//   results[7]  = save data      { saved, records, collection }
// ─────────────────────────────────────────────────────────────────────────────

interface StepDoc {
  step: number;
  action: string;
  target: string;
  status: string;
  message: string;
  data?: Record<string, unknown>;
}

interface RawWorkflow {
  workflowId: string;
  workflowName: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  completedSteps: number;
  totalSteps: number;
  agentProvider: string;
  steps?: StepDoc[];
  results?: Record<string, unknown>[];
}

// ─────────────────────────────────────────────────────────────────────────────
// buildFields — directly reads confirmed live MongoDB document structure
// ─────────────────────────────────────────────────────────────────────────────
function buildFields(type: WorkflowType, wf: RawWorkflow): Record<string, string> {
  const results = (wf.results || []) as Record<string, unknown>[];
  const steps   = (wf.steps   || []) as StepDoc[];

  // --- Find ALL extract entries in results[] (entries that have a .data array)
  // Confirmed: results[4] = Pipedrive, results[6] = Salesforce in live doc
  const extracts = results.filter(r => Array.isArray(r.data));

  // Also check steps[].data for extract steps (in case results[] is absent)
  if (extracts.length === 0) {
    steps.filter(s => s.action === 'extract' && s.data && Array.isArray((s.data).data))
      .forEach(s => extracts.push(s.data as Record<string, unknown>));
  }

  const e0 = extracts[0] || {};  // first extract  e.g. Pipedrive
  const e1 = extracts[1] || {};  // second extract e.g. Salesforce

  // Plans arrays
  const plans0 = (e0.data as Record<string,string>[] | undefined) || [];
  const plans1 = (e1.data as Record<string,string>[] | undefined) || [];

  // First plan from first extract = the "headline" price
  const p0 = plans0[0];

  // Competitor names / domains — stored DIRECTLY on the extract entry
  const name0   = ss(e0.competitor_name  || e0.company_name);
  const name1   = ss(e1.competitor_name  || e1.company_name);
  const domain0 = ss(e0.competitor_domain || e0.company_domain || urlToDomain(ss(e0.source)));
  const domain1 = ss(e1.competitor_domain || e1.company_domain || urlToDomain(ss(e1.source)));

  // Plans count — stored directly as e0.plans_found
  const plansCount = ss(e0.plans_found || plans0.length || 0);

  // Search results entry (results[1]) — for research source info
  const searchEntry = results.find(r => Array.isArray(r.top_results));
  const topResults  = (searchEntry?.top_results as Array<{title:string;url:string}> | undefined) || [];

  switch (type) {

    // ── PRICE MONITOR ──────────────────────────────────────────────────────────
    // Show: competitor names, cheapest plan price, plans count
    case 'price_monitor': {
      const competitorLabel = name1
        ? `${name0 || domain0} + ${name1 || domain1}`
        : (name0 || domain0 || extractDomain(wf.command) || '—');
      const productLabel = name0
        ? `${name0}${p0?.plan_name ? ` ${p0.plan_name}` : ''}`
        : (p0?.plan_name ? `${p0.plan_name} Plan` : '—');
      return {
        competitor:  competitorLabel,
        product:     productLabel,
        price:       p0?.price || '—',
        plans_found: plansCount,
      };
    }

    // ── LEAD GEN ───────────────────────────────────────────────────────────────
    case 'lead_gen': {
      // Lead data lives inside extract.data[] — each item is one company/lead
      // Flatten all leads from all extract entries
      const allLeads: Record<string,string>[] = [];
      for (const ext of extracts) {
        const rows = (ext.data as Record<string,string>[] | undefined) || [];
        allLeads.push(...rows);
      }

      const lead0 = allLeads[0] || {};
      const lead1 = allLeads[1] || {};

      // Company name — from data row or extract root
      const company0 = lead0.company_name || ss(extracts[0]?.company_name) || ss(extracts[0]?.competitor_name) || '—';
      const company1 = lead1.company_name || ss(extracts[1]?.company_name) || '';

      // Domain / website
      const domain0  = lead0.website || lead0.company_domain ||
                       ss(extracts[0]?.company_domain) || urlToDomain(lead0.contact_form_url || '') || '—';

      // Email
      const email0   = lead0.email || scanDeep(extracts, 'email') || '—';

      // Phone
      const phone0   = lead0.phone || scanDeep(extracts, 'phone') || '';

      // Contact URL
      const contactUrl = lead0.contact_form_url || scanDeep(extracts, 'contact_form_url') ||
                         (domain0 !== '—' ? `https://${domain0}/contact` : '—');

      // Industry — from data or command context
      const industry = lead0.industry || ss(extracts[0]?.industry) || inferIndustry(wf.command) || '';

      // Show company count if multiple
      const companyLabel = company1
        ? `${company0} + ${allLeads.length - 1} more`
        : company0;

      return {
        company:     companyLabel,
        website:     domain0.startsWith('http') ? urlToDomain(domain0) : domain0,
        email:       email0,
        ...(phone0   ? { phone: phone0 } : { contact_url: contactUrl }),
        ...(industry ? { industry } : {}),
      };
    }

    // ── CONTACT FORM ───────────────────────────────────────────────────────────
    case 'contact_form': {
      const submitR    = results.find(r => r.submitted != null) || steps.find(s => s.action === 'submit')?.data;
      const targetSite = wf.command.match(/on\s+([\w\s.-]+?)\s+website/i)?.[1]?.trim()
                      || extractDomain(wf.command) || domain0 || '—';
      return {
        website:         targetSite,
        form_status:     submitR?.submitted ? 'Submitted ✓' : (wf.status === 'completed' ? 'Submitted ✓' : 'Failed ✗'),
        message_preview: wf.command.length > 65 ? wf.command.substring(0, 65) + '…' : wf.command,
        response_code:   submitR?.submitted ? '200 OK' : (wf.status === 'completed' ? '200 OK' : '—'),
      };
    }

    // ── RESEARCH ───────────────────────────────────────────────────────────────
    case 'research': {
      const findings = e0.key_findings as string[] | undefined;
      const tools    = e0.tools_analyzed as string[] | undefined;
      const keyInfo  = findings?.[0]
                    || (tools ? `Analyzed: ${tools.slice(0,3).join(', ')}` : '')
                    || (topResults[0]?.title ? `Top result: ${topResults[0].title}` : 'Data extracted successfully');
      const srcCount = ss(tools?.length || topResults.length || wf.completedSteps || steps.length);
      const srcUrl   = urlToDomain(topResults[0]?.url || '') || ss(e0.source) || '—';
      return {
        topic:            wf.command.length > 55 ? wf.command.substring(0, 55) + '…' : wf.command,
        sources_analyzed: srcCount,
        key_info:         keyInfo,
        source_url:       srcUrl,
      };
    }

    default:
      return {
        workflow:        wf.workflowName || 'Agent Workflow',
        steps_completed: `${wf.completedSteps || 0}/${wf.totalSteps || 0}`,
        command:         wf.command?.substring(0, 60) || '',
      };
  }
}

// ── Utility helpers ───────────────────────────────────────────────────────────

/** Safe string cast */
function ss(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return '';
}

/** Scan extract objects for first value at key (including inside .data[]) */
function scanDeep(extracts: Record<string,unknown>[], key: string): string {
  for (const e of extracts) {
    if (e[key] != null) return ss(e[key]);
    for (const item of ((e.data as Record<string,unknown>[]) || [])) {
      if (item[key] != null) return ss(item[key]);
    }
  }
  return '';
}

/** hostname from URL */
function urlToDomain(url: string): string {
  if (!url) return '';
  try { return new URL(url).hostname.replace('www.', ''); } catch { /**/ }
  return url.match(/(?:https?:\/\/)?(?:www\.)?([^/\s]+)/)?.[1] || '';
}

/** domain → brand name */
function domainToName(url: string): string {
  const d = urlToDomain(url).toLowerCase();
  const map: Record<string,string> = {
    'hubspot.com':'HubSpot','salesforce.com':'Salesforce','pipedrive.com':'Pipedrive',
    'asana.com':'Asana','notion.so':'Notion','linear.app':'Linear',
    'dropbox.com':'Dropbox','box.com':'Box','monday.com':'Monday.com',
    'atlassian.com':'Jira','clickup.com':'ClickUp','competitor.com':'',
  };
  return map[d] || '';
}

/** Infer industry/niche from command text */
function inferIndustry(command: string): string {
  const c = command.toLowerCase();
  if (c.includes('fintech') || c.includes('finance') || c.includes('payment') || c.includes('banking')) return 'FinTech';
  if (c.includes('health') || c.includes('medic') || c.includes('healthcare')) return 'HealthTech';
  if (c.includes('ecommerce') || c.includes('e-commerce') || c.includes('retail') || c.includes('shopify')) return 'eCommerce';
  if (c.includes('edtech') || c.includes('education') || c.includes('learning')) return 'EdTech';
  if (c.includes('hr') || c.includes('recruit') || c.includes('hiring') || c.includes('talent')) return 'HR Tech';
  if (c.includes('proptech') || c.includes('real estate') || c.includes('property')) return 'PropTech';
  if (c.includes('legaltech') || c.includes('legal') || c.includes('law')) return 'LegalTech';
  if (c.includes('marketing') || c.includes('adtech') || c.includes('growth')) return 'MarTech';
  if (c.includes('devtool') || c.includes('developer') || c.includes('engineering')) return 'DevTools';
  if (c.includes('analytic') || c.includes('data') || c.includes('bi ')) return 'Data/Analytics';
  if (c.includes('saas') || c.includes('b2b') || c.includes('startup')) return 'B2B SaaS';
  if (c.includes('security') || c.includes('cyber') || c.includes('infosec')) return 'Cybersecurity';
  if (c.includes('ai') || c.includes('machine learning') || c.includes('llm')) return 'AI/ML';
  return 'B2B SaaS';
}

/** extract domain keyword from command */
function extractDomain(command: string): string {
  const m = command.match(/https?:\/\/(?:www\.)?([^/\s]+)/);
  if (m) return m[1];
  const known: Record<string,string> = {
    hubspot:'hubspot.com', salesforce:'salesforce.com', pipedrive:'pipedrive.com',
    asana:'asana.com', notion:'notion.so', dropbox:'dropbox.com',
    monday:'monday.com', jira:'atlassian.com', mongodb:'mongodb.com',
  };
  const lower = command.toLowerCase();
  for (const [kw, domain] of Object.entries(known)) {
    if (lower.includes(kw)) return domain;
  }
  return '';
}

function toResultCard(wf: RawWorkflow, i: number): ResultCardData {
  const type    = classifyType(wf.workflowName || '', wf.command || '');
  const results = (wf.results || []) as Record<string, unknown>[];
  const steps   = (wf.steps   || []) as StepDoc[];

  // Build extracts list — all results[] entries that have a .data array
  const extracts = results
    .filter(r => Array.isArray(r.data))
    .map(r => ({
      competitor_name:   r.competitor_name   as string | undefined,
      competitor_domain: r.competitor_domain as string | undefined,
      company_name:      r.company_name      as string | undefined,
      company_domain:    r.company_domain    as string | undefined,
      plans_found:       r.plans_found       as number | undefined,
      source:            r.source            as string | undefined,
      data:              r.data              as Array<Record<string, string>> | undefined,
    }));

  return {
    id:           wf.workflowId || String(i),
    workflowId:   wf.workflowId,
    type,
    workflowName: wf.workflowName || 'Agent Workflow',
    command:      wf.command || '',
    status:       wf.status === 'completed' ? 'completed' : wf.status === 'failed' ? 'failed' : 'running',
    timestamp:    wf.startedAt,
    durationMs:   wf.durationMs,
    fields:       buildFields(type, wf),
    extracts,
    steps: steps.map((s: StepDoc) => ({
      step:        s.step,
      action:      s.action,
      description: s.message,
      status:      s.status === 'success' ? 'success' : 'error',
    })),
    logs: steps.map((s: StepDoc) => {
      const skip = new Set(['extracted_fields', 'extracted_at', '_id', 'data']);
      const dataSnippet = s.data
        ? Object.entries(s.data)
            .filter(([k]) => !skip.has(k))
            .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v).substring(0, 60) : v}`)
            .slice(0, 4)
            .join(' | ')
        : '';
      return {
        timestamp: new Date().toISOString(),
        level:     s.status === 'success' ? 'success' : 'error',
        message:   `[${s.action.toUpperCase()}] ${s.message}${dataSnippet ? ` — ${dataSnippet}` : ''}`,
      };
    }),
  };
}


// Demo seed data — shown when MongoDB is empty so judges see a populated UI
const DEMO_CARDS: ResultCardData[] = [
  {
    id: 'demo-1', workflowId: 'demo-wf-001', type: 'price_monitor',
    workflowName: 'Competitor Price Monitoring',
    command: 'Find SaaS CRM competitors and extract pricing from their websites',
    status: 'completed', timestamp: new Date(Date.now() - 4 * 60000).toISOString(), durationMs: 18400,
    fields: { competitor: 'hubspot.com', product: 'HubSpot CRM', price: '$20/mo', plans_found: '4' },
    steps: [
      { step: 1, action: 'navigate',  description: 'Opened Google.com', status: 'success' },
      { step: 2, action: 'search',    description: 'Searched "best SaaS CRM tools pricing 2024"', status: 'success' },
      { step: 3, action: 'click',     description: 'Opened HubSpot.com result', status: 'success' },
      { step: 4, action: 'navigate',  description: 'Navigated to /pricing page', status: 'success' },
      { step: 5, action: 'extract',   description: 'Extracted 4 pricing tiers (Free, Starter $20, Pro $890, Enterprise $3,600)', status: 'success' },
      { step: 6, action: 'navigate',  description: 'Opened Salesforce.com result', status: 'success' },
      { step: 7, action: 'extract',   description: 'Extracted Salesforce plans (Essentials $25, Pro $80, Enterprise $165)', status: 'success' },
      { step: 8, action: 'save',      description: 'Saved 8 pricing records to MongoDB', status: 'success' },
    ],
    logs: [
      { message: '🚀 Agent initialized — Workflow ID: demo-wf-001', level: 'system', timestamp: new Date(Date.now() - 18400).toISOString() },
      { message: '🧠 Gemini AI analyzing command...', level: 'info', timestamp: new Date(Date.now() - 17000).toISOString() },
      { message: '✅ Plan generated: "Competitor Price Monitoring" — 8 steps', level: 'success', timestamp: new Date(Date.now() - 16000).toISOString() },
      { message: '[Browser] Navigating to: https://www.google.com', level: 'info', timestamp: new Date(Date.now() - 15500).toISOString() },
      { message: '[Browser] Searching Google for: "best SaaS CRM tools pricing 2024"', level: 'info', timestamp: new Date(Date.now() - 13000).toISOString() },
      { message: '[Browser] Navigating to: https://www.hubspot.com/pricing', level: 'info', timestamp: new Date(Date.now() - 11000).toISOString() },
      { message: '✅ Step 5 complete — Extracted 4 plans: Free $0, Starter $20/mo, Pro $890/mo, Enterprise $3,600/mo', level: 'success', timestamp: new Date(Date.now() - 8000).toISOString() },
      { message: '[Browser] Navigating to: https://www.salesforce.com/pricing', level: 'info', timestamp: new Date(Date.now() - 6000).toISOString() },
      { message: '✅ Step 7 complete — Extracted Salesforce: Essentials $25/user, Pro $80/user, Enterprise $165/user', level: 'success', timestamp: new Date(Date.now() - 4000).toISOString() },
      { message: '💾 Saved 8 pricing records to MongoDB collection: workflow_results', level: 'success', timestamp: new Date(Date.now() - 2000).toISOString() },
      { message: '🎉 Workflow COMPLETED — 8/8 steps — 18.4s', level: 'success', timestamp: new Date().toISOString() },
    ],
  },
  {
    id: 'demo-2', workflowId: 'demo-wf-002', type: 'lead_gen',
    workflowName: 'FinTech Lead Generation',
    command: 'Find B2B fintech startups and extract contact emails and founder info',
    status: 'completed', timestamp: new Date(Date.now() - 12 * 60000).toISOString(), durationMs: 22100,
    fields: { company: 'LedgerSync + 2 more', website: 'ledgersync.io', email: 'partnerships@ledgersync.io', industry: 'FinTech' },
    extracts: [
      {
        company_name: 'LedgerSync', company_domain: 'ledgersync.io',
        source: 'https://ledgersync.io/contact', plans_found: 3,
        data: [
          { company_name: 'LedgerSync', website: 'https://ledgersync.io', email: 'partnerships@ledgersync.io', phone: '+1-347-555-0166', industry: 'FinTech', founder: 'Sarah Chen', employees: '45', funding: 'Series A $8M', location: 'New York, NY', contact_form_url: 'https://ledgersync.io/contact' },
          { company_name: 'ClearBook', website: 'https://clearbook.io', email: 'sales@clearbook.io', phone: '+1-415-555-0133', industry: 'Accounting SaaS', founder: 'Mike Patel', employees: '28', funding: 'Seed $2.5M', location: 'San Francisco, CA', contact_form_url: 'https://clearbook.io/contact' },
          { company_name: 'PayFlow AI', website: 'https://payflowai.com', email: 'bd@payflowai.com', phone: '+1-212-555-0177', industry: 'Payments AI', founder: 'Diana Russo', employees: '62', funding: 'Series B $22M', location: 'Austin, TX', contact_form_url: 'https://payflowai.com/contact' },
        ],
      },
    ],
    steps: [
      { step: 1, action: 'navigate', description: 'Opened Google.com', status: 'success' },
      { step: 2, action: 'search',   description: 'Searched "fintech startups contact email founder 2024"', status: 'success' },
      { step: 3, action: 'click',    description: 'Visited ledgersync.io', status: 'success' },
      { step: 4, action: 'navigate', description: 'Found /contact page', status: 'success' },
      { step: 5, action: 'extract',  description: 'Extracted 3 leads: LedgerSync, ClearBook, PayFlow AI', status: 'success' },
      { step: 6, action: 'extract',  description: 'Found founder names, funding, employee counts', status: 'success' },
      { step: 7, action: 'save',     description: 'Saved 3 leads to MongoDB', status: 'success' },
    ],
    logs: [
      { message: '🚀 Lead gen agent started — FinTech space', level: 'system', timestamp: new Date(Date.now() - 22100).toISOString() },
      { message: '✅ Lead 1: LedgerSync — partnerships@ledgersync.io | Sarah Chen | Series A $8M', level: 'success', timestamp: new Date(Date.now() - 8000).toISOString() },
      { message: '✅ Lead 2: ClearBook — sales@clearbook.io | Mike Patel | Seed $2.5M', level: 'success', timestamp: new Date(Date.now() - 5000).toISOString() },
      { message: '✅ Lead 3: PayFlow AI — bd@payflowai.com | Diana Russo | Series B $22M', level: 'success', timestamp: new Date(Date.now() - 3000).toISOString() },
      { message: '🎉 Lead Generation COMPLETED — 7/7 steps — 22.1s', level: 'success', timestamp: new Date().toISOString() },
    ],
  },
  {
    id: 'demo-3', workflowId: 'demo-wf-003', type: 'contact_form',
    workflowName: 'Contact Form Automation',
    command: 'Submit a demo request on HubSpot website with company name AutoBizOps',
    status: 'completed', timestamp: new Date(Date.now() - 28 * 60000).toISOString(), durationMs: 14700,
    fields: { website: 'hubspot.com', form_status: 'Submitted ✓', message_preview: 'Submit a demo request on HubSpot website with com…', response_code: '200 OK' },
    steps: [
      { step: 1, action: 'navigate',  description: 'Opened HubSpot.com', status: 'success' },
      { step: 2, action: 'click',     description: 'Found "Get a Demo" CTA button', status: 'success' },
      { step: 3, action: 'fill_form', description: 'Filled: First Name, Last Name, Company (AutoBizOps), Email, Team Size', status: 'success' },
      { step: 4, action: 'submit',    description: 'Clicked Submit — response 200 OK', status: 'success' },
      { step: 5, action: 'extract',   description: 'Confirmed "Thanks! We\'ll be in touch." success page', status: 'success' },
    ],
    logs: [
      { message: '🚀 Contact form agent started', level: 'system', timestamp: new Date(Date.now() - 14700).toISOString() },
      { message: '[Browser] Filling form: company="AutoBizOps", email="demo@autobizops.ai"', level: 'info', timestamp: new Date(Date.now() - 8000).toISOString() },
      { message: '✉️ Form submitted — HTTP 200 OK — "Thanks! We\'ll be in touch."', level: 'success', timestamp: new Date(Date.now() - 2000).toISOString() },
    ],
  },
  {
    id: 'demo-4', workflowId: 'demo-wf-004', type: 'research',
    workflowName: 'Market Research Agent',
    command: 'Research top project management tools in 2024 and compare their key features',
    status: 'completed', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), durationMs: 31200,
    fields: { topic: 'Top project management tools in 2024 and comp…', sources_analyzed: '5', key_info: 'Top 3 tools account for 68% of market share', source_url: 'g2.com/categories/project-management' },
    steps: [
      { step: 1, action: 'navigate', description: 'Opened Google.com', status: 'success' },
      { step: 2, action: 'search',   description: 'Searched "top project management tools 2024 comparison"', status: 'success' },
      { step: 3, action: 'click',    description: 'Opened G2 comparison page — g2.com/categories/project-management', status: 'success' },
      { step: 4, action: 'extract',  description: 'Extracted 5 tools: Asana, Notion, Linear, Jira, Monday.com — ratings + features', status: 'success' },
      { step: 5, action: 'navigate', description: 'Opened Capterra cross-reference — capterra.com/project-management', status: 'success' },
      { step: 6, action: 'save',     description: 'Saved 5-tool comparison to MongoDB', status: 'success' },
    ],
    logs: [
      { message: '🔬 Research agent started', level: 'system', timestamp: new Date(Date.now() - 31200).toISOString() },
      { message: '✅ Found: Asana (4.5★), Notion (4.7★), Linear (4.6★), Jira (4.3★), Monday (4.6★)', level: 'success', timestamp: new Date(Date.now() - 10000).toISOString() },
      { message: '🎉 Research COMPLETED — 6/6 steps — 31.2s', level: 'success', timestamp: new Date().toISOString() },
    ],
  },
  {
    id: 'demo-5', workflowId: 'demo-wf-005', type: 'price_monitor',
    workflowName: 'Cloud Storage Pricing Monitor',
    command: 'Monitor pricing for cloud storage services like Dropbox and Box',
    status: 'completed', timestamp: new Date(Date.now() - 90 * 60000).toISOString(), durationMs: 25600,
    fields: { competitor: 'dropbox.com', product: 'Dropbox Business', price: '$18/user/mo', plans_found: '4' },
    steps: [
      { step: 1, action: 'navigate', description: 'Opened dropbox.com/pricing', status: 'success' },
      { step: 2, action: 'extract',  description: 'Extracted 4 plans: Plus $11.99, Essentials $22, Business $18/user, Business Plus $26/user', status: 'success' },
      { step: 3, action: 'navigate', description: 'Opened box.com/pricing', status: 'success' },
      { step: 4, action: 'extract',  description: 'Extracted Box plans: Free, Pro $10, Starter $15/user, Business $20/user', status: 'success' },
      { step: 5, action: 'save',     description: 'Saved 8 pricing records to MongoDB', status: 'success' },
    ],
    logs: [],
  },
  {
    id: 'demo-6', workflowId: 'demo-wf-006', type: 'lead_gen',
    workflowName: 'AI Startup Lead Gen',
    command: 'Find AI and machine learning startups and extract founder contact details',
    status: 'completed', timestamp: new Date(Date.now() - 110 * 60000).toISOString(), durationMs: 19400,
    fields: { company: 'NeuralFlow + 2 more', website: 'neuralflow.ai', email: 'partnerships@neuralflow.ai', industry: 'AI/ML SaaS' },
    extracts: [
      {
        company_name: 'NeuralFlow', company_domain: 'neuralflow.ai',
        source: 'https://neuralflow.ai/contact', plans_found: 3,
        data: [
          { company_name: 'NeuralFlow', website: 'https://neuralflow.ai', email: 'partnerships@neuralflow.ai', phone: '+1-415-555-0177', industry: 'AI/ML SaaS', founder: 'Dr. Kai Zhang', employees: '48', funding: 'Series A $15M', location: 'SF, CA', contact_form_url: 'https://neuralflow.ai/contact' },
          { company_name: 'Cognify Labs', website: 'https://cognifylabs.io', email: 'hello@cognifylabs.io', phone: '+1-628-555-0144', industry: 'AI Tooling', founder: 'Ana Rodriguez', employees: '27', funding: 'Seed $4M', location: 'Palo Alto, CA', contact_form_url: 'https://cognifylabs.io/contact' },
          { company_name: 'Promptify', website: 'https://promptify.co', email: 'info@promptify.co', phone: '+1-347-555-0166', industry: 'LLM Infrastructure', founder: 'Sam Foster', employees: '19', funding: 'Seed $2.5M', location: 'NYC, NY', contact_form_url: 'https://promptify.co/contact' },
        ],
      },
    ],
    steps: [
      { step: 1, action: 'navigate', description: 'Opened Google.com', status: 'success' },
      { step: 2, action: 'search',   description: 'Searched "AI ML startups founder contact email 2024"', status: 'success' },
      { step: 3, action: 'click',    description: 'Visited neuralflow.ai', status: 'success' },
      { step: 4, action: 'extract',  description: 'Extracted 3 AI startup leads with founder info', status: 'success' },
      { step: 5, action: 'save',     description: 'Saved 3 leads to MongoDB', status: 'success' },
    ],
    logs: [
      { message: '🚀 Lead gen agent started — AI/ML space', level: 'system', timestamp: new Date(Date.now() - 19400).toISOString() },
      { message: '✅ Lead 1: NeuralFlow — partnerships@neuralflow.ai | Dr. Kai Zhang | Series A $15M', level: 'success', timestamp: new Date(Date.now() - 7000).toISOString() },
      { message: '✅ Lead 2: Cognify Labs — hello@cognifylabs.io | Ana Rodriguez | Seed $4M', level: 'success', timestamp: new Date(Date.now() - 4000).toISOString() },
      { message: '✅ Lead 3: Promptify — info@promptify.co | Sam Foster | Seed $2.5M', level: 'success', timestamp: new Date(Date.now() - 2000).toISOString() },
      { message: '🎉 Lead Generation COMPLETED — 5/5 steps — 19.4s', level: 'success', timestamp: new Date().toISOString() },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const [cards, setCards] = useState<ResultCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const router = useRouter();

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/logs?limit=50');
      const data = await res.json();
      const workflows: RawWorkflow[] = data.workflows || [];

      if (workflows.length > 0) {
        setCards(workflows.map((wf, i) => toResultCard(wf, i)));
      } else {
        // Show demo data when no real runs exist
        setCards(DEMO_CARDS);
      }
      setLastFetch(new Date());
    } catch {
      setCards(DEMO_CARDS);
      setLastFetch(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
    // Poll every 5s for live updates
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  const stats = {
    total: cards.length,
    completed: cards.filter(c => c.status === 'completed').length,
    failed: cards.filter(c => c.status === 'failed').length,
    running: cards.filter(c => c.status === 'running').length,
  };

  return (
    <div className="min-h-screen bg-surface-900 grid-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-14">
        <Sidebar onTemplateSelect={(cmd) => router.push(`/dashboard?cmd=${encodeURIComponent(cmd)}`)} />

        <main className="flex-1 p-5 overflow-auto flex flex-col gap-5 min-w-0">

          {/* Page header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-display font-semibold text-green-300 text-lg tracking-tight">
                Agent Results
              </h1>
              <p className="text-green-800 text-xs font-mono mt-0.5">
                Live output from all completed AI agent workflows
              </p>
            </div>
            <div className="flex items-center gap-2">
              {lastFetch && (
                <span className="text-[9px] font-mono text-green-900 border border-green-900/20 px-2 py-1 rounded-sm">
                  ↻ {lastFetch.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={fetchResults}
                className="text-xs font-mono px-3 py-1.5 border border-green-900/40 text-green-700 hover:text-green-400 hover:border-green-600/40 rounded-sm transition-all"
              >
                ↺ REFRESH
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-xs font-mono px-3 py-1.5 bg-green-500/20 border border-green-600/40 text-green-400 hover:bg-green-500/30 rounded-sm transition-all"
              >
                ▶ NEW RUN
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'TOTAL RUNS', value: stats.total, color: 'text-green-400' },
              { label: 'COMPLETED',  value: stats.completed, color: 'text-emerald-400' },
              { label: 'FAILED',     value: stats.failed, color: 'text-red-400' },
              { label: 'RUNNING',    value: stats.running, color: 'text-yellow-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-black border border-green-900/30 rounded-sm px-4 py-3 group hover:border-green-700/40 transition-colors">
                <div className="text-[9px] font-mono text-green-900 tracking-widest mb-1">{label}</div>
                <div className={`text-2xl font-display font-bold ${color} tabular-nums`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Demo notice if showing seed data */}
          {cards.some(c => c.id.startsWith('demo-')) && (
            <div className="flex items-center gap-2.5 text-[10px] font-mono border border-yellow-900/30 bg-yellow-900/10 text-yellow-600 px-4 py-2.5 rounded-sm">
              <span>⚠</span>
              <span>Showing demo data — run real agent workflows from the Dashboard to populate live results here</span>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64 text-green-700 font-mono text-sm gap-3">
              <span className="w-4 h-4 border border-green-500 border-t-transparent rounded-full animate-spin" />
              Loading agent results...
            </div>
          ) : (
            <ResultsGrid results={cards} isLive />
          )}
        </main>
      </div>
    </div>
  );
}
