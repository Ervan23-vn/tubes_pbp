use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Addr, Uint128};
use crate::state::{Auction, Peserta};

#[cw_serde]
pub struct InstantiateMsg {
    pub item_id: String,
    pub nama_barang: String,
    pub harga_dasar: Uint128,
    pub waktu_mulai: u64,
    pub waktu_berakhir: u64,
    pub verifying_key_hex: String,
    pub cw721_address: Option<String>,
}


#[cw_serde]
pub enum ExecuteMsg {
    DepositCollateral {},
    SubmitBidCommitment {
        bid_commitment: String,
        zkp_proof: String,
    },
    CloseAuction {},
    RevealBid {
        nominal_bid: Uint128,
        salt: String,
    },
    DetermineWinner {},
    RefundLosers {},
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(Auction)]
    GetAuction {},

    #[returns(Vec<Peserta>)]
    GetAllPeserta {},

    #[returns(Option<Addr>)]
    GetWinner {},
}
