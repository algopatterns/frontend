'use client';

import { useMemo } from 'react';

interface CodeDisplayProps {
  code: string;
}

// Simple syntax highlighter for Strudel/JavaScript code
function highlightCode(code: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < code.length) {
    // Check for strings (single or double quotes)
    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i];
      let end = i + 1;
      while (end < code.length && code[end] !== quote) {
        if (code[end] === '\\') end++; // Skip escaped chars
        end++;
      }
      end++; // Include closing quote
      tokens.push(
        <span key={key++} className="text-emerald-400">
          {code.slice(i, end)}
        </span>
      );
      i = end;
      continue;
    }

    // Check for template literals
    if (code[i] === '`') {
      let end = i + 1;
      while (end < code.length && code[end] !== '`') {
        if (code[end] === '\\') end++;
        end++;
      }
      end++;
      tokens.push(
        <span key={key++} className="text-emerald-400">
          {code.slice(i, end)}
        </span>
      );
      i = end;
      continue;
    }

    // Check for comments
    if (code[i] === '/' && code[i + 1] === '/') {
      let end = i;
      while (end < code.length && code[end] !== '\n') end++;
      tokens.push(
        <span key={key++} className="text-muted-foreground/60 italic">
          {code.slice(i, end)}
        </span>
      );
      i = end;
      continue;
    }

    // Check for numbers
    if (/\d/.test(code[i])) {
      let end = i;
      while (end < code.length && /[\d.]/.test(code[end])) end++;
      tokens.push(
        <span key={key++} className="text-amber-400">
          {code.slice(i, end)}
        </span>
      );
      i = end;
      continue;
    }

    // Check for method calls (word followed by open paren or dot)
    if (/[a-zA-Z_$]/.test(code[i])) {
      let end = i;
      while (end < code.length && /[a-zA-Z0-9_$]/.test(code[end])) end++;
      const word = code.slice(i, end);

      // Keywords
      const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'await', 'async'];
      // Strudel functions
      const strudelFns = ['s', 'n', 'note', 'sound', 'mini', 'stack', 'cat', 'seq', 'fastcat', 'slowcat', 'samples'];
      // Pattern methods
      const methods = ['fast', 'slow', 'rev', 'jux', 'add', 'sub', 'mul', 'div', 'struct', 'mask', 'euclid', 'every', 'sometimes', 'often', 'rarely', 'almostNever', 'almostAlways', 'degrade', 'degradeBy', 'speed', 'gain', 'pan', 'delay', 'room', 'size', 'lpf', 'hpf', 'vowel', 'crush', 'shape', 'orbit', 'cut', 'release', 'attack', 'sustain', 'decay'];

      if (keywords.includes(word)) {
        tokens.push(
          <span key={key++} className="text-purple-400 font-medium">
            {word}
          </span>
        );
      } else if (strudelFns.includes(word)) {
        tokens.push(
          <span key={key++} className="text-cyan-400">
            {word}
          </span>
        );
      } else if (methods.includes(word) || code[end] === '(') {
        tokens.push(
          <span key={key++} className="text-blue-400">
            {word}
          </span>
        );
      } else {
        tokens.push(<span key={key++}>{word}</span>);
      }
      i = end;
      continue;
    }

    // Check for operators and punctuation
    if (/[.(),\[\]{}:;+\-*/%=<>!&|?]/.test(code[i])) {
      tokens.push(
        <span key={key++} className="text-muted-foreground">
          {code[i]}
        </span>
      );
      i++;
      continue;
    }

    // Default: just add the character
    tokens.push(<span key={key++}>{code[i]}</span>);
    i++;
  }

  return tokens;
}

export function CodeDisplay({ code }: CodeDisplayProps) {
  const highlighted = useMemo(() => highlightCode(code), [code]);

  return (
    <pre className="font-mono text-sm whitespace-pre-wrap break-words leading-relaxed">
      {highlighted}
    </pre>
  );
}
