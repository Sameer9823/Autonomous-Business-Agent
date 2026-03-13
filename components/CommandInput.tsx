'use client';

interface CommandInputProps {
  onSubmit: (command: string) => void;
  isRunning: boolean;
  /** Controlled value — parent owns the state */
  value: string;
  onChange: (v: string) => void;
}

const EXAMPLE_COMMANDS = [
  'Find SaaS CRM competitors and extract pricing',
  'Research top project management tools and their features',
  'Find B2B SaaS companies and extract contact emails',
  'Monitor pricing for cloud storage services',
];

export default function CommandInput({ onSubmit, isRunning, value, onChange }: CommandInputProps) {
  const handleSubmit = () => {
    if (!value.trim() || isRunning) return;
    onSubmit(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  return (
    <div className="glow-border rounded-sm bg-surface-700 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] font-mono text-green-800 tracking-widest">AGENT COMMAND TERMINAL</span>
      </div>

      {/* Prompt line */}
      <div className="flex items-start gap-2 mb-3">
        <span className="font-mono text-green-500 text-sm mt-2 select-none">$</span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter agent command... (e.g. 'Find SaaS CRM competitors and extract pricing')"
          disabled={isRunning}
          rows={2}
          className="flex-1 bg-transparent text-green-300 text-sm font-mono placeholder:text-green-900 focus:outline-none resize-none leading-relaxed"
        />
      </div>

      {/* Examples */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {EXAMPLE_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            onClick={() => onChange(cmd)}
            disabled={isRunning}
            className="text-[10px] font-mono px-2 py-1 rounded-sm border border-green-900/40 text-green-800 hover:text-green-500 hover:border-green-700/40 transition-all disabled:opacity-30"
          >
            {cmd.substring(0, 35)}...
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-green-900">Ctrl+Enter to execute</span>
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isRunning}
          className={`px-5 py-2 text-xs font-mono font-medium rounded-sm transition-all duration-200 flex items-center gap-2 ${
            isRunning
              ? 'bg-green-900/30 text-green-700 border border-green-800/40 cursor-not-allowed'
              : 'bg-green-500 text-green-950 hover:bg-green-400 active:scale-95'
          }`}
        >
          {isRunning ? (
            <>
              <span className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin" />
              RUNNING...
            </>
          ) : (
            <>▶ RUN AGENT</>
          )}
        </button>
      </div>
    </div>
  );
}
