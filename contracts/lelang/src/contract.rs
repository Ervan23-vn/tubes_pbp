use cosmwasm_std::{
    entry_point, to_json_binary, Addr, BankMsg, Binary, Coin, CosmosMsg, Deps, DepsMut, Env,
    MessageInfo, Response, StdResult, Uint128,
};
use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::state::{Auction, AuctionStatus, Peserta, AUCTION, DAFTAR_PESERTA, PESERTA, VERIFYING_KEY};
use crate::zkp_verifier::verify_proof;


// A helper to compute poseidon hash in rust
fn compute_poseidon_hash(nominal_bid: u128, salt: &str) -> Result<String, ContractError> {
    use light_poseidon::{Poseidon, PoseidonHasher};
    use ark_bn254::Fr;
    use std::str::FromStr;

    let bid_fr = Fr::from(nominal_bid);
    let salt_fr = Fr::from_str(salt).map_err(|_| ContractError::InvalidBidReveal {})?;
    
    let mut poseidon = Poseidon::<Fr>::new_circom(2)
        .map_err(|_| ContractError::Std(cosmwasm_std::StdError::generic_err("Hasher init failed")))?;
    
    let hash = poseidon.hash(&[bid_fr, salt_fr])
        .map_err(|_| ContractError::Std(cosmwasm_std::StdError::generic_err("Hashing failed")))?;
    
    Ok(hash.to_string())
}

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    if msg.waktu_berakhir <= msg.waktu_mulai {
        return Err(ContractError::Std(cosmwasm_std::StdError::generic_err(
            "End time must be after start time",
        )));
    }

    let vk_bytes = hex::decode(&msg.verifying_key_hex)
        .map_err(|_| ContractError::InvalidHex {})?;

    let auction = Auction {
        item_id: msg.item_id,
        nama_barang: msg.nama_barang,
        penjual: info.sender,
        harga_dasar: msg.harga_dasar,
        waktu_mulai: msg.waktu_mulai,
        waktu_berakhir: msg.waktu_berakhir,
        status: AuctionStatus::Active,
        pemenang: None,
        commitment_hash_tertinggi: None,
        highest_bid: None,
        cw721_address: msg.cw721_address.map(|addr| deps.api.addr_validate(&addr)).transpose()?,
    };

    AUCTION.save(deps.storage, &auction)?;
    VERIFYING_KEY.save(deps.storage, &vk_bytes)?;
    DAFTAR_PESERTA.save(deps.storage, &vec![])?;

    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("item_id", auction.item_id)
        .add_attribute("harga_dasar", auction.harga_dasar.to_string()))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::DepositCollateral {} => execute_deposit_collateral(deps, env, info),
        ExecuteMsg::SubmitBidCommitment { bid_commitment, zkp_proof } => {
            execute_submit_bid_commitment(deps, env, info, bid_commitment, zkp_proof)
        }
        ExecuteMsg::CloseAuction {} => execute_close_auction(deps, env, info),
        ExecuteMsg::RevealBid { nominal_bid, salt } => {
            execute_reveal_bid(deps, env, info, nominal_bid, salt)
        }
        ExecuteMsg::DetermineWinner {} => execute_determine_winner(deps, env, info),
        ExecuteMsg::RefundLosers {} => execute_refund_losers(deps, env, info),
    }
}

pub fn execute_deposit_collateral(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    let auction = AUCTION.load(deps.storage)?;
    let block_time = env.block.time.seconds();

    if auction.status != AuctionStatus::Active || block_time < auction.waktu_mulai || block_time > auction.waktu_berakhir {
        return Err(ContractError::AuctionNotActive {});
    }

    // Expecting native token deposit, e.g. "ulct"
    let ulct_funds = info.funds.iter().find(|c| c.denom == "ulct");
    let amount = match ulct_funds {
        Some(c) => c.amount,
        None => return Err(ContractError::NoFundsSent {}),
    };

    if amount < auction.harga_dasar {
        return Err(ContractError::InsufficientDeposit {});
    }

    if PESERTA.has(deps.storage, &info.sender) {
        return Err(ContractError::ParticipantAlreadyBidded {});
    }

    let peserta = Peserta {
        alamat_peserta: info.sender.clone(),
        bid_commitment: String::new(),
        zkp_proof: String::new(),
        is_verified: false,
        deposit_amount: amount,
        revealed_bid: None,
        revealed_salt: None,
    };

    PESERTA.save(deps.storage, &info.sender, &peserta)?;

    let mut daftar = DAFTAR_PESERTA.load(deps.storage)?;
    daftar.push(info.sender.clone());
    DAFTAR_PESERTA.save(deps.storage, &daftar)?;

    Ok(Response::new()
        .add_attribute("action", "deposit_collateral")
        .add_attribute("peserta", info.sender.to_string())
        .add_attribute("deposit_amount", amount.to_string()))
}

