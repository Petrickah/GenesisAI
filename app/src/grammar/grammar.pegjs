{{
  function buildNode(type, header, tags, body) {
    return {
      type: type,
      id: header.id,
      params: header.params || {},
      tags: tags || [],
      children: body || [],
      timestamp: Date.now()
    };
  }
}}

// --- REGULI DE START ---

Start
  = _ instructions:Instruction* { return instructions; }

Instruction
  = type:Emoji _ header:Header _ tags:ValueList? _ body:Body? _ ";"? _ {
      return buildNode(type, header, tags, body);
    }

// --- STRUCTURĂ ---

Header
  = "(" _ main:HeaderMain _ params:ParamListItem* _ ")" {
      return { id: main, params: Object.fromEntries(params) };
    }

HeaderMain
  = QuotedString
  / Identifier

ParamListItem
  = "," _ key:Identifier _ ":" _ val:Value { return [key, val]; }

ValueList
  = "[" _ items:ValueSequence? _ "]" { return items || []; }

ValueSequence
  = first:Value _ rest:("," _ Value)* {
      return [first, ...rest.map(r => r[2])];
    }

Body
  = "{" _ children:Instruction* _ "}" { return children; }

// --- ATOMI (TERMINALS) ---

Emoji "Emoji"
  = _ symbol:UnicodeCluster _ { return symbol; }

// Această regulă prinde Emoji-uri de 2, 3 sau mai multe unități (ex: 🛡️, 👨‍👩‍👧‍👦)
UnicodeCluster
  = chars:UnicodeComponent+ { return chars.join(""); }

UnicodeComponent
  = $([\uD800-\uDBFF][\uDC00-\uDFFF]) // Perechi surogate (👤)
  / [\u2000-\u3300]                  // Simboluri diverse și pictograme
  / [\uFE00-\uFE0F]                  // Variation Selectors (Ceea ce lipsea la 🛡️!)
  / [^\s\w\(\)\[\]\{\};,:]            // Orice alt simbol special

Identifier "Identifier"
  = chars:[a-zA-Z0-9_]+ { return chars.join(""); }

QuotedString "String"
  = "\"" text:[^\"]* "\"" { return text.join(""); }

Number "Number"
  = digits:[0-9]+ { return parseInt(digits.join(""), 10); }

Value "Value"
  = QuotedString
  / Number
  / Identifier

// Whitespace & Comentarii - Esențiale pentru a nu bloca Emoji-ul
_ "Whitespace"
  = ([ \t\n\r] / Comment)*

Comment
  = "//" [^\n]*