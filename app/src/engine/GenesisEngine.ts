export interface AgentState {
    name: string;
    hp: number;
    stress: number;
    inventory: string[];
}

export class GenesisEngine {
    private agents: Map<string, AgentState> = new Map();

    constructor() {
        this.agents.set("Wade", { name: "Wade Wilson", hp: 100, stress: 0, inventory: ["Pizza", "Katana"]});
        this.agents.set("Anran", { name: "Anran Ye", hp: 120, stress: 10, inventory: ["Zhuque Fan"]});
    }

    execute(ast: any[]) {
        if (!Array.isArray(ast)) return "⚠️ [Engine Error]: AST invalid.";
        
        const logs: string[] = [];

        ast.forEach(node => {
            switch (node.type) {
                case 'TOTEM':
                    logs.push(this.handleTotem(node));
                    break;
                case 'UNKNOWN_SYMBOL':
                    logs.push(`🏮 [Flavor]: Un simbol mistic apare: ${node.value}`);
                    break;
                default:
                    logs.push(`🧬 [Logic Error]: Structură necunoscută (${node.type})`);
            }
        });

        return logs.join('\n');
    }

    private handleTotem(node: any): string {
        const mapping: Record<string, string> = {
            "🧠": "Sistemul accesează Marele Plan (Concept Mode).",
            "⚔️": "Wade Wilson își ascute săbiile (Combat Mode).",
            "👤": "Un nou agent a fost detectat în perimetru."
        };

        return mapping[node.value] || `✨ Totemul ${node.value} strălucește, dar nu se întâmplă nimic.`;
    }

    private handleAttack(target: string, value: number): string {
        const agent = this.agents.get(target);
        if (!agent) return `👤 Agent [${target}] not found in The Vault.`;

        agent.hp -= value;
        return `⚔️ [Combat]: ${target} took ${value} damage. Remaining HP: ${agent.hp}`;
    }

    private getStatus(target: string): string {
        const agent = this.agents.get(target);
        if (!agent) return `👤 Agent [${target}] unknown.`;
        return `📊 [Status - ${target}]: HP ${agent.hp} | Stress ${agent.stress} | Items: ${agent.inventory.join(", ")}`;
    }
}