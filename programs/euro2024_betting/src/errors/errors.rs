use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("Insufficent token amount")]
    InsufficentTokenAmount,
}