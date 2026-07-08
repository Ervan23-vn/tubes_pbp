#!/usr/bin/env bash
# Faucet script untuk mengirim LCT (ulct) ke alamat wallet di WSL localnet
# Penggunaan: ./faucet.sh [alamat_tujuan] [jumlah_lct]
# Contoh: ./faucet.sh cosmos1qy... 1000

set -euo pipefail

TARGET_ADDRESS=${1:-""}
AMOUNT_LCT=${2:-"100"} # Default 100 LCT

if [ -z "$TARGET_ADDRESS" ]; then
    echo "Error: Alamat tujuan tidak ditentukan!"
    echo "Penggunaan: $0 [alamat_tujuan] [jumlah_lct_opsional]"
    exit 1
fi

# 1 LCT = 1.000.000 ulct (Lelang Coin Testnet)
AMOUNT_ULCT=$((AMOUNT_LCT * 1000000))

echo "=== Mengirim $AMOUNT_LCT LCT ($AMOUNT_ULCT ulct) ke $TARGET_ADDRESS ==="

# Menggunakan node0 (PenyelenggaraLelang) sebagai sumber dana faucet localnet
./lelangd tx bank send \
  $(./lelangd keys show node0 -a --keyring-backend test --home ./localnet/node0) \
  "$TARGET_ADDRESS" \
  "${AMOUNT_ULCT}ulct" \
  --keyring-backend test \
  --chain-id lelangchain \
  --home ./localnet/node0 \
  --node http://127.0.0.1:26607 \
  --gas-prices 0ulct \
  --yes

echo "✓ Faucet berhasil dikirim!"
