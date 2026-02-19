import { type KrakoanNode, type KrakoanProgram } from "../schema/krakoa.schema.js";

export class GraphManager {
  private registry = new Map<string, KrakoanNode>();
  private root: KrakoanProgram = null;

  constructor(ast: KrakoanNode[]) {
    this.root = this.process(ast);
  }

  private process(nodes: KrakoanNode[]): KrakoanProgram {
    return null;
  }

  public getGraph() {
    return this.root;
  }
}