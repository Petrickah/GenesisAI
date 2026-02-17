const parser = require("./grammar.cjs");

const krakoaCode = `
// Definirea mercenarului preferat
👤 ("Wade Wilson", status: "hungry", mood: "sassy") [mutant, high_regen] {
    
    // O instrucțiune imbricată (recursivitate)
    🛡️ (STANCE, level: "max") [defensive] {
        📌 (action) ["eat_pizza"];
    }

    ⚔️ (STRIKE) [lethal];
}
`;

try {
  console.log("🚀 Se lansează Protocolul 'Mână de Foc'...");
  
  const ast = parser.parse(krakoaCode);
  
  console.log("✅ Succes! AST-ul rezultat este:\n");
  console.log(JSON.stringify(ast, null, 2));

} catch (e) {
  console.error("❌ Eroare de parsare la linia " + e.location?.start.line + ", coloana " + e.location?.start.column + ":");
  console.error(e.message);
}