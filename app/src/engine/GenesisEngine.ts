import parser from '../grammar/grammar.cjs';
import { KrakoanNodeSchema } from '../schema/krakoa.schema.js';
import { GraphManager } from './GraphManager.js';

export interface AgentState {
    name: string;
    hp: number;
    stress: number;
    inventory: string[];
}

export function k(strings: TemplateStringsArray, ...values: any[]) {
  const raw = strings.reduce((acc, str, i) => acc + str + (values[i] || ""), "");
  const ast = parser.parse(raw);
  
  const validated = KrakoanNodeSchema.array().parse(ast);
  const graphManager = new GraphManager(validated);
  
  return graphManager.getGraph();
}