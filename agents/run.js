#!/usr/bin/env node

const path = require("path");

async function main() {
  const args = process.argv.slice(2);
  const personaArgIndex = args.findIndex((arg) => arg === "--persona");
  if (personaArgIndex === -1 || personaArgIndex === args.length - 1) {
    console.error("Usage: node run.js --persona <PersonaName>");
    process.exit(1);
  }

  const personaName = args[personaArgIndex + 1];
  const personaPath = path.resolve(__dirname, "cid", personaName + ".js");

  try {
    const personaModule = require(personaPath);
    if (typeof personaModule.run !== "function") {
      console.error(
        `Persona module '${personaName}' does not export a 'run' function.`
      );
      process.exit(1);
    }
    await personaModule.run();
  } catch (err) {
    console.error(
      `Error loading or running persona '${personaName}':`,
      err.message
    );
    process.exit(1);
  }
}

main();
