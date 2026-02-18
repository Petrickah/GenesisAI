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

    public execute(ast: any): string {
        if (ast.type === 'action' && ast.action === 'attack') {
            return this.handleAttack(ast.target, ast.value);
        }
        
        if (ast.type === 'query' && ast.action === 'status') {
            return this.getStatus(ast.target);
        }

        return "🧬 [Logic Error]: Unknown command structure.";
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