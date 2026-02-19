import { type KrakoanNode } from "../schema/krakoa.schema.js";

export class GraphManager {
  private registry = new Map<string, KrakoanNode>();
  private root: KrakoanNode[] = [];

  constructor(ast: KrakoanNode[]) {
    this.root = this.process(ast);
  }

  private process(nodes: KrakoanNode[]): KrakoanNode[] {
  return nodes.map((node) => {
    const params = node.params as Record<string, any>;
    let activeNode = node;

    if (params && params.id) {
      const id = params.id;
      if (!this.registry.has(id)) {
        this.registry.set(id, node);
      } else {
        activeNode = this.registry.get(id)!;
        this.mergeNodes(activeNode, node);
      }
    }

    if (activeNode.body && activeNode.body.length > 0) {
      activeNode.body = this.process(activeNode.body);
    }

    if (activeNode.type === ":trigger") {
      const p = activeNode.params as any;
      if (p.from) p.from = this.resolve(p.from);
      if (p.to) p.to = this.resolve(p.to);
    }

    return activeNode;
  });
}

private resolve(node: KrakoanNode): KrakoanNode {
  const id = (node.params as any)?.id;
  return id && this.registry.has(id) ? this.registry.get(id)! : node;
}

  private mergeNodes(target: KrakoanNode, source: KrakoanNode) {
    target.params = { ...target.params, ...source.params };
    if (source.body && source.body.length > 0) {
      target.body = [...(target.body || []), ...source.body];
    }
    if (source.tags) {
      target.tags = Array.from(new Set([...(target.tags || []), ...source.tags]));
    }
  }

  public getGraph() {
    return this.root;
  }

  public getEntity(id: string) {
    return this.registry.get(id);
  }
}