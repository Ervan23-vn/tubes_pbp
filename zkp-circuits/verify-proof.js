const fs = require("fs");
const snarkjs = require("snarkjs");

async function main() {
  const vKey = JSON.parse(fs.readFileSync("verification_key.json", "utf8"));
  const proof = JSON.parse(fs.readFileSync("proof.json", "utf8"));
  const publicSignals = JSON.parse(fs.readFileSync("public.json", "utf8"));

  const valid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
  console.log(valid ? "Valid proof" : "Invalid proof");
  process.exit(valid ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
