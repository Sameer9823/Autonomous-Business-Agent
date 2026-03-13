import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

if (!GEMINI_API_KEY) {
  throw new Error('Please define the GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export function getGeminiModel(): GenerativeModel {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

export async function generatePlan(command: string): Promise<string> {
  const model = getGeminiModel();

  const prompt = `You are an AI business operations agent planner. 
Convert the following user command into a structured JSON execution plan for a web automation agent.

User Command: "${command}"

Return ONLY a valid JSON object with this exact structure:
{
  "workflow_name": "string",
  "objective": "string", 
  "steps": [
    {
      "step_number": 1,
      "action": "navigate|search|click|extract|fill_form|submit|wait|save",
      "target": "string (URL or element description)",
      "description": "string (human readable description)",
      "extract_fields": ["field1", "field2"] // only for extract actions
    }
  ],
  "expected_output": "string"
}

Common workflows:
- Price monitoring: navigate Google → search → open product pages → extract prices
- Lead generation: search companies → visit sites → find contacts → extract emails
- Contact forms: navigate to site → find contact page → fill form → submit

Make steps specific and actionable. Include 5-8 steps.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Strip markdown code fences if present
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return clean;
}
