use anchor_lang::prelude::*;

#[event]
pub struct Initialized {
    pub authority: Pubkey,
    pub token_mint: Pubkey
}

#[event]
pub struct AuthorityUpdated {
    pub authority: Pubkey,
    pub new_authority: Pubkey
}

#[event]
pub struct ConfigUpdated {
    pub authority: Pubkey,
    pub config: bool
}

#[event]
pub struct TokenBetted {
    pub authority: Pubkey,
    pub amount: u64
}

#[event]
pub struct TokenWithdrawn {
    pub authority: Pubkey,
    pub amount: u64
}