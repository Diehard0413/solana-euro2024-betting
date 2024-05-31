use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct UserState {
    // User Address
    pub user: Pubkey,
    // Bet amount
    pub bet_amount: u64,
}