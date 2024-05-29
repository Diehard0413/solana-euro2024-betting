use anchor_lang::prelude::*;
use std::mem::size_of;
use crate::{constants::*, events::*, state::*};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + size_of::<GlobalState>(),
        seeds = [GLOBAL_STATE_SEED, authority.key().as_ref()],
        bump,
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + size_of::<VaultState>(),
        seeds = [VAULT_STATE_SEED],
        bump,
    )]
    pub vault_state: Account<'info, VaultState>,

    /// CHECK: this should be checked by owner
    pub token_mint: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle(
    ctx: Context<Initialize>
) -> Result<()> {
    let accts = ctx.accounts;

    accts.global_state.authority = accts.authority.key();
    accts.global_state.token_mint = accts.token_mint.key();
    accts.global_state.amount = 0;
    accts.global_state.is_initialized = true;
    accts.vault_state.is_initialized = true;
    
    emit!(Initialized {
        authority: accts.authority.key(),
        token_mint: accts.token_mint.key(),
    });
    Ok(())
}