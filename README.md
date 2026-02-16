# 🧬 GenesisAI: Krakoa Nexus DSL

**Status:** Phase 1 - Ingestion & Architecture
**Core:** SurrealDB + TypeScript + LLM Distillation

## 🌌 What does this project serves for?

GenesisAI is a technological framework created to solve the "Narrative Contextual Drift" of LLM (Large Language Models). In environments where the lore becomes too dense to be manually managed, GenesisAI uses a Domain Specific Language (DSL) based on sigils / tokens to transform the complex lore descriptions into immutable graph-based data structures.

Inspired by Krakoan Language (Marvel X-Men Series written by Jonathan Hickman) and Wuxing Mythology, this projects allows an LLM to "think" in entity terms (Multi-Agent Personas like Phoenix Force/Zhuque, Xuanwu, or in-lore characters) and store them in a SurrealDB based Knowledge Database as interconnected nodes (a Knowledge Graph).

## 🧱 Why do we need this framework?

### The Idea I propose

The common issue the current Large Language Models (LLMs) faces is "losing the long term context" (technically known as Contextual Drift) and the "narrative hallucination" (the LLM starts to invent new lore where there isn't one). When you work with vast lore (like the one from Marvel or a Universe you are building), the AI starts to make wrong associations between the characters, or it starts to ignore the world's rules.

The GenesisAI project introduces something called as "Semantical Determinism". Instead of letting the AI to write free text (which is hard to validate), we force it to use a set of tokens. These tokens act like "reality anchors". If the AI wants to define an ability, it needs to use `🧬`. If it wants to make a relation between two entities or concepts, it needs to use `🔗`.

### The control mechanism

The system is not just a way to write prompts (pure Prompt Engineering), but a way for data governance. Using SurrealDB we transform the complex lore from a simple list of facts to a living network of knowledge, where every entity ha a unique signature and an immutable logic.
