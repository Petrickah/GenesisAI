import parser from '../grammar/grammar.cjs';
import { KrakoanNodeSchema, type KrakoanNode, type KrakoanProgram } from '../schema/krakoa.schema.js';

export interface AgentState {
  name: string;
  hp: number;
  stress: number;
  inventory: string[];
}

export function k(strings: TemplateStringsArray, ...values: any[]): any {
  const raw = strings.reduce((acc, str, i) => acc + str + (values[i] || ""), "");
  const ast = parser.parse(raw);
  
  return KrakoanNodeSchema.array().parse(ast);
}