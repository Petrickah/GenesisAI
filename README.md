# 🧬 GenesisAI: Krakoa Nexus DSL

- **Status:** Phase 2 - Identity & Behavior Architecture
- **Core:** TypeScript + LLM Anchoring

## 🌌 Purpose of the Project

GenesisAI is a framework designed to solve **Contextual Drift** and **Narrative Hallucination** in Large Language Models (LLMs). By using a Domain Specific Language (DSL) called **Krakoa Nexus**, it anchors complex identities and world logic into immutable, structured data.

Instead of vague system prompts, GenesisAI provides the AI with an **Identity Matrix**—a dense, structured DNA that governs its behavior, logic, and state within the 8k-32k context window of local models (Ollama).

## 🧱 The Philosophy: Identity Over Prompting

LLMs struggle with long-term consistency. GenesisAI introduces **Semantical Determinism**:
- **Human Role:** Use the Krakoa Nexus DSL to define agents, logic, and world rules.
- **System Role:** The **Krakoa Transpiler** converts the DSL into a dense **Identity Matrix (JSON)**.
- **AI Role:** The LLM (Inference Engine) adopts this matrix as its core operating identity, ensuring it remains in character and follows logic constraints without "hallucinating" lore.

---

## 🏗️ The Execution Model: Behavior Trees (BT)

GenesisAI has moved away from a traditional Virtual Machine (VM) to a **Behavior Tree**-style execution:
1. **The Identity Bulletin**: The AI is injected with a structured JSON profile.
2. **Behavioral Ticks**: Logic is evaluated through **Lambda Guards** (using `⚓` Anchors). 
3. **If/Then Branching**: If a logic condition is met, the AI executes the corresponding behavior; otherwise, it skips the branch, maintaining a clean and deterministic context.

---

## 🔣 The Cypher Codex (DSL Tokens)

| **Token** | **Type** | **Description** |
| :--- | :--- | :--- |
| **👤** | **ENTITY** | The Agent or Object being defined. |
| **🧠** | **CONCEPT** | Abstract ideas or in-universe rules. |
| **🧬** | **LOGIC** | Fixed attributes, abilities, and business rules. |
| **⚓** | **ANCHOR** | Immutable truths (guards) that must be validated. |
| **📌** | **STATE** | Dynamic variables (HP, Location, Status). |
| **🔗** | **LINK** | Relational edges (Inheritance, Connections). |
| **➔** | **TRIGGER** | Entry points for behavioral sequences. |

---

## 🃏 Reference Implementation (The Identity Matrix)

```typescript
👤("MAGIK") {
  🧩("Tactical Cynicism") 🔑 [#LowPatience, #Efficient, #Protective];
  🧬("Limbo Logic", mode: "Passive") {
    ⚓("Rule 1", condition: λ(error_level > 5)) {
      💬("Threaten with Limbo exile.");
    }
  }
}
```

---

## 🏁 Conclusion

> _"GenesisAI is not about asking the AI to 'play' a role; it is about providing the AI with the **DNA** to 'be' the character."_

This project is a bridge between high-level architectural design and the raw power of Large Language Models, ensuring that as your lore grows, your AI doesn't lose its way.
