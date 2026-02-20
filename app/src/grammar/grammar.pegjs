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

  const ALIASES = Object.keys(SNIPPETS).map((inputKey) => normalize(inputKey));

  function normalize(inputKey) {
    const normalizedInput = inputKey.replace(/\uFE0F/g, "");
    return SNIPPETS[normalizedInput] || inputKey
  }

  function buildNode(type, body, params) {
    return {
      type,
      body, 
      params: {
        timestamp: Date.now(),
        ...params,
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
      return buildNode(":trigger", [target], {});
    }

ValidTarget
  = Instruction
  / ReferencePath
  / Reference

Instruction
  = _ symbol:Symbol params:ParameterList? tags:TagList? body:Body? _ ";"? _ { 
    return buildNode(symbol.type, body || [], { ...params, tags: tags || [] });
  }

TagList
  = _ "🔑" _ selection:MemberSelection _ {
    return selection;
  }

MemberSelection
  = "[" _ head:PathElement tail:(_ "," _ PathElement)* _ "]" {
    return [head, ...tail.map(t => t[3])];
  }


PathElement
  = ReferencePath
  / Reference
  / Tag
  / Identifier

ReferencePath
  = root:Reference "::" members:PathSequence {
      return `${root}::${members}`;
    }

PathSequence
  = head:Identifier tail:("::" Identifier)* {
    return [head, ...tail.map(t => t[1])].join("::");
  }

Reference = "@" id:Identifier { return `@${id}`; }
Tag       = "#" id:Identifier { return `#${id}`; }

LambdaExpression
  = _ "λ" _ "(" content:LambdaBody ")" _ {
    const raw = content.trim();
    const isComplex = raw.startsWith(String.fromCharCode(123));
    const finalCode = isComplex ? raw : `return ${raw};`;
    return {
      type: ":lambda",
      params: {
        code: finalCode,
        isComplex: isComplex,
      },
      body: []
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
    const normalizedIcon = normalize(icon);
    const isKnown = ALIASES.some(k => k === normalizedIcon);
    return buildNode(normalizedIcon, [], {});
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