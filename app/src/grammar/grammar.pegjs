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

Start
  = _ elements:(Symbol)* _ { return elements; }

Symbol 
  = KnownTotem 
  / GenericEmoji

KnownTotem
  = icon:("📑" / "🧠" / "👤" / "📦" / "🧬" / "🔓" / "📌" / "🧩" / "⌛" / "⚖️" / "🔗" / "🔱" / "🤝" / "⚔️") { 
      return { type: "TOTEM", value: icon, known: true }; 
    }

GenericEmoji
  = char:$([^\s\w\(\)\[\]\{\};,:][\uFE00-\uFE0F]?) {
      return { type: "UNKNOWN_SYMBOL", value: char, known: false };
    }

_ "Whitespace"
  = ([ \t\n\r] / Comment)*

Comment
  = "//" [^\n]*