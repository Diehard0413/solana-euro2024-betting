use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    // Admin authority
    pub authority: Pubkey,
    // Mint address of the token
    pub token_mint: Pubkey,
    // Total bet amount
    pub amount: u64,
    // Prevention of reinitialization attack
    pub is_initialized: bool,
}

#[account]
#[derive(Default)]
pub struct VaultState {
    // Prevention of reinitialization attack
    pub is_initialized: bool,
    // Token treasury
    pub token_vault: Pubkey,
}