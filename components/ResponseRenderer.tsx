
import React from 'react';
import CodeBlock from './CodeBlock';
import Visualization from './Visualization';
import { VisualizationData } from '../types';

interface ResponseRendererProps {
  content: string;
}

const ResponseRenderer: React.FC<ResponseRendererProps> = ({ content }) => {
  // Simple parser to split by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  // Helper to process inline formatting (bold)
  const formatLine = (text: string) => {
    // Split by bold markers (**text**)
    const segments = text.split(/(\*\*.*?\*\*)/g);
    
    return segments.map((segment, index) => {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        // Remove the ** markers and render as bold with color accent
        return (
          <strong key={index} className="font-semibold text-indigo-300">
            {segment.slice(2, -2)}
          </strong>
        );
      }
      return segment;
    });
  };

  return (
    <div className="space-y-2 leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // Extract language and code
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          if (match) {
            const language = match[1];
            const code = match[2];

            // Check if it's a visualization JSON
            if (language === 'json' && code.includes('"visualization"')) {
              try {
                const parsed = JSON.parse(code);
                if (parsed.visualization) {
                  return <Visualization key={index} data={parsed.visualization as VisualizationData} />;
                }
              } catch (e) {
                // If parsing fails, just render as code
              }
            }

            return <CodeBlock key={index} language={language} code={code} />;
          }
        }
        
        // Regular text formatting
        if (!part.trim()) return null;
        
        return (
          <div key={index} className="prose prose-invert max-w-none text-gray-300">
            {part.split('\n').map((line, i) => (
              <p key={i} className="mb-2 min-h-[1em] whitespace-pre-wrap">
                {formatLine(line)}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default ResponseRenderer;
