#!/usr/bin/env bash
set -euo pipefail

cd "/mnt/d/TUGAS BESAR LELANG BLOCKHAIN/zkp-circuits"

echo "Compiling circuit..."
npx circom2 circuit.circom --r1cs --wasm --sym -o build -l node_modules/circomlib/circuits

echo "Setting up Powers of Tau..."
if [ ! -f pot12_final.ptau ]; then
  npx snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
  echo "random_entropy_for_tau" | npx snarkjs powersoftau contribute pot12_0000.ptau pot12_final.ptau --name="First contribution" -v -e="some random text"
fi

echo "Groth16 Setup..."
npx snarkjs groth16 setup build/circuit.r1cs pot12_final.ptau circuit_0000.zkey -v

echo "Contribute to zkey..."
echo "random_entropy_for_zkey" | npx snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="1st Contributor" -v -e="another random text"

echo "Export verification key..."
npx snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

echo "Trusted setup finished successfully!"