pub fn execute_submit_bid_commitment(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    bid_commitment: String,
    zkp_proof: String,
) -> Result<Response, ContractError> {
    let auction = AUCTION.load(deps.storage)?;
    let block_time = env.block.time.seconds();

    if auction.status != AuctionStatus::Active || block_time < auction.waktu_mulai || block_time > auction.waktu_berakhir {
        return Err(ContractError::AuctionNotActive {});
    }

    let mut peserta = PESERTA.may_load(deps.storage, &info.sender)?
        .ok_or(ContractError::ParticipantNotDeposited {})?;

    if !peserta.bid_commitment.is_empty() {
        return Err(ContractError::ParticipantAlreadyBidded {});
    }

    // Verify proof
    // Public inputs are: [is_valid, commitment_hash, harga_dasar]
    // where:
    // is_valid = "1" (must be valid)
    // commitment_hash = bid_commitment
    // harga_dasar = auction.harga_dasar.to_string()
    let vk_bytes = VERIFYING_KEY.load(deps.storage)?;
    let public_inputs = vec![
        "1".to_string(),
        bid_commitment.clone(),
        auction.harga_dasar.to_string(),
    ];

    let verified = verify_proof(&vk_bytes, &public_inputs, &zkp_proof)
        .map_err(|_| ContractError::ZkpVerificationFailed {})?;

    if !verified {
        return Err(ContractError::ZkpVerificationFailed {});
    }

    peserta.bid_commitment = bid_commitment.clone();
    peserta.zkp_proof = zkp_proof;
    peserta.is_verified = true;

    PESERTA.save(deps.storage, &info.sender, &peserta)?;

    Ok(Response::new()
        .add_attribute("action", "submit_bid_commitment")
        .add_attribute("peserta", info.sender.to_string())
        .add_attribute("bid_commitment", bid_commitment))
}

pub fn execute_close_auction(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    let mut auction = AUCTION.load(deps.storage)?;
    let block_time = env.block.time.seconds();

    if auction.status != AuctionStatus::Active {
        return Err(ContractError::AuctionNotActive {});
    }

    // Only penjual can close early, or anyone can close once time expires
    if info.sender != auction.penjual && block_time <= auction.waktu_berakhir {
        return Err(ContractError::AuctionStillActive {});
    }

    auction.status = AuctionStatus::Closed;
    AUCTION.save(deps.storage, &auction)?;

    Ok(Response::new()
        .add_attribute("action", "close_auction")
        .add_attribute("status", "Closed"))
}

pub fn execute_reveal_bid(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    nominal_bid: Uint128,
    salt: String,
) -> Result<Response, ContractError> {
    let auction = AUCTION.load(deps.storage)?;
    if auction.status != AuctionStatus::Closed {
        return Err(ContractError::AuctionNotClosed {});
    }

    let mut peserta = PESERTA.may_load(deps.storage, &info.sender)?
        .ok_or(ContractError::ParticipantNotDeposited {})?;

    if peserta.revealed_bid.is_some() {
        return Err(ContractError::Std(cosmwasm_std::StdError::generic_err(
            "Bid already revealed",
        )));
    }

    // Calculate poseidon hash of nominal_bid and salt
    let hash = compute_poseidon_hash(nominal_bid.u128(), &salt)?;

    if hash != peserta.bid_commitment {
        return Err(ContractError::InvalidBidReveal {});
    }

    peserta.revealed_bid = Some(nominal_bid);
    peserta.revealed_salt = Some(salt);
    PESERTA.save(deps.storage, &info.sender, &peserta)?;

    Ok(Response::new()
        .add_attribute("action", "reveal_bid")
        .add_attribute("peserta", info.sender.to_string())
        .add_attribute("nominal_bid", nominal_bid.to_string()))
}

pub fn execute_determine_winner(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    let mut auction = AUCTION.load(deps.storage)?;
    if auction.status != AuctionStatus::Closed {
        return Err(ContractError::AuctionNotClosed {});
    }

    if info.sender != auction.penjual {
        return Err(ContractError::Unauthorized {});
    }

    let daftar = DAFTAR_PESERTA.load(deps.storage)?;
    let mut winner: Option<Addr> = None;
    let mut highest_bid = Uint128::zero();
    let mut winner_commitment = String::new();

    for addr in daftar.iter() {
        let p = PESERTA.load(deps.storage, addr)?;
        if p.is_verified {
            if let Some(bid) = p.revealed_bid {
                if bid > highest_bid {
                    highest_bid = bid;
                    winner = Some(addr.clone());
                    winner_commitment = p.bid_commitment.clone();
                }
            }
        }
    }

    let winner_addr = winner.ok_or(ContractError::NoValidBids {})?;

    auction.pemenang = Some(winner_addr.clone());
    auction.commitment_hash_tertinggi = Some(winner_commitment);
    auction.highest_bid = Some(highest_bid);
    auction.status = AuctionStatus::WinnerDetermined;
    AUCTION.save(deps.storage, &auction)?;

    let mut messages: Vec<CosmosMsg> = vec![];

    // Transfer CW721 Ownership if cw721_address is configured
    if let Some(ref cw721_addr) = auction.cw721_address {
        let cw721_msg = cosmwasm_std::WasmMsg::Execute {
            contract_addr: cw721_addr.to_string(),
            msg: to_json_binary(&cw721::Cw721ExecuteMsg::TransferNft {
                recipient: winner_addr.to_string(),
                token_id: auction.item_id.clone(),
            })?,
            funds: vec![],
        };
        messages.push(cw721_msg.into());
    }

    Ok(Response::new()
        .add_messages(messages)
        .add_attribute("action", "determine_winner")
        .add_attribute("winner", winner_addr.to_string())
        .add_attribute("highest_bid", highest_bid.to_string()))
}

