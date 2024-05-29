use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("DULGDdPomhYSSHvdzGKpoGip3FuiSoTZ9oEU4bNpCvKr");
#[program]
pub mod euro_2024_betting {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>
    ) -> Result<()> {
        initialize::handle(ctx)
    }
    
    pub fn update_auth(
        ctx: Context<UpdateAuth>
    ) -> Result<()> {
        return update_auth::handle(ctx)
    }

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        is_initialized: bool
    ) -> Result<()> {
        update_config::handle(ctx, is_initialized)
    }

    pub fn bet_token(
        ctx: Context<BetToken>,
        amount: u64
    ) -> Result<()> {
        return bet_token::handle(
            ctx,
            amount
        );
    }

    pub fn withdraw_token(
        ctx: Context<WithdrawToken>,
        amount: u64
    ) -> Result<()> {
        return withdraw_token::handle(
            ctx,
            amount
        );
    }
}






