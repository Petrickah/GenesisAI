-- 1. SETUP NAMESPACE & DATABASE
DEFINE NAMESPACE genesis_nexus;
DEFINE DATABASE lore;

-- ==========================================
-- GENESIS AI: KRAKOA NEXUS SCHEMA (V1.0)
-- ==========================================

-- 1. NODURILE DE INFORMAȚIE (📑, 🧠)
DEFINE TABLE lore_node SCHEMAFULL;
    DEFINE FIELD kind ON TABLE lore_node TYPE string ASSERT $value IN ['FRAGMENT', 'CONCEPT'];
    DEFINE FIELD title ON TABLE lore_node TYPE string;
    DEFINE FIELD body ON TABLE lore_node TYPE string;
    DEFINE FIELD metadata ON TABLE lore_node TYPE object;

-- 2. ENTITĂȚILE (👤)
DEFINE TABLE entity SCHEMAFULL;
    DEFINE FIELD name ON TABLE entity TYPE string;
    DEFINE FIELD kind ON TABLE entity TYPE string ASSERT $value IN ['AGENT', 'TEMPLATE', 'COLLECTION'];
    DEFINE FIELD stance ON TABLE entity TYPE string DEFAULT 'NEUTRAL'; -- 🧩
    DEFINE FIELD created_at ON TABLE entity TYPE datetime DEFAULT time::now(); -- ⌛

-- 3. PROPRIETĂȚILE ȘI LOGICA (🧬, 🔓, 📌, ⚓)
DEFINE TABLE trait SCHEMAFULL;
    DEFINE FIELD owner ON TABLE trait TYPE record<entity>;
    DEFINE FIELD kind ON TABLE trait TYPE string ASSERT $value IN ['LOGIC', 'ASSET', 'STATE', 'RULE'];
    DEFINE FIELD label ON TABLE trait TYPE string; -- Numele abilității sau stării
    DEFINE FIELD val ON TABLE trait TYPE any;       -- Valoarea (string, număr sau JSON)

-- 4. GRAFUL DE RELAȚII (🔗, 🔱, 🤝, ⚔️)
DEFINE TABLE interaction SCHEMAFULL TYPE RELATION FROM entity TO any;
    DEFINE FIELD type ON TABLE interaction TYPE string 
        ASSERT $value IN ['LINK', 'AUTHORITY', 'ALLIANCE', 'CONFLICT'];
    DEFINE FIELD reason ON TABLE interaction TYPE string; -- Aici trecem "Opinie despre Pizza"