-- ------------------------------
-- OPTION
-- ------------------------------

OPTION IMPORT;

-- ------------------------------
-- TABLE: belongs_to
-- ------------------------------

DEFINE TABLE belongs_to TYPE RELATION IN entity | concept | fragment OUT collection SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD in ON belongs_to TYPE record<entity | concept | fragment> PERMISSIONS FULL;
DEFINE FIELD out ON belongs_to TYPE record<collection> PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: belongs_to
-- ------------------------------


-- ------------------------------
-- TABLE: collection
-- ------------------------------

DEFINE TABLE collection TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD description ON collection TYPE string PERMISSIONS FULL;
DEFINE FIELD name ON collection TYPE string PERMISSIONS FULL;
DEFINE FIELD tags ON collection TYPE array<string> PERMISSIONS FULL;
DEFINE FIELD tags[*] ON collection TYPE string PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: collection
-- ------------------------------


-- ------------------------------
-- TABLE: concept
-- ------------------------------

DEFINE TABLE concept TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD definition ON concept TYPE string PERMISSIONS FULL;
DEFINE FIELD logic_rules ON concept TYPE array<string> PERMISSIONS FULL;
DEFINE FIELD logic_rules[*] ON concept TYPE string PERMISSIONS FULL;
DEFINE FIELD name ON concept TYPE string PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: concept
-- ------------------------------


-- ------------------------------
-- TABLE: entity
-- ------------------------------

DEFINE TABLE entity TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD mood ON entity TYPE string PERMISSIONS FULL;
DEFINE FIELD name ON entity TYPE string PERMISSIONS FULL;
DEFINE FIELD status ON entity TYPE string PERMISSIONS FULL;
DEFINE FIELD tags ON entity TYPE array<string> PERMISSIONS FULL;
DEFINE FIELD tags[*] ON entity TYPE string PERMISSIONS FULL;
DEFINE FIELD timestamp ON entity TYPE datetime PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: entity
-- ------------------------------


-- ------------------------------
-- TABLE: flow_state
-- ------------------------------

DEFINE TABLE flow_state TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD current_state ON flow_state TYPE string PERMISSIONS FULL;
DEFINE FIELD previous_state ON flow_state TYPE string PERMISSIONS FULL;
DEFINE FIELD timestamp ON flow_state TYPE datetime PERMISSIONS FULL;
DEFINE FIELD trigger ON flow_state TYPE string PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: flow_state
-- ------------------------------


-- ------------------------------
-- TABLE: fragment
-- ------------------------------

DEFINE TABLE fragment TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD content ON fragment TYPE string PERMISSIONS FULL;
DEFINE FIELD name ON fragment TYPE string PERMISSIONS FULL;
DEFINE FIELD source ON fragment TYPE string PERMISSIONS FULL;
DEFINE FIELD version ON fragment TYPE string PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: fragment
-- ------------------------------


-- ------------------------------
-- TABLE: instruction
-- ------------------------------

DEFINE TABLE instruction TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD is_template ON instruction TYPE bool PERMISSIONS FULL;
DEFINE FIELD params ON instruction TYPE object PERMISSIONS FULL;
DEFINE FIELD tags ON instruction TYPE array<string> PERMISSIONS FULL;
DEFINE FIELD tags[*] ON instruction TYPE string PERMISSIONS FULL;
DEFINE FIELD type ON instruction TYPE string PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: instruction
-- ------------------------------


-- ------------------------------
-- TABLE: owns
-- ------------------------------

DEFINE TABLE owns TYPE RELATION IN entity OUT instruction SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD in ON owns TYPE record<entity> PERMISSIONS FULL;
DEFINE FIELD out ON owns TYPE record<instruction> PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: owns
-- ------------------------------


-- ------------------------------
-- TABLE: references
-- ------------------------------

DEFINE TABLE references TYPE RELATION IN instruction OUT fragment SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD in ON references TYPE record<instruction> PERMISSIONS FULL;
DEFINE FIELD out ON references TYPE record<fragment> PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: references
-- ------------------------------


-- ------------------------------
-- TABLE: triggers
-- ------------------------------

DEFINE TABLE triggers TYPE RELATION IN entity OUT flow_state SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD in ON triggers TYPE record<entity> PERMISSIONS FULL;
DEFINE FIELD out ON triggers TYPE record<flow_state> PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: triggers
-- ------------------------------


