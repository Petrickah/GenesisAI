{{
  const SNIPPETS = {
    "📑": ":fragment",
    "🧠": ":concept",
    "👤": ":entity",
    "📦": ":collection",
    "📂": ":content",
    "🧬": ":logic",
    "🔓": ":asset",
    "📌": ":state",
    "🔑": ":tag",
    "🧩": ":stance",
    "⌛": ":time",
    "🛡️": ":shield",
    "🩺": ":utility",
    "💉": ":function",
    "🚀": ":action",
    "🎭": ":intent",
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

Start = _ program:NodeList _ { return program; }

NodeList = head:Node tail:(_ Node)* {
  return [head, ...tail.map(t => t[1])];
}

Node 
  = ActionPath 
  / Instruction 
  / ReferencePath

ActionPath
  = "➔" _ target:ValidTarget {
      return buildNode(":trigger", [], [], { from: undefined, to: target }, { known: true });
    }

ValidTarget
  = Instruction
  / ReferencePath
  / Reference

Instruction
  = _ symbol:Symbol params:ParameterList? tags:TagList? body:Body? _ ";"? _ { 
    return buildNode(symbol.type, tags, body || [], { ...params }, { ...symbol.metadata });
  }

TagList
  = _ "🔑" _ selection:MemberSelection _ {
      return { type: ":tag", members: selection };
    }

MemberSelection
  = "[" _ head:PathElement tail:(_ "," _ PathElement)* _ "]" {
      return [head, ...tail.map(t => t[3])];
    }
  / element:PathElement { return [element]; }


PathElement
  = ReferencePath
  / Reference
  / Tag
  / Identifier

ReferencePath
  = root:Reference "::" members:PathSequence {
      return { type: "::", root: root.id, members: members };
    }

PathSequence
  = head:Identifier tail:("::" Identifier)* {
    return [head, ...tail.map(t => t[1])];
  }

Reference = "@" id:Identifier { return { type: "@", id: id }; }
Tag       = "#" id:Identifier { return { type: "#", value: id }; }

LambdaExpression
  = _ "λ" _ "(" content:LambdaBody ")" _ {
    const raw = content.trim();
    const isComplex = raw.startsWith(String.fromCharCode(123));
    const finalCode = isComplex ? raw : `return ${raw};`;
    return {
      type: ":lambda",
      code: finalCode,
      isComplex: isComplex,
      timestamp: Date.now()
    };
  }

LambdaBody
  = $([^()]* ("(" LambdaBody ")")* [^()]*) 

Expression
  = _ e:(ActionPath / LambdaExpression / Instruction / ReferencePath / Reference) _ ";"? _ {
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
  = _ label:Identifier ":" value:(LambdaExpression / String / PathElement) {
    return { [label]: value }
  }

Symbol
  = icon:EmojiSequence {
    const knownIcons = ["📑", "🧠", "👤", "📦", "🧬", "🔓", "📌", "🧩", "⌛", "⚖️", "🔗", "🔱", "🤝", "⚔️", "🛡️"];
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