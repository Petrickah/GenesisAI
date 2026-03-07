// src/grammar/grammar.d.ts

export interface PeggySyntaxError extends Error {
  location: {
    start: { offset: number; line: number; column: number };
    end: { offset: number; line: number; column: number };
  };
}

export function parse(input: string, options?: any): any;

// Această linie este critică pentru NodeNext și CommonJS interop
declare const parser: {
  parse: typeof parse;
  SyntaxError: PeggySyntaxError;
};

export default parser;