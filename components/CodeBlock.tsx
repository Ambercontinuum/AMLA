import React, { useState } from 'react';

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    // Simulate running code
    setIsRunning(true);
    setOutput(null);
    setTimeout(() => {
      setIsRunning(false);
      setOutput(`> Execution completed successfully.\n> Output generated at ${new Date().toLocaleTimeString()}`);
    }, 1200);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-700 bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
        <span className="text-xs font-mono text-gray-400 lowercase">{language || 'text'}</span>
        <div className="flex space-x-2">
          <button 
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center space-x-1 text-xs text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>
          <button 
            onClick={handleCopy}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-sm text-gray-300">
          <code>{code}</code>
        </pre>
      </div>
      {output && (
        <div className="p-3 bg-black border-t border-gray-800 font-mono text-xs text-green-400">
          <pre>{output}</pre>
        </div>
      )}
    </div>
  );
};

export default CodeBlock;