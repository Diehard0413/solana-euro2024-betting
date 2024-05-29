use {
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::{AssociatedToken},
        token::{self, Mint, Token, TokenAccount, Transfer}
    },
};
use std::mem::size_of;
use crate::{constants::*, errors::*, events::*, state::*};

#[derive(Accounts)]
pub struct BetToken<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: this should be checked by owner
    pub authority: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED, authority.key().as_ref()],
        bump,
        has_one = authority,
        constraint = global_state.is_initialized == true,
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + size_of::<UserState>(),
        seeds = [USER_STATE_SEED, user.key().as_ref()],
        bump,
    )]
    pub user_state: Box<Account<'info, UserState>>,

    #[account(
        address = global_state.token_mint,
    )]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = token_mint,
        associated_token::authority = global_state,
    )]
    pub token_account: Box<Account<'info, TokenAccount>>,
    
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handle(
    ctx: Context<BetToken>,
    amount: u64,
) -> Result<()> {
    let accts = ctx.accounts;

    let cpi_accounts = Transfer {
        from: accts.user_token_account.to_account_info(),
        to: accts.token_account.to_account_info(),
        authority: accts.user.to_account_info(),
    };
    let cpi_program = accts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, amount)?;

    accts.user_state.user = accts.user.key();
    accts.user_state.bet_amount += amount;
    accts.global_state.amount += amount;

    emit!(TokenBetted {
        authority: accts.user.key(),
        amount: amount
    });
    Ok(())
}