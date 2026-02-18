export interface AgentState {
    name: string;
    hp: number;
    stress: number;
    inventory: string[];
}

// GenesisEngine.ts
export class GenesisEngine {
  private activeMission: string | null = null;

  execute(ast: any[]) {
    ast.forEach(node => this.processNode(node));
  }

  private processNode(node: any) {
    const { value } = node.metadata;
    const { id, description } = node.params;

    if (value === "🧠") {
      this.activeMission = id;
      console.log(`\n[SYSTEM]: 🧠 Concept Activat: "${id}"`);
      if (description) {
        this.typeWriterEffect(`📜 Obiectiv: ${description}`);
      }
    }

    // Dacă avem body, intrăm în el (Recursivitate)
    if (node.body && node.body.length > 0) {
      node.body.forEach((child: any) => this.processNode(child));
    }
  }

  private typeWriterEffect(text: string) {
    // Aici poți adăuga logica de typing pentru atmosferă
    console.log(text); 
  }
}