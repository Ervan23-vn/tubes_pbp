#!/usr/bin/env bash
set -euo pipefail

cd "/home/dendifathur/LELANG TERDEMINT BFT/tubes_pbp"
chmod +x ./lelangd

pkill -f './lelangd start --home ./localnet/node' || true
sleep 2
rm -rf ./localnet
mkdir -p ./localnet

monikers=("PenyelenggaraLelang" "AuditorIndependen" "BankEscrow" "RegulatorPengawas")
chain_id="lelangchain"

for i in 0 1 2 3; do
  ./lelangd init "${monikers[$i]}" --chain-id "$chain_id" --home "./localnet/node$i"
done

for i in 0 1 2 3; do
  ./lelangd keys add "node$i" --keyring-backend test --home "./localnet/node$i"
done

for i in 0 1 2 3; do
  addr=$(./lelangd keys show "node$i" -a --keyring-backend test --home "./localnet/node$i")
  ./lelangd genesis add-genesis-account "$addr" 100000000000ulct --home ./localnet/node0
  if [ "$i" -ne 0 ]; then
    ./lelangd genesis add-genesis-account "$addr" 100000000000ulct --home "./localnet/node$i"
  fi
 done

mkdir -p ./localnet/node0/config/gentx ./localnet/node1/config/gentx ./localnet/node2/config/gentx ./localnet/node3/config/gentx

./lelangd genesis gentx node0 40000000000ulct --moniker PenyelenggaraLelang --ip 127.0.0.1 --p2p-port 26606 --keyring-backend test --chain-id "$chain_id" --home ./localnet/node0 --output-document ./localnet/node0/config/gentx/gentx-node0.json
./lelangd genesis gentx node1 10000000000ulct --moniker AuditorIndependen --ip 127.0.0.1 --p2p-port 26616 --keyring-backend test --chain-id "$chain_id" --home ./localnet/node1 --output-document ./localnet/node1/config/gentx/gentx-node1.json
./lelangd genesis gentx node2 30000000000ulct --moniker BankEscrow --ip 127.0.0.1 --p2p-port 26626 --keyring-backend test --chain-id "$chain_id" --home ./localnet/node2 --output-document ./localnet/node2/config/gentx/gentx-node2.json
./lelangd genesis gentx node3 20000000000ulct --moniker RegulatorPengawas --ip 127.0.0.1 --p2p-port 26636 --keyring-backend test --chain-id "$chain_id" --home ./localnet/node3 --output-document ./localnet/node3/config/gentx/gentx-node3.json

cp ./localnet/node1/config/gentx/*.json ./localnet/node0/config/gentx/ || true
cp ./localnet/node2/config/gentx/*.json ./localnet/node0/config/gentx/ || true
cp ./localnet/node3/config/gentx/*.json ./localnet/node0/config/gentx/ || true

./lelangd genesis collect-gentxs --home ./localnet/node0
cp ./localnet/node0/config/genesis.json ./localnet/node1/config/genesis.json
cp ./localnet/node0/config/genesis.json ./localnet/node2/config/genesis.json
cp ./localnet/node0/config/genesis.json ./localnet/node3/config/genesis.json

id0=$(./lelangd tendermint show-node-id --home ./localnet/node0)
id1=$(./lelangd tendermint show-node-id --home ./localnet/node1)
id2=$(./lelangd tendermint show-node-id --home ./localnet/node2)
id3=$(./lelangd tendermint show-node-id --home ./localnet/node3)
peers="$id0@127.0.0.1:26606,$id1@127.0.0.1:26616,$id2@127.0.0.1:26626,$id3@127.0.0.1:26636"

echo "Node IDs: $id0 $id1 $id2 $id3"
echo "Persistent peers: $peers"

for i in 0 1 2 3; do
  CONFIG_PATH="./localnet/node$i/config/config.toml"
  APP_PATH="./localnet/node$i/config/app.toml"

  sed -i "s|proxy_app = \"tcp://127.0.0.1:26658\"|proxy_app = \"tcp://127.0.0.1:266${i}8\"|g" "$CONFIG_PATH"
  sed -i "s|laddr = \"tcp://127.0.0.1:26657\"|laddr = \"tcp://127.0.0.1:266${i}7\"|g" "$CONFIG_PATH"
  sed -i "s|pprof_laddr = \"localhost:6060\"|pprof_laddr = \"localhost:606${i}\"|g" "$CONFIG_PATH"
  sed -i "s|laddr = \"tcp://0.0.0.0:26656\"|laddr = \"tcp://0.0.0.0:266${i}6\"|g" "$CONFIG_PATH"
  sed -i "s|prometheus_listen_addr = \":26660\"|prometheus_listen_addr = \":266${i}0\"|g" "$CONFIG_PATH"
  sed -i "s|persistent_peers = \".*\"|persistent_peers = \"$peers\"|g" "$CONFIG_PATH"
  sed -i "s|addr_book_strict = true|addr_book_strict = false|g" "$CONFIG_PATH"
  sed -i "s|allow_duplicate_ip = false|allow_duplicate_ip = true|g" "$CONFIG_PATH"
  sed -i "s|timeout_commit = \"5s\"|timeout_commit = \"1s\"|g" "$CONFIG_PATH"

  if [ -f "$APP_PATH" ]; then
    sed -i "s|address = \"tcp://localhost:1317\"|address = \"tcp://localhost:13${i}7\"|g" "$APP_PATH" || true
    sed -i "s|address = \"localhost:9090\"|address = \"localhost:91${i}0\"|g" "$APP_PATH" || true
    sed -i "s|address = \"localhost:9091\"|address = \"localhost:91${i}1\"|g" "$APP_PATH" || true
    sed -i "/\[api\]/,/enable/ s/enable = false/enable = true/" "$APP_PATH" || true
    sed -i 's|minimum-gas-prices = .*|minimum-gas-prices = "0ulct"|g' "$APP_PATH" || true
  fi
done

for i in 0 1 2 3; do
  nohup ./lelangd start --home "./localnet/node$i" > "./localnet/node$i.log" 2>&1 &
  echo "started node$i"
done

sleep 10

echo "Startup complete. Logs are in ./localnet/node0.log ... node3.log"
for i in 0 1 2 3; do
  echo "--- node$i log ---"
  tail -n 20 "./localnet/node$i.log"
done
