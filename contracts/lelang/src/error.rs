use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Auction not active")]
    AuctionNotActive {},

    #[error("Auction still active")]
    AuctionStillActive {},

    #[error("Auction not closed yet")]
    AuctionNotClosed {},

    #[error("Winner already determined")]
    WinnerAlreadyDetermined {},

    #[error("Participant already submitted a bid")]
    ParticipantAlreadyBidded {},

    #[error("Participant did not deposit collateral")]
    ParticipantNotDeposited {},

    #[error("Deposit amount must be at least the base price")]
    InsufficientDeposit {},

    #[error("Zero funds sent")]
    NoFundsSent {},

    #[error("ZKP Proof verification failed")]
    ZkpVerificationFailed {},

    #[error("Invalid bid reveal or commitment mismatch")]
    InvalidBidReveal {},

    #[error("No valid bids to determine a winner")]
    NoValidBids {},

    #[error("Winner determination is not complete")]
    WinnerNotDetermined {},

    #[error("Invalid hex format")]
    InvalidHex {},

    #[error("Verification key not initialized")]
    VkNotInitialized {},
}
