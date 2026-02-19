{{
 const SNIPPETS = {
    "📑": ":fragment",
    "🧠": ":concept",
    "👤": ":entity",
    "📦": ":collection",
    "🧬": ":logic",
    "🔓": ":asset",
    "📌": ":state",
    "🔑": ":tag",
    "🧩": ":stance",
    "⌛": ":time",
    "🛡️": ":shield",
    "🛡": ":shield",
    "🔗": ":link",
    "🔱": ":authority",
    "🤝": ":alliance",
    "⚔️": ":conflict",
    "➔": ":trigger",
    "⚓": ":anchor",
    "📡": ":signal",
    "💬": ":speech"
  };

  function buildNode(type, tags, body, params, metadata) {
    const cleanType = typeof type === "string" ? type.replace(/\uFE0F/g, "") : type;
    const semanticType = SNIPPETS[cleanType] || type;

    return {
      type: semanticType,
      body: body,
      tags: tags,
      params: params,
      metadata: {
        ...metadata,
        timestamp: Date.now()
      }
    };
  }
}}

Start
  = _ instructions:(Expression)* _ { return instructions; }

Instruction
  = _ symbol:Symbol params:ParameterList? tags:TagList? body:Body? _ ";"? _ { 
    return buildNode(symbol.type, tags, body || [], { ...params }, { ...symbol.metadata });
  }

TagList
  = _ "🔑" _ "[" head:Tag tail:(_ "," _ Tag)* _ "]" _ {
    const tags = [head.value];
    tail.forEach(element => {
      const tag = element[3];
      tags.push(tag.value);
    })
    return tags;
  }

Tag
  = "#" id:Identifier {
    return { type: "#", value: id };
  }

ReferencePath
  = ref:Reference "::" members:(PathMember / MemberSelection) {
    return { type: "::", root: ref.id, members: members };
  }

MemberSelection
  = "[" _ head:PathMember tail:(_ "," _ PathMember)* _ "]" {
    return [head, ...tail.map(t => t[3])];
  }
  / member:PathMember { return [member]; }

PathMember
  = ReferencePath
  / Reference
  / Identifier

Reference
  = "@" id:Identifier {
    return { type: "@", id: id };
  }

ActionPath
  = source:(Instruction / ReferencePath / Reference) _ op:"➔" _ target:(Instruction / ReferencePath / Reference) _ {
    return buildNode(op, [], [], { from: source, to: target }, { known: true });
  }
  / "➔" _ target:(Instruction / ReferencePath / Reference) {
    return buildNode("➔", [], [], { from: undefined, to: target }, { known: true });
  }

Expression
  = _ e:(ActionPath / Instruction / ReferencePath / Reference) _ ";"? _ {
    return e;
  }

Body
  = _ "{" _ head:Expression? tail:(_ Expression)* _ "}" _ {
    const results = head ? [head] : [];
    return results.concat(tail.map(t => t[1]));
  }

ParameterList
  = _ "(" _ head:Identifier tail:(_ "," _ Parameter)* _ ")" _ {
    const params = { id: head };
    tail.forEach(element => {
      const p = element[3];
      Object.assign(params, p);
    });
    return params;
  }

Parameter
  = _ label:Identifier ":" value:String {
    return { [label]: value }
  }

Symbol
  = icon:EmojiSequence {
      // Aici facem "vama" manual în JS
      const knownIcons = ["📑", "🧠", "👤", "📦", "🧬", "🔓", "📌", "🧩", "⌛", "⚖️", "🔗", "🔱", "🤝", "⚔️", "🛡️"];
      
      // Curățăm icon-ul de orice variator invizibil pentru comparație
      const normalizedIcon = icon.replace(/\uFE0F/g, "");
      const isKnown = knownIcons.some(k => k.replace(/\uFE0F/g, "") === normalizedIcon);

      return buildNode(normalizedIcon, {}, [], {}, { known: isKnown });
    }

EmojiSequence 
  = $(([\uD800-\uDBFF][\uDC00-\uDFFF] / [^\s\w\(\)\[\]\{\};,:])[\uFE00-\uFE0F\u200D]*)
  
Identifier
  = String
  / $([a-zA-Z0-9_]+)

TextContent
  = $((!"\"" .)*)

String
  = _ "\"" text:TextContent "\"" _ { return text; }

_ "Whitespace"
  = ([ \t\n\r] / Comment)*

Comment
  = "//" [^\n]*