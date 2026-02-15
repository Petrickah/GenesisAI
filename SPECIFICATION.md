# 📑 Krakoa Nexus DSL - Technical Specification v1.0

## 🧬 Philosophia

Bazat pe conceptele de suveranitate digitală (Hickman/Magneto) și traducere universală (Cypher), acest DSL transformă lore-ul narativ în date deterministe stocate în SurrealDB. În viziunea lui Hickman, limbajul Krakoan nu este doar comunicare, este **tehnologie biologică**. Acest DSL este adaptat la această filozofie unde emoji-urile nu sunt doar simboluri, sunt **Opcodes de Control Semantic**.

## 🔣 The Cypher Codex (Tokens)

| Emoji | Token (Yacc/Bison) | Semnificație Hickman/Cypher | Funcție Tehnică (SurrealDB) |
| --- | --- | --- | --- |
| **📑** | `T_FRAGMENT` | **Memorie vie.** O felie de realitate stocată. | `INSERT INTO fragment` / Document Root. |
| **🧠** | `T_CONCEPT` | **Noosphere.** Ideea pură, abstractă. | Un obiect de tip `schema` sau `definition`. |
| **👤** | `T_ENTITY` | **Gena / Template.** Matrița originală. | `DEFINE TABLE` sau `Inheritance Base`. |
| **➔** | `T_EXECUTE` | **Fluxul de Viață.** Tranziția de la stare la acțiune. | Trigger pentru funcție / `UPDATE`. |
| **🆔** | `T_ID` | **Numele Adevărat.** Semătura unică în rețea. | Primary Key (`id`). |
| **🔑** | `T_LEXICON` | **Cuvinte de Putere.** Cheile de acces la înțeles. | Array de Tag-uri / Relații `->is_tagged_with`. |
| **🧬** | `T_LOGIC` | **Codul Genetic.** Instrucțiunile de bază ale ființei. | Business Logic / `IF-THEN` / `SurrealQL Script`. |
| **🔗** | `T_LINK` | **Rețeaua Krakoa.** Podurile dintre minți/date. | Graph Edge (`->relates_to`, `->inherits`). |
| **⚓** | `T_ANCHOR` | **Rădăcina.** Condiția care ține sistemul în realitate. | `WHERE` clause / `ASSERT` / Validare. |
| **📌** | `T_SET` | **Amprenta.** Stabilirea unei stări imuabile. | `SET field = value`. |
| **🔓** | `T_ASSET` | **Resursa.** Obiectele palpabile din simulare. | Un record în tabelul `assets`. |
| **🩺** | `T_STATUS` | **Vitalitatea.** Sănătatea și disponibilitatea sistemului. | Enum: `READY`, `DAMAGED`, `OFFLINE`. |
| **💉** | `T_OP` | **Intervenția.** Modificarea directă a realității. | Mutation / Action Call. |
| **🚀** | `T_ACTION` | **Evoluția.** Saltul către un nou stadiu. | Executare asincronă / Event Trigger. |
| **💬** | `T_COMM` | **Telepatia.** Schimbul de date între agenți. | API Call / Output către LLM. |

## 💻 Reference Implementation (The Wade Instance)

```krakoa
➔ 🧠(CONCEPT: "Absurd Overdrive", id: "NEX-CON-RESL") [
    🔗(type: "Glossary_Link", value: @KN-FRG-GLOS);

    // --- INFRASTRUCTURA ȘI RESURSE ---
    🔑[#PsychologicalBuffer, #MetaHumor, #ChaosDefense];
    🧬(TYPE: "Logic") ["Neutralizarea daunelor prin detașare de realitate."];
    
    🔓(ASSET: "Wade_Gear", id: "NEX-AST-WADE-GEAR") [
        🔑[#Weaponry, #Teleportation];
        🩺(type: "Utility", status: "READY") ["Eliminarea birocrației prin repoziționare rapidă."];
        💉(op: "BYPASS_BUREAUCRACY") ["Repoziționare rapidă prin teleportare."];
    ];

    // --- TEMPLATE (Clasa de bază) ---
    👤(TEMPLATE: "Wade_Wilson_Base", id: "WADE_BASE") [
        🔑[#MercWithAMouth, #HealingFactor, #AnvilSlayer];
        🧩(stance: "Maximum Effort") ["Sarcastic", "Optimist", "Iresponsabil"];
        📑(FRAGMENT: "Meta_Commentary", id: "WADE-FRG-META") [
            📂(content: "Chimichanga_Optimized") [
                "Arhitectule, nu te uita la bug-uri! Sunt mici surprize de design."
            ];
        ];
    ];

    // --- INSTANCE (Execuția) ---
    // Pornim instanța lui Wade folosind referința la template
    ➔ 👤(AGENT: "Deadpool_Instance", id: "NEX-AGT-WADE") [
        // Legăm instanța de template-ul de bază
        🔗(type: "Inheritance") [ #NEX-AGT-WADE :: #WADE_BASE ];

        // Pasul 1: Inițializare stare locală
        📌(set: "Current_Logic", value: "Neutral Chaos");
        📌(set: "Active_Equipment", value: @NEX-AST-WADE-GEAR);

        // Pasul 2: Thread-ul de regenerare (Proces asincron pasiv)
        ➔ 🧬(mode: "PASSIVE", id: "HEALING_FACTOR") [
            ⚓(condition: "@SELF::status == DAMAGED") [
                🚀(action: "REGENERATE", power: "AUTO");
            ]
        ];

        // Pasul 3: Monitorizarea meta-realității
        ⚓(condition: "@NEX-CON-RESL::PsychologicalBuffer == ACTIVE") [
            🧬(mode: "STABILITY") [ "Acceptarea defectelor sistemului" ];

            // Pasul 4: Executăm Call-ul către Arhitect
            ➔ 💬(type: "FourthWallBreach", to: "ARCHITECT") [
                🎭(intent: "JEST", breakWall: true);
                
                // Extragem mesajul din fragmentul aflat în Template
                📂(content: "Message") [ @WADE_BASE::WADE-FRG-META::"Chimichanga_Optimized" ];
            ];

            // Pasul 5: Signal către sistem că Wade e conștient de simulare
            📡(event: "META_AWARENESS_TRIGGER", target: "SYSTEM");
        ];
    ];
];
```

---

## 🧠 Analiza Codului (The Wade Instance)

Dacă se aplică acest glosar pe un cod Krakoa Nexus, vom obține o **Mașină Virtuală de Context**, aceasta este folosită pentru a genera noi Agenți adaptați în mod determinist:

1. **Inheritance (`🔗`)**: `#NEX-AGT-WADE :: #WADE_BASE`. Aceasta este o operațiune de "Clonare Krakoană". Instanța preia memoria (lore-ul) din template.
2. **Asynchronous Monitoring (`➔ 🧬 mode: "PASSIVE"`)**: Healing Factor-ul lui Wade nu e o funcție apelată manual, e un **"Living Script"** care rulează în SurrealDB (un event trigger care verifică `condition: @SELF::status == DAMAGED`).
3. **Data Extraction (`@WADE_BASE::WADE-FRG-META::"Message"`)**: Aceasta este navigare de tip **Graph Path**. Te duci în Template -> Fragment -> Content.

---

### 📜 Directiva "The Hickman Principle"

> *"Nu construim o bază de date. Construim o Națiune de Date. Fiecare simbol trebuie să fie o poartă; dacă parserul tău găsește `🧬`, el nu vede text, el vede destinul programului."*
