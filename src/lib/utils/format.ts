import { format as prettierFormat } from 'prettier/standalone';
import * as prettierBabel from 'prettier/plugins/babel';
import * as prettierEstree from 'prettier/plugins/estree';

const PRETTIER_OPTIONS = {
  parser: 'babel',
  plugins: [prettierBabel, prettierEstree],
  semi: false,
  singleQuote: true,
  trailingComma: 'es5' as const,
  printWidth: 80,
  tabWidth: 2,
};

/**
 * Format Strudel/JavaScript code using Prettier
 */
export async function formatCode(code: string): Promise<string> {
  try {
    const formatted = await prettierFormat(code, PRETTIER_OPTIONS);
    return formatted;
  } catch (error) {
    // If formatting fails (e.g., syntax error), return original code
    console.warn('Failed to format code:', error);
    return code;
  }
}

/**
 * Check if code can be formatted (valid syntax)
 */
export async function canFormatCode(code: string): Promise<boolean> {
  try {
    await prettierFormat(code, PRETTIER_OPTIONS);
    return true;
  } catch {
    return false;
  }
}
