const fs = require("fs");
const snarkjs = require("snarkjs");

async function main() {
  const input = JSON.parse(fs.readFileSync("input.json", "utf8"));

  console.log("Generating proof for input:", input);
  const start = process.hrtime.bigint();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    "build/circuit_js/circuit.wasm",
    "circuit_final.zkey"

  );
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;

  fs.writeFileSync("proof.json", JSON.stringify(proof, null, 2));
  fs.writeFileSync("public.json", JSON.stringify(publicSignals, null, 2));
  fs.writeFileSync("proof-metadata.json", JSON.stringify({
    proofGenerationTimeMs: elapsedMs,
    generatedAt: new Date().toISOString(),
    input
  }, null, 2));

  console.log(`Proof generated in ${elapsedMs.toFixed(2)} ms`);
  console.log("Saved proof.json, public.json, proof-metadata.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
