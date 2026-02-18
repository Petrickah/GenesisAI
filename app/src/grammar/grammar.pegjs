{{
  function buildNode(type, tags, body, params, metadata) {
    return {
      type: type,
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
  = _ symbol:Symbol params:ParameterList? tags:TagList? body:Body? _ ";" _ { 
    return buildNode("INSTRUCTION", tags, body || [], { ...params }, { ...symbol.metadata });
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
    return { type: "TAG", value: id };
  }

ReferencePath
  = ref:Reference "::" members:(PathMember / MemberSelection) {
    return { type: "PATH", root: ref.id, members: members };
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
    return { type: "REFERENCE", id: id };
  }

ActionPath
  = source:(ReferencePath / Reference / Instruction)? _ op:("➔" / "->") _ target:(ReferencePath / Reference / Instruction) _ ";" _ {
    return buildNode("ACTION_TRIGGER", [], [], { from: source || undefined, to: target }, { value: op, known: true });
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

Body
  = _ "{" instructions:(Expression)* "}" _ {
    return instructions;
  }

Symbol 
  = KnownTotem 
  / GenericEmoji

KnownTotem
  = icon:("📑" / "🧠" / "👤" / "📦" / "🧬" / "🔓" / "📌" / "🧩" / "⌛" / "⚖️" / "🔗" / "🔱" / "🤝" / "⚔️") { 
      return buildNode("TOTEM", {}, [], {}, { value: icon, known: true }); 
    }

GenericEmoji
  = char:$([^\s\w\(\)\[\]\{\};,:][\uFE00-\uFE0F]?) {
      return buildNode("TOTEM", {}, [], {}, { value: char, known: false });
    }

Identifier
  = String
  / $([a-zA-Z0-9_]+)

Expression
  = _ el:(ActionPath / Instruction / ReferencePath / Reference) _ ";"? _ {
    return el;
  }

TextContent
  = $((!"\"" .)*)

String
  = _ "\"" text:TextContent "\"" _ { return text; }

_ "Whitespace"
  = ([ \t\n\r] / Comment)*

Comment
  = "//" [^\n]*