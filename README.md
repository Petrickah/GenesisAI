# 🧬 GenesisAI: Krakoa Nexus DSL

* **Status:** Phase 1 - Ingestion & Architecture
* **Core:** SurrealDB + TypeScript + LLM Distillation

## 🌌 What does this project serves for?

GenesisAI is a technological framework created to solve the "Narrative Contextual Drift" of LLM (Large Language Models). In environments where the lore becomes too dense to be manually managed, GenesisAI uses a Domain Specific Language (DSL) based on sigils / tokens to transform the complex lore descriptions into immutable graph-based data structures.

Inspired by Krakoan Language (Marvel X-Men Series written by Jonathan Hickman) and Wuxing Mythology, this project allows an LLM to "think" in entity terms (Multi-Agent Personas like Phoenix Force/Zhuque, Xuanwu, or in-lore characters) and store them in a Knowledge Database based on SurrealDB as interconnected nodes (a Knowledge Graph).

## 🧱 Why do we need this framework?

### The Idea I propose

The common issue the current Large Language Models (LLMs) faces is "losing the long term context" (technically known as Contextual Drift) and the "narrative hallucination" (the LLM starts to invent new lore where there isn't one). When you work with vast lore (like the one from Marvel or a Universe you are building), the AI starts to make wrong associations between the characters, or it starts to ignore the world's rules.

The GenesisAI project introduces something called as "Semantical Determinism". Instead of letting the AI to write free text (which is hard to validate), we force it to use a set of tokens. These tokens act like "reality anchors". If the AI wants to define an ability, it needs to use `🧬`. If it wants to make a relation between two entities or concepts, it needs to use `🔗`.

### The control mechanism

This system is not just a way to write prompts (Prompt Engineering), but a way for data governance. Using SurrealDB we transform the complex lore from a simple list of facts to a living network of knowledge, where every entity has a unique signature and an immutable logic.

## 🔣 The Cypher Codex (The Technical Specification of Tokens)

The Domain Specific Language (DSL) used in GenesisAI, called Krakoa Nexus DSL, uses a series of semantic tokens that acts as instructions for a parser. The scope of it is to generate prompts that contains only the necessary information for the LLM to generate responses, thus, preventing LLM Confunsion (loss of direction). These are split into four categories: **Structural Tokens**, **Logic & Property Tokens**, **Relational Tokens** and **Execution & Validation Tokens**.

### 🔣 Functional Categories

#### **1. Structural Tokens (The Skeleton)**

| **Token** | **Type** | **Description** |
| ---- | ---- | ---- |
| **📑** | **(FRAGMENT)** | Base Knowledge Unity (a Document/RAG Entry). |
| **🧠** | **(CONCEPT)** | An Abstract Idea or an In-Universe Rule. |
| **👤** | **(ENTITY)** | The Primary Actor (a Character or Organization). |
| **📦** | **(COLLECTION)** | A Bundle of Entities, Fragments or Concepts. (ex: "The X-Men"). |

#### **2. Logic & Property Tokens (The DNA)**

| **Token** | **Type** | **Description** |
| ---- | ---- | ---- |
| **🧬** | **(LOGIC)** | Fixed Attributes, Abilities, Source Rules ("Business Rules"). Defines the behavior of an AI Agent |
| **🔓** | **(ASSET)** | Objects, Artifacts (ex: Zhuque Fans), Resources, etc. (In-Universe Things) |
| **📌** | **(STATE)** | States / Variable Values (Ex: Temperature, HP, Status, Locations) |
| **🔑** | **(TAG)** | Metadata used for fast indexation and data retrieval. |
| **🧩** | **(STANCE)** | The Overall and Variable Behavior of an Agent. It can change depending on the context. |
| **⌛** | **(TIME)** | The Timestamp at which the Action takes place in. |

#### **3. Relational Tokens (The Graph)**

| **Token** | **Type** | **Description** |
| ---- | ---- | ---- |
| **🔗** | **(LINK)** | A General Relationship (a Knowledge Graph Edge) |
| **🔱** | **(AUTHORITY)** | An Hierarchical Relationship (a Master/Slave, Parent/Child) |
| **🤝** | **(ALLIANCE)** | A Cooperation Relationship or a Group Affiliation (ex. Orchis, X-Men, Overwatch, Talon) |
| **⚔️** | **(CONFLICT)** | An Rivalry Relationship or a Restriction (Incompatible with...) |

#### **4. Execution & Validation (The Pulse)**

| **Token** | **Type** | **Description** |
| ---- | ---- | ---- |
| **➔** | **(TRIGGER)** | The Entrypoint of an Action or Logical Path. |
| **⚓** | **(ANCHOR)** | The Absolute Truth (Single Source of Truth). It can't be altered by the AI Agent |
| **📡** | **(SIGNAL)** | An Event Broadcast which changes the current global context. |
| **💬** | **(COMM)** | A Communication Interface between the user or the agents. |

### 💻 Reference Implementation (The Wade Example)

To be sure the data integrity is maintained we use a reference implementation. In the following example, an AI Agent called Wade Wilson (Deadpool) takes the behavior defined in a based template, while Wuyang (from the video game called Overwatch, by Blizzard Entertainment) Agent acts as a system monitor to alert the overreaction of Deadpool agent. ("logical overheating")

```krakoa
➔ 🧠(title: "Thermal Logic Validation", id: "NEX-SYS-THERM") [
    // 1. ASSET DEFINITION: The Zhuque Fans (Zhuque 朱雀)
    🔓(ASSET: "Zhuque_Fans", id: "ANR-AST-FAN") [
        🔑[#ThermalArtifact, #FireElement];
        🧬(logic: "MYSTIC_HEAT") ["Capable of generating intense semantic heat."];
    ];

    // 2. TEMPLATE DEFINITION
    👤(TEMPLATE: "Base_Mercenary", id: "WADE_BASE") [
        🧬(logic: "CHAOS_MODE") ["High unpredictability and meta-awareness."];
    ];

    // 3. AGENT INSTANCE: Wade Wilson
    ➔ 👤(AGENT: "Wade_Wilson", id: "NEX-AGT-WADE") [
        🔗(type: "Inheritance") [ #NEX-AGT-WADE :: #WADE_BASE ];
        📌(set: "Action", value: "Grilling_with_Zhuque_Fans");

        // The logic that triggers the system overheat
        ➔ 🧬(op: "OVERCLOCK_HEAT") [ @ANR-AST-FAN ];
        
        // Signal emitted for the system listeners
        📡(event: "THERMAL_SPIKE", value: "95°C");
    ];

    // 4. SYSTEM MONITOR: Wuyang (Xuanwu 玄武)
    ➔ 👤(AGENT: "Wuyang", id: "NEX-AGT-WUYA") [
        // The Anchor acts as an automated Reality Check
        ⚓(condition: "@NEX-AGT-WADE::Temperature > 90°C") [
            🧬(mode: "XUANWU_STABILIZATION") [ "Deploying mystical coolant to prevent system crash." ];
            
            ➔ 💬(type: "Alert", to: "ARCHITECT") [
                📂(content: "Status") [ "Wade is burning the kernel again. Stabilization active." ];
            ];
        ];
    ];
];
```

## 🗺️ One month Roadmap (The Genesis Phase)

### **1st Week: Defining the lexicon and grammar**

* [x] Configuring the development environment (Node.js + TypeScript + Docker + SurrealDB + Ollama)
* [x] Finalizing the DSL Specification (The Cypher Codex)
* [ ] Implementing the parser using a Pushdown Automaton (PDA) using TypeScript.

### **2nd Week: The Parsing Engine (The Compiler)**

* [ ] Transpiling the tokens into JSON structured objects for SurrealDB.
* [ ] The syntactic validation of the `.krakoa` scripts.
* [ ] Mapping the final schemas in SurrealDB

### **3rd Week: Integrating with SurrealDB (The Ledger)**

* [ ] Building the active connection between the Parser and the Database.
* [ ] Implementing the "Inheritance" logic and "Graph Linking" directly into SurrealQL.
* [ ] Testing the first complex entities (Anran & Wuyang) with persistent relationships.

### **4th Week: AI Interface (The Intelligence)**

* [ ] Writing the "System Prompts" and "Master Prompts" to instruct the LLM to adapt their answers based on the Krakoa Nexus DSL definitions.
* [ ] Writing the "System Prompts" and "Master Prompts" to instruct the LLM to write JSON Objects based on the Intermediate Representation (IR) of Krakoa Nexus DSL.
* [ ] Testing the first close loop: Prompt -> DSL IR -> SurrealDB -> Context RAG.
* [ ] Testing the first interaction with an AI Agent.

## 🏁 Conclusion

> _"GenesisAI isn't just an experiment, is a conceptual framework for creative anchoring of LLMs via mathematical structuring. In an technical era of Generative Artificial Intelligence, the true power doesn't resides into generating more text, but in holding the **control over the knowledge**."_

## ⚠️ A Note on the DSL Purpose (Human-to-Machine Bridge)

It is vital to distinguish the role of the **Krakoa Nexus DSL**.
Contrary to popular belief in prompt engineering, the LLM is **NOT** required to write in the DSL itself. Instead:

1. **Human Perspective:** The DSL is for **us, the Architects**. It allows us to define complex agents, lore, and logic using a compact, semantic syntax without the overhead of manual Prompt Engineering or verbose JSON writing.
2. **AI Perspective:** The LLM is instructed to output **JSON Objects** based on the DSL's _Intermediate Representation (IR)_.
3. **The Result:** The DSL acts as a high-level "Source Code" that humans write, which then gets compiled/transpiled into a format that the LLM understands and the Database (SurrealDB) can ingest.

> _"We don't ask the AI to be a poet; we ask it to be a Data Modeler. The DSL is the blueprint we provide to ensure it doesn't lose its way."_

### 🛑 Beyond the Hype: Why GenesisAI is Different

At first glance, GenesisAI looks very similar to frameworks like **CharacterAI** or **CrewAI**, but the philosophy and architecture are fundamentally divergent. GenesisAI is not just a "roleplay toy" nor a list of automated tasks.

1. **Identity vs. Prompting (vs. CharacterAI):**
Instead of using "magic prompts" inside a black box, GenesisAI uses **Krakoa Nexus DSL**. We are building a digital "nervous system" where identity is coded, persistent, and governed by strict grammar rules, not by the LLM's own fluctuations.

2. **Graph Persistence vs. Ephemerality (vs. CrewAI):**
CrewAI focuses on executing predefined tasks (fire and forget). GenesisAI is based on **SurrealDB**, where every agent is a node in a Knowledge Graph. Every relationship, memory, and state persists and emerges over time, building an immutable digital lore.

3. **The "Quiet Council" Protocol (The Jonathan Hickman Principle):**
This is the supreme differentiator. Inspired by the _"Quiet Council"_ from X-Men, GenesisAI doesn't encourage conflict or competition between agents for the "best" answer.
    * **Consensus, not Competition:** Our agents provide unique visions regarding a problem, and their perspectives are collectively synthesized.
    * **Synergy, not Battle Royale:** The final result is a harmony of perspectives where individual identities are not erased, but used to reach a Single Multi-Faceted Answer.

> **GenesisAI is not about forcing the AI to work for you; it is about building a digital society governed by consensus and logic.**