pub fn execute_refund_losers(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
) -> Result<Response, ContractError> {
    let auction = AUCTION.load(deps.storage)?;
    if auction.status != AuctionStatus::WinnerDetermined {
        return Err(ContractError::WinnerNotDetermined {});
    }

    let winner_addr = auction.pemenang.as_ref().ok_or(ContractError::WinnerNotDetermined {})?;
    let highest_bid = auction.highest_bid.ok_or(ContractError::WinnerNotDetermined {})?;

    let daftar = DAFTAR_PESERTA.load(deps.storage)?;
    let mut messages: Vec<CosmosMsg> = vec![];

    for addr in daftar.iter() {
        let p = PESERTA.load(deps.storage, addr)?;
        if addr == winner_addr {
            // Refund the change: deposit_amount - highest_bid (if any)
            let change = p.deposit_amount.saturating_sub(highest_bid);
            if !change.is_zero() {
                messages.push(CosmosMsg::Bank(BankMsg::Send {
                    to_address: addr.to_string(),
                    amount: vec![Coin {
                        denom: "ulct".to_string(),
                        amount: change,
                    }],
                }));
            }
            // Send the actual bid amount to the seller
            messages.push(CosmosMsg::Bank(BankMsg::Send {
                to_address: auction.penjual.to_string(),
                amount: vec![Coin {
                    denom: "ulct".to_string(),
                    amount: highest_bid,
                }],
            }));
        } else {
            // Refund full deposit to losers
            if !p.deposit_amount.is_zero() {
                messages.push(CosmosMsg::Bank(BankMsg::Send {
                    to_address: addr.to_string(),
                    amount: vec![Coin {
                        denom: "ulct".to_string(),
                        amount: p.deposit_amount,
                    }],
                }));
            }
        }
    }

    Ok(Response::new()
        .add_messages(messages)
        .add_attribute("action", "refund_losers"))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetAuction {} => to_json_binary(&AUCTION.load(deps.storage)?),
        QueryMsg::GetAllPeserta {} => {
            let daftar = DAFTAR_PESERTA.load(deps.storage)?;
            let mut list = vec![];
            for addr in daftar.iter() {
                let p = PESERTA.load(deps.storage, addr)?;
                list.push(p);
            }
            to_json_binary(&list)
        }
        QueryMsg::GetWinner {} => {
            let auction = AUCTION.load(deps.storage)?;
            to_json_binary(&auction.pemenang)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
    use cosmwasm_std::{coins, from_json};

    #[test]
    fn test_all_flow() {
        let mut deps = mock_dependencies();
        
        // 1. Load verifying key JSON from file
        let vk_json = std::fs::read_to_string("../../zkp-circuits/verification_key.json").unwrap();
        // Convert it to VerifyingKey and serialize to hex for InstantiateMsg
        let vk = crate::zkp_verifier::parse_verifying_key(&vk_json).unwrap();
        let mut vk_bytes = Vec::new();
        use ark_serialize::CanonicalSerialize;
        vk.serialize_compressed(&mut vk_bytes).unwrap();
        let vk_hex = hex::encode(vk_bytes);

        // 2. Instantiate
        let msg = InstantiateMsg {
            item_id: "item_001".to_string(),
            nama_barang: "Lukisan Kuno".to_string(),
            harga_dasar: Uint128::new(100),
            waktu_mulai: 1000,
            waktu_berakhir: 2000,
            verifying_key_hex: vk_hex,
            cw721_address: None,
        };
        let info = mock_info("penjual", &[]);
        let res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(res.attributes[0].value, "instantiate");

        // 3. Deposit Collateral
        let mut env = mock_env();
        env.block.time = cosmwasm_std::Timestamp::from_seconds(1500);

        // Alice deposits
        let info = mock_info("alice", &coins(150, "ulct"));
        let res = execute(deps.as_mut(), env.clone(), info, ExecuteMsg::DepositCollateral {}).unwrap();
        assert_eq!(res.attributes[0].value, "deposit_collateral");

        // Bob deposits
        let info = mock_info("bob", &coins(120, "ulct"));
        let res = execute(deps.as_mut(), env.clone(), info, ExecuteMsg::DepositCollateral {}).unwrap();
        assert_eq!(res.attributes[0].value, "deposit_collateral");

        // 4. Submit Bid Commitment
        // Load proof from file
        let proof_json = std::fs::read_to_string("../../zkp-circuits/proof.json").unwrap();
        
        // Commitment hash for Alice: Poseidon(150, 123456)
        let alice_commitment = compute_poseidon_hash(150, "123456").unwrap();
        
        // Alice submits bid commitment with real ZKP proof!
        let info = mock_info("alice", &[]);
        let res = execute(
            deps.as_mut(),
            env.clone(),
            info,
            ExecuteMsg::SubmitBidCommitment {
                bid_commitment: alice_commitment.clone(),
                zkp_proof: proof_json.clone(),
            },
        ).unwrap();
        assert_eq!(res.attributes[0].value, "submit_bid_commitment");

        // Bob submits commitment (spoofing test: Alice's proof with Bob's commitment must fail!)
        let bob_commitment = compute_poseidon_hash(120, "789012").unwrap();
        let info = mock_info("bob", &[]);
        let err = execute(
            deps.as_mut(),
            env.clone(),
            info,
            ExecuteMsg::SubmitBidCommitment {
                bid_commitment: bob_commitment.clone(),
                zkp_proof: proof_json.clone(), // Alice's proof
            },
        ).unwrap_err();
        assert_eq!(err, ContractError::ZkpVerificationFailed {}); // Failed as expected!

        // Bob submits Bob's own ZKP proof? We only have one proof file for Alice.
        // We can manually mark Bob as verified to test a two-bidder flow, or just proceed with Alice.
        // Let's manually set Bob's status to simulate Bob submitting a valid ZKP proof
        let mut bob_peserta = PESERTA.load(deps.as_ref().storage, &Addr::unchecked("bob")).unwrap();
        bob_peserta.bid_commitment = bob_commitment.clone();
        bob_peserta.is_verified = true;
        PESERTA.save(deps.as_mut().storage, &Addr::unchecked("bob"), &bob_peserta).unwrap();

        // 5. Close Auction
        env.block.time = cosmwasm_std::Timestamp::from_seconds(2500); // Past end time
        let info = mock_info("anyone", &[]);
        let res = execute(deps.as_mut(), env.clone(), info, ExecuteMsg::CloseAuction {}).unwrap();
        assert_eq!(res.attributes[1].value, "Closed");

        // 6. Reveal Bid
        // Alice reveals
        let info = mock_info("alice", &[]);
        let res = execute(
            deps.as_mut(),
            env.clone(),
            info,
            ExecuteMsg::RevealBid {
                nominal_bid: Uint128::new(150),
                salt: "123456".to_string(),
            },
        ).unwrap();
        assert_eq!(res.attributes[0].value, "reveal_bid");

        // Edge case: Alice revealing with wrong salt must fail!
        let info = mock_info("bob", &[]);
        let err = execute(
            deps.as_mut(),
            env.clone(),
            info,
            ExecuteMsg::RevealBid {
                nominal_bid: Uint128::new(120),
                salt: "wrong_salt".to_string(),
            },
        ).unwrap_err();
        assert_eq!(err, ContractError::InvalidBidReveal {});

        // Bob reveals correctly
        let info = mock_info("bob", &[]);
        let res = execute(
            deps.as_mut(),
            env.clone(),
            info,
            ExecuteMsg::RevealBid {
                nominal_bid: Uint128::new(120),
                salt: "789012".to_string(),
            },
        ).unwrap();
        assert_eq!(res.attributes[0].value, "reveal_bid");

        // 7. Determine Winner
        let info = mock_info("penjual", &[]);
        let res = execute(deps.as_mut(), env.clone(), info, ExecuteMsg::DetermineWinner {}).unwrap();
        assert_eq!(res.attributes[0].value, "determine_winner");
        assert_eq!(res.attributes[1].value, "alice");
        assert_eq!(res.attributes[2].value, "150");

        // 8. Refund Losers
        let info = mock_info("anyone", &[]);
        let res = execute(deps.as_mut(), env.clone(), info, ExecuteMsg::RefundLosers {}).unwrap();
        assert_eq!(res.attributes[0].value, "refund_losers");
        
        // Let's check messages sent
        assert_eq!(res.messages.len(), 2); // Bob's refund of 120 and payment of 150 to seller!
    }
}

