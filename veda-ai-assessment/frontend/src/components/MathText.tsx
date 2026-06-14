'use client';

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Parses text containing LaTeX math delimiters and renders them beautifully.
 * Supports: $$...$$ (block), $...$ (inline), \(...\) (inline), \[...\] (block)
 */
export function MathText({ text, className }: MathTextProps) {
  if (!text) return null;

  // Split text by math delimiters, keeping the delimiters in the array
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([^)]*?\\\))/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        // Block math: $$...$$ or \[...\]
        if ((part.startsWith('$$') && part.endsWith('$$')) ||
            (part.startsWith('\\[') && part.endsWith('\\]'))) {
          const math = part.startsWith('$$')
            ? part.slice(2, -2).trim()
            : part.slice(2, -2).trim();
          return (
            <span key={i} className="block my-2">
              <BlockMath math={math} />
            </span>
          );
        }

        // Inline math: $...$ or \(...\)
        if ((part.startsWith('$') && part.endsWith('$') && part.length > 2) ||
            (part.startsWith('\\(') && part.endsWith('\\)'))) {
          const math = part.startsWith('$')
            ? part.slice(1, -1).trim()
            : part.slice(2, -2).trim();
          try {
            return <InlineMath key={i} math={math} />;
          } catch {
            return <span key={i}>{part}</span>;
          }
        }

        // Plain text — preserve line breaks
        return (
          <span key={i}>
            {part.split('\n').map((line, j, arr) => (
              <React.Fragment key={j}>
                {line}
                {j < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      })}
    </span>
  );
}
