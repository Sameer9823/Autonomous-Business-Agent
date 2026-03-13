import Link from 'next/link';
import Navbar from '@/components/Navbar';

const features = [
  { icon: '🌐', title: 'Real Web Navigation', desc: 'Agent opens and navigates live websites using TinyFish browser sessions' },
  { icon: '🧠', title: 'Gemini AI Planning', desc: 'Google Gemini converts natural language commands into structured step-by-step plans' },
  { icon: '⚡', title: 'Multi-Step Workflows', desc: 'Execute complex sequences: search → visit → extract → save, all autonomously' },
  { icon: '📊', title: 'Data Extraction', desc: 'Pulls pricing, contacts, and structured data from any web page automatically' },
  { icon: '💾', title: 'MongoDB Logging', desc: 'Every action, result, and workflow log persisted to MongoDB for full auditability' },
  { icon: '🔁', title: 'Session Management', desc: 'Manages browser sessions with clean start/stop lifecycle via TinyFish API' },
];

const workflows = [
  {
    title: 'Competitor Price Monitor',
    steps: ['Open Google', 'Search competitors', 'Visit product pages', 'Extract pricing tiers', 'Save to MongoDB'],
    color: 'border-green-700/40',
    badge: 'PRICE INTEL',
  },
  {
    title: 'Lead Generation Agent',
    steps: ['Search companies', 'Visit websites', 'Find contact pages', 'Extract emails/phones', 'Log leads'],
    color: 'border-blue-700/40',
    badge: 'LEAD GEN',
  },
  {
    title: 'Contact Form Automation',
    steps: ['Navigate to site', 'Find contact page', 'Fill form fields', 'Submit form', 'Confirm submission'],
    color: 'border-purple-700/40',
    badge: 'FORM AUTO',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-900 grid-bg">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 text-[10px] font-mono text-green-600 border border-green-900/40 px-3 py-1.5 rounded-sm mb-8 tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          TINYFISH WEB AGENT HACKATHON 2026
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="text-green-300">AutoBizOps</span>
          <br />
          <span className="text-green-800 text-3xl md:text-4xl font-normal">Autonomous Business Agent</span>
        </h1>

        <p className="text-green-600 text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          An AI agent that performs <span className="text-green-400">real work on real websites</span>.
          Powered by TinyFish Web Agent API + Google Gemini AI, executing complex multi-step business workflows autonomously.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-green-500 text-green-950 font-mono font-semibold text-sm hover:bg-green-400 transition-all duration-200 rounded-sm active:scale-95"
          >
            ▶ LAUNCH AGENT CONSOLE
          </Link>
          <Link
            href="/logs"
            className="px-8 py-3 border border-green-800/50 text-green-600 font-mono text-sm hover:border-green-600/60 hover:text-green-400 transition-all duration-200 rounded-sm"
          >
            VIEW EXECUTION LOGS
          </Link>
        </div>
      </section>

      {/* Architecture diagram */}
      <section className="max-w-4xl mx-auto px-6 mb-20">
        <div className="glow-border rounded-sm bg-surface-800 p-6">
          <div className="text-[10px] font-mono text-green-800 tracking-widest mb-6 text-center">AGENT WORKFLOW ARCHITECTURE</div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {['USER COMMAND', 'GEMINI AI PLANNER', 'TINYFISH EXECUTOR', 'BROWSER SESSIONS', 'MONGODB RESULTS'].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <div className="px-3 py-2 border border-green-800/40 bg-surface-700 rounded-sm text-[10px] font-mono text-green-500 text-center min-w-[100px]">
                  {step}
                </div>
                {i < arr.length - 1 && <span className="text-green-800 font-mono">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div className="text-[10px] font-mono text-green-800 tracking-widest text-center mb-8">CAPABILITIES</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="glow-border rounded-sm bg-surface-800 p-5 card-hover">
              <div className="text-2xl mb-3">{icon}</div>
              <div className="font-display font-semibold text-green-300 mb-2 text-sm">{title}</div>
              <div className="text-green-700 text-xs leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow examples */}
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div className="text-[10px] font-mono text-green-800 tracking-widest text-center mb-8">EXAMPLE WORKFLOWS</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workflows.map(({ title, steps, color, badge }) => (
            <div key={title} className={`glow-border rounded-sm bg-surface-800 p-5 border ${color}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="font-display font-semibold text-green-300 text-sm">{title}</div>
                <span className="text-[9px] font-mono text-green-800 border border-green-900/40 px-1.5 py-0.5 rounded-sm">{badge}</span>
              </div>
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono text-green-700">
                    <span className="text-green-900 w-4 text-right text-[10px]">{i + 1}.</span>
                    <span className="text-green-600">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="max-w-3xl mx-auto px-6 pb-20 text-center">
        <div className="text-[10px] font-mono text-green-800 tracking-widest mb-6">TECH STACK</div>
        <div className="flex flex-wrap justify-center gap-2">
          {['TinyFish Web Agent API', 'Google Gemini AI', 'Next.js 14', 'TypeScript', 'TailwindCSS', 'MongoDB', 'Playwright', 'React'].map(tech => (
            <span key={tech} className="text-xs font-mono text-green-700 border border-green-900/40 px-2.5 py-1 rounded-sm bg-surface-800">
              {tech}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
