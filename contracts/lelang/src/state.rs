use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

#[cw_serde]
pub enum AuctionStatus {
    Active,
    Closed,
    WinnerDetermined,
}

#[cw_serde]
pub struct Auction {
    pub item_id: String,
    pub nama_barang: String,
    pub penjual: Addr,
    pub harga_dasar: Uint128,
    pub waktu_mulai: u64,
    pub waktu_berakhir: u64,
    pub status: AuctionStatus,
    pub pemenang: Option<Addr>,
    pub commitment_hash_tertinggi: Option<String>,
    pub highest_bid: Option<Uint128>,
    pub cw721_address: Option<Addr>,
}


#[cw_serde]
pub struct Peserta {
    pub alamat_peserta: Addr,
    pub bid_commitment: String,
    pub zkp_proof: String,
    pub is_verified: bool,
    pub deposit_amount: Uint128,
    pub revealed_bid: Option<Uint128>,
    pub revealed_salt: Option<String>,
}

pub const AUCTION: Item<Auction> = Item::new("auction");
pub const PESERTA: Map<&Addr, Peserta> = Map::new("peserta");
// Map of participant address to their verification key or details if needed.
// We can also store the list of participants to iterate over.
pub const DAFTAR_PESERTA: Item<Vec<Addr>> = Item::new("daftar_peserta");
pub const VERIFYING_KEY: Item<Vec<u8>> = Item::new("verifying_key");
