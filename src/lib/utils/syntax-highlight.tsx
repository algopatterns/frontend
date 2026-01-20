import React from 'react';

// simple syntax highlighter matching strudel's 4-color scheme
// uses CSS classes so themes can override colors
export function highlightStrudelCode(code: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < code.length) {
    // check for $: pattern
    if (code[i] === '$' && code[i + 1] === ':') {
      tokens.push(
        <span key={key++} className="syntax-blue">
          $:
        </span>
      );
      i += 2;
      continue;
    }

    // check for comments
    if (code[i] === '/' && code[i + 1] === '/') {
      let end = i;
      while (end < code.length && code[end] !== '\n') end++;
      tokens.push(
        <span key={key++} className="syntax-grey">
          {code.slice(i, end)}
        </span>
      );
      i = end;
      continue;
    }

    // check for brackets
    if (/[()[\]{}]/.test(code[i])) {
      tokens.push(
        <span key={key++} className="syntax-grey">
          {code[i]}
        </span>
      );
      i++;
      continue;
    }

    // check for /, ., ,
    if (code[i] === '/' || code[i] === '.' || code[i] === ',') {
      tokens.push(
        <span key={key++} className="syntax-blue">
          {code[i]}
        </span>
      );
      i++;
      continue;
    }

    // check for function/method names (word followed by open paren)
    if (/[a-zA-Z_$]/.test(code[i])) {
      let end = i;
      while (end < code.length && /[a-zA-Z0-9_$]/.test(code[end])) end++;
      const word = code.slice(i, end);

      // check if followed by ( - it's a function call
      if (code[end] === '(') {
        tokens.push(
          <span key={key++} className="syntax-purple">
            {word}
          </span>
        );
      } else {
        // regular identifier
        tokens.push(
          <span key={key++} className="syntax-green">
            {word}
          </span>
        );
      }
      i = end;
      continue;
    }

    // strings
    if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const quote = code[i];
      let end = i + 1;
      while (end < code.length && code[end] !== quote) {
        if (code[end] === '\\') end++;
        end++;
      }
      end++;
      tokens.push(
        <span key={key++} className="syntax-green">
          {code.slice(i, end)}
        </span>
      );
      i = end;
      continue;
    }

    // numbers
    if (/\d/.test(code[i])) {
      let end = i;
      while (end < code.length && /[\d.]/.test(code[end])) end++;
      tokens.push(
        <span key={key++} className="syntax-green">
          {code.slice(i, end)}
        </span>
      );
      i = end;
      continue;
    }

    // everything else (operators, whitespace, etc.)
    tokens.push(
      <span key={key++} className="syntax-green">
        {code[i]}
      </span>
    );
    i++;
  }

  return tokens;
}
