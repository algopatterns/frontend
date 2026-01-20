import React from 'react';

// strudel theme colors
export const STRUDEL_COLORS = {
  grey: '#7c859a',    // comments, brackets
  purple: '#c792ea',  // function names
  blue: '#7fc9e6',    // $:, /, ., ,
  green: '#b8dd87',   // everything else (strings, numbers, identifiers)
};

// simple syntax highlighter matching strudel's 4-color scheme
export function highlightStrudelCode(code: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < code.length) {
    // check for $: pattern - light blue
    if (code[i] === '$' && code[i + 1] === ':') {
      tokens.push(
        <span key={key++} style={{ color: STRUDEL_COLORS.blue }}>
          $:
        </span>
      );
      i += 2;
      continue;
    }

    // check for comments - grey
    if (code[i] === '/' && code[i + 1] === '/') {
      let end = i;
      while (end < code.length && code[end] !== '\n') end++;
      tokens.push(
        <span key={key++} style={{ color: STRUDEL_COLORS.grey }}>
          {code.slice(i, end)}
        </span>
      );
      i = end;
      continue;
    }

    // check for brackets - grey
    if (/[()[\]{}]/.test(code[i])) {
      tokens.push(
        <span key={key++} style={{ color: STRUDEL_COLORS.grey }}>
          {code[i]}
        </span>
      );
      i++;
      continue;
    }

    // check for /, ., , - light blue
    if (code[i] === '/' || code[i] === '.' || code[i] === ',') {
      tokens.push(
        <span key={key++} style={{ color: STRUDEL_COLORS.blue }}>
          {code[i]}
        </span>
      );
      i++;
      continue;
    }

    // check for function/method names (word followed by open paren) - purple
    if (/[a-zA-Z_$]/.test(code[i])) {
      let end = i;
      while (end < code.length && /[a-zA-Z0-9_$]/.test(code[end])) end++;
      const word = code.slice(i, end);

      // check if followed by ( - it's a function call
      if (code[end] === '(') {
        tokens.push(
          <span key={key++} style={{ color: STRUDEL_COLORS.purple }}>
            {word}
          </span>
        );
      } else {
        // regular identifier - green
        tokens.push(
          <span key={key++} style={{ color: STRUDEL_COLORS.green }}>
            {word}
          </span>
        );
      }
      i = end;
      continue;
    }

    // strings - green
    if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const quote = code[i];
      let end = i + 1;
      while (end < code.length && code[end] !== quote) {
        if (code[end] === '\\') end++;
        end++;
      }
      end++;
      tokens.push(
        <span key={key++} style={{ color: STRUDEL_COLORS.green }}>
          {code.slice(i, end)}
        </span>
      );
      i = end;
      continue;
    }

    // numbers - green
    if (/\d/.test(code[i])) {
      let end = i;
      while (end < code.length && /[\d.]/.test(code[end])) end++;
      tokens.push(
        <span key={key++} style={{ color: STRUDEL_COLORS.green }}>
          {code.slice(i, end)}
        </span>
      );
      i = end;
      continue;
    }

    // everything else (operators, whitespace, etc.) - green
    tokens.push(
      <span key={key++} style={{ color: STRUDEL_COLORS.green }}>
        {code[i]}
      </span>
    );
    i++;
  }

  return tokens;
}
