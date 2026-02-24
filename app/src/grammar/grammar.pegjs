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
    "🔃": ":jump",
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

  function solveOriginalReference(members) {
    let solvedSegments = [];

    for (const member of members) { // Folosim for...of pentru a lua valorile direct
      if (typeof member === 'string') {
        solvedSegments.push(`"${member}"`);
      } 
      else if (typeof member === 'object' && member !== null) {
        if (member.root) {
          solvedSegments.push(`"${member.root}"`);
        } 
        else if (member.segments) {
          solvedSegments.push(solveOriginalReference(member.segments));
        }
      }
    }

    return solvedSegments.join('::');
  }

  function buildReference(symbol, kind, root, members) {
    const path = solveOriginalReference(members);
    const finalPath = path ? `::"${path}"` : '';
    return {
      root: root,
      kind: kind,
      original: `${symbol}${root}${finalPath}`,
      segments: [root, ...members.map(m => (typeof m === 'object' ? m.root : m))],
      target: members.length > 0 
                ? (typeof members[members.length - 1] === 'object' ? members[members.length - 1].root : members[members.length - 1]) 
                : root
    };
  }

  function buildNode(type, body, tags, params) {
    return {
      type,
      body,
      tags,
      params,
    };
  }
}}

Start = _ program:ExpressionList _ { return program; }

ExpressionList 
  = head:(ActionPath / Expression) ";" tail:(_ (ActionPath / Expression) _ ";")* {
    const rest = tail.map(element => element[1]);
    return [head, ...rest];
  }

Expression
  = ex:(Instruction / PathElement) {
    return ex
  }

ActionPath
  = "➔" _ target:Expression _ {
    return buildNode(":trigger", [target], [], {});
  }

Instruction
  = _ symbol:Symbol params:ParameterList? tags:TagList? body:Body? _ { 
    return buildNode(symbol.type, body || [], tags || [], params);
  }

Symbol
  = icon:EmojiSequence {
    const normalizedIcon = normalize(icon);
    const isKnown = ALIASES.some(k => k === normalizedIcon);
    return buildNode(normalizedIcon, [], [], {});
  }

EmojiSequence 
  = $(([\uD800-\uDBFF][\uDC00-\uDFFF] / [^\s\w\(\)\[\]\{\};,:])[\uFE00-\uFE0F\u200D]*)

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
  = _ label:Identifier ":" value:(Identifier / LambdaExpression) {
    return { [label]: value }
  }

TagList
  = _ "🔑" _ selection:MemberSelection _ {
    return selection;
  }

MemberSelection
  = "[" _ head:(ReferencePath / PathElement) tail:(_ "," _ (ReferencePath / PathElement))* _ "]" {
    return [head, ...tail.map(t => t[3])];
  }

PathElement
  = Reference
  / Tag
  / Identifier
  / LambdaExpression

ReferencePath
  = root:Reference "::" members:PathSequence {
    return buildReference("@", root.kind, root.root, members);
  }

PathSequence
  = head:PathElement tail:("::" PathElement)* {
    return [head, ...tail.map(t => t[1])];
  }

Reference 
  = "@" id:Identifier { 
    return buildReference('@', 'reference', id, []); 
  }

Tag 
  = "#" id:Identifier { 
    return buildReference('#', 'hashtag', id, []);
  }

Identifier
  = String
  / $([a-zA-Z0-9_]+)

LambdaExpression
  = _ "λ" _ "(" content:LambdaBody ")" _ {
    const raw = content.trim();
    const isComplex = raw.startsWith(String.fromCharCode(123));
    const finalCode = isComplex ? raw : `return ${raw};`;
    return {
      type: ":lambda",
      code: finalCode,
    };
  }

LambdaBody
  = $([^()]* ("(" LambdaBody ")")* [^()]*)

Body
  = _ "{" _ results:ExpressionList _ "}" _ {
    return results;
  }

String
  = _ "\"" text:TextContent "\"" _ { return text; }

TextContent
  = $((!"\"" .)*)

_ "Whitespace"
  = ([ \t\n\r] / Comment)*

Comment
  = "//" [^\n]*