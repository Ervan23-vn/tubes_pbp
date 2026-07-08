
#!/bin/bash
set -e

echo "=== Cleaning up old localnet data ==="
pkill -f './lelangd start --home ./localnet/node' || true
sleep 2
rm -rf ./localnet
mkdir -p ./localnet

monikers=("PenyelenggaraLelang" "AuditorIndependen" "BankEscrow" "RegulatorPengawas")
chain_id="lelangchain"

echo "=== Initializing monikers ==="
for i in {0..3}; do
    ./lelangd init "${monikers[$i]}" --chain-id "$chain_id" --home "./localnet/node$i"
done

echo "=== Generating Validator Keys ==="
for i in {0..3}; do
    ./lelangd keys add "node$i" --keyring-backend test --home "./localnet/node$i"
done

# Retrieve validator addresses
addr0=$(./lelangd keys show node0 -a --keyring-backend test --home ./localnet/node0)
addr1=$(./lelangd keys show node1 -a --keyring-backend test --home ./localnet/node1)
addr2=$(./lelangd keys show node2 -a --keyring-backend test --home ./localnet/node2)
addr3=$(./lelangd keys show node3 -a --keyring-backend test --home ./localnet/node3)

echo "Validator Addresses:"
echo "Node 0 (PenyelenggaraLelang): $addr0"
echo "Node 1 (AuditorIndependen): $addr1"
echo "Node 2 (BankEscrow): $addr2"
echo "Node 3 (RegulatorPengawas): $addr3"

# Allocate coins in genesis for all nodes on Node 0
echo "=== Adding Genesis Accounts ==="
./lelangd genesis add-genesis-account "$addr0" 100000000000ulct --home ./localnet/node0
./lelangd genesis add-genesis-account "$addr1" 100000000000ulct --home ./localnet/node0
./lelangd genesis add-genesis-account "$addr2" 100000000000ulct --home ./localnet/node0
./lelangd genesis add-genesis-account "$addr3" 100000000000ulct --home ./localnet/node0
./lelangd genesis add-genesis-account "$addr1" 100000000000ulct --home ./localnet/node1
./lelangd genesis add-genesis-account "$addr2" 100000000000ulct --home ./localnet/node2
./lelangd genesis add-genesis-account "$addr3" 100000000000ulct --home ./localnet/node3

# Proportional voting powers via gentx delegations:
# Node 0 (PenyelenggaraLelang): 40% (40,000,000,000 ulct)
# Node 1 (AuditorIndependen): 10% (10,000,000,000 ulct)
# Node 2 (BankEscrow): 30% (30,000,000,000 ulct)
# Node 3 (RegulatorPengawas): 20% (20,000,000,000 ulct)
echo "=== Generating Genesis Transactions (gentx) ==="
mkdir -p ./localnet/node0/config/gentx ./localnet/node1/config/gentx ./localnet/node2/config/gentx ./localnet/node3/config/gentx
./lelangd genesis gentx node0 40000000000ulct --moniker PenyelenggaraLelang --ip 127.0.0.1 --p2p-port 26606 --keyring-backend test --chain-id "$chain_id" --home ./localnet/node0 --output-document ./localnet/node0/config/gentx/gentx-node0.json
./lelangd genesis gentx node1 10000000000ulct --moniker AuditorIndependen --ip 127.0.0.1 --p2p-port 26616 --keyring-backend test --chain-id "$chain_id" --home ./localnet/node1 --output-document ./localnet/node1/config/gentx/gentx-node1.json
./lelangd genesis gentx node2 30000000000ulct --moniker BankEscrow --ip 127.0.0.1 --p2p-port 26626 --keyring-backend test --chain-id "$chain_id" --home ./localnet/node2 --output-document ./localnet/node2/config/gentx/gentx-node2.json
./lelangd genesis gentx node3 20000000000ulct --moniker RegulatorPengawas --ip 127.0.0.1 --p2p-port 26636 --keyring-backend test --chain-id "$chain_id" --home ./localnet/node3 --output-document ./localnet/node3/config/gentx/gentx-node3.json

echo "=== Collecting gentxs ==="
cp ./localnet/node1/config/gentx/*.json ./localnet/node0/config/gentx/ || true
cp ./localnet/node2/config/gentx/*.json ./localnet/node0/config/gentx/ || true
cp ./localnet/node3/config/gentx/*.json ./localnet/node0/config/gentx/ || true
./lelangd genesis collect-gentxs --home ./localnet/node0

echo "=== Distributing Genesis File ==="
cp ./localnet/node0/config/genesis.json ./localnet/node1/config/genesis.json
cp ./localnet/node0/config/genesis.json ./localnet/node2/config/genesis.json
cp ./localnet/node0/config/genesis.json ./localnet/node3/config/genesis.json

echo "=== Collecting Node IDs and building Peers list ==="
id0=$(./lelangd tendermint show-node-id --home ./localnet/node0)
id1=$(./lelangd tendermint show-node-id --home ./localnet/node1)
id2=$(./lelangd tendermint show-node-id --home ./localnet/node2)
id3=$(./lelangd tendermint show-node-id --home ./localnet/node3)

peers="$id0@127.0.0.1:26606,$id1@127.0.0.1:26616,$id2@127.0.0.1:26626,$id3@127.0.0.1:26636"
echo "Persistent Peers: $peers"

echo "=== Modifying config.toml and app.toml for each node ==="
for i in {0..3}; do
    CONFIG_PATH="./localnet/node$i/config/config.toml"
    APP_PATH="./localnet/node$i/config/app.toml"

    # Port mapping and peer configuration
    sed -i "s|proxy_app = \"tcp://127.0.0.1:26658\"|proxy_app = \"tcp://127.0.0.1:266${i}8\"|g" "$CONFIG_PATH"
    sed -i "s|laddr = \"tcp://127.0.0.1:26657\"|laddr = \"tcp://127.0.0.1:266${i}7\"|g" "$CONFIG_PATH"
    sed -i "s|pprof_laddr = \"localhost:6060\"|pprof_laddr = \"localhost:606${i}\"|g" "$CONFIG_PATH"
    sed -i "s|laddr = \"tcp://0.0.0.0:26656\"|laddr = \"tcp://0.0.0.0:266${i}6\"|g" "$CONFIG_PATH"
    sed -i "s|prometheus_listen_addr = \":26660\"|prometheus_listen_addr = \":266${i}0\"|g" "$CONFIG_PATH"
    sed -i "s|persistent_peers = \".*\"|persistent_peers = \"$peers\"|g" "$CONFIG_PATH"
    sed -i "s|addr_book_strict = true|addr_book_strict = false|g" "$CONFIG_PATH"
    sed -i "s|allow_duplicate_ip = false|allow_duplicate_ip = true|g" "$CONFIG_PATH"
    sed -i 's|cors_allowed_origins = \[\]|cors_allowed_origins = \["*"\]|g' "$CONFIG_PATH"

    # Consensus parameters (timeouts)
    sed -i 's|timeout_propose = ".*"|timeout_propose = "3s"|g' "$CONFIG_PATH"
    sed -i 's|timeout_prevote = ".*"|timeout_prevote = "1s"|g' "$CONFIG_PATH"
    sed -i 's|timeout_precommit = ".*"|timeout_precommit = "1s"|g' "$CONFIG_PATH"
    sed -i 's|timeout_commit = ".*"|timeout_commit = "1s"|g' "$CONFIG_PATH"

    # app.toml updates
    sed -i "s|address = \"tcp://localhost:1317\"|address = \"tcp://localhost:13${i}7\"|g" "$APP_PATH"
    sed -i "s|address = \"localhost:9090\"|address = \"localhost:91${i}0\"|g" "$APP_PATH"
    sed -i "s|address = \"localhost:9091\"|address = \"localhost:91${i}1\"|g" "$APP_PATH"
    sed -i 's|minimum-gas-prices = .*|minimum-gas-prices = "0ulct"|g' "$APP_PATH"
    
    # Enable API and CORS
    sed -i '/\[api\]/,/enable/ s/enable = false/enable = true/' "$APP_PATH"
    sed -i 's|enabled-unsafe-cors = false|enabled-unsafe-cors = true|g' "$APP_PATH"
done

echo "=== Starting 4 Nodes in background ==="
for i in {0..3}; do
    nohup ./lelangd start --home "./localnet/node$i" > "./localnet/node$i.log" 2>&1 &
    echo "Started Node $i (${monikers[$i]}) with PID $!"
done

echo "=== Localnet started! Streaming logs of Node 0 (PenyelenggaraLelang) ==="
tail -f ./localnet/node0.log
