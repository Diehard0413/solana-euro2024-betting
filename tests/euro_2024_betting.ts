import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import { Euro2024Betting } from "../target/types/euro_2024_betting";
import { PublicKey } from "@solana/web3.js";
import {
  getAccount,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  transfer,
  mintTo,
  createMint
} from "@solana/spl-token";
import { ASSOCIATED_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { token } from "@coral-xyz/anchor/dist/cjs/utils";

describe("sol_usdc_presale", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Euro2024Betting as Program<Euro2024Betting>;
  const PROGRAM_ID = program.programId;

  const GLOBAL_STATE_SEED = "GLOBAL-STATE-SEED";
  const USER_STATE_SEED = "USER-STATE-SEED";
  const VAULT_SEED = "VAULT-SEED";
  const VAULT_STATE_SEED = "VAULT-STATE-SEED";

  const myWallet = provider.wallet;
  const payer = provider.wallet as anchor.Wallet;
  const myPubkey = myWallet.publicKey;

  const myKeypair = anchor.web3.Keypair.generate();
  const keypair1 = anchor.web3.Keypair.generate();
  const keypair2 = anchor.web3.Keypair.generate();

  const pubkey0 = myKeypair.publicKey;
  const pubkey1 = keypair1.publicKey;
  const pubkey2 = keypair2.publicKey;

  const HUNDRED = new BN(100000000000);
  const THOUSAND = new BN(1000000000000);

  const START_TIME = "2024-05-1T05:00:00-04:00";
  const DEAD_TIME = "2024-05-21T05:00:00-04:00";
  const END_TIME = "2024-06-01T05:00:00-04:00";

  const getStatePDA = async (owner: PublicKey) => {
    return (
      await PublicKey.findProgramAddressSync(
        [Buffer.from(GLOBAL_STATE_SEED), owner.toBuffer()],
        PROGRAM_ID
      )
    )[0];
  };

  const getUserPDA = async (user: PublicKey, identifier: number) => {
    return (
      await PublicKey.findProgramAddressSync(
        [Buffer.from(USER_STATE_SEED), user.toBuffer()],
        PROGRAM_ID
      )
    )[0];
  };

  const getVaultPDA = (mintKeypair: PublicKey, owner: PublicKey): PublicKey => {
    return getAssociatedTokenAddressSync(
      mintKeypair,
      owner,
      true
    );
  };

  const getVaultSPDA = async () => {
    return (
      await PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_STATE_SEED)],
        PROGRAM_ID
      )
    )[0];
  };

  const airdropSol = async (
    provider: anchor.AnchorProvider,
    target: PublicKey,
    lamps: number
  ): Promise<string> => {
    try {
      const sig: string = await provider.connection.requestAirdrop(target, lamps);
      await provider.connection.confirmTransaction(sig);
      return sig;
    } catch (e) {
      console.error("Airdrop failed:", e);
      throw e;
    }
  };

  console.log(`My pubkey: ${myPubkey}`);
  console.log(`pubkey0: ${pubkey0}`);
  console.log(`pubkey1: ${pubkey1}`);
  console.log(`pubkey2: ${pubkey2}`);

  let tokenMint = null;
  let globalPDA = null;
  let myGlobalPDA = null;
  let vaultSPDA = null;
  let userPDA0 = null;
  let userPDA1 = null;
  let vaultATA= null;
  let ownerATA = null;
  let devATA = null;
  let userATA0 = null;
  let userATA1 = null;

  it("Program is initialized!", async () => {
    await airdropSol(provider, payer.payer.publicKey, 100000000000);
    await airdropSol(provider, myPubkey, 100000000000);
    await airdropSol(provider, pubkey0, 100000000000);
    await airdropSol(provider, pubkey1, 10000000000);
    await airdropSol(provider, pubkey2, 10000000000);

    tokenMint = await createMint(provider.connection, payer.payer, myPubkey, myPubkey, 9);
    console.log(`tokenMint address: ${tokenMint}`);

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      tokenMint,
      myPubkey
    );

    let signature = await mintTo(
      provider.connection,
      payer.payer,
      tokenMint,
      tokenAccount.address,
      myPubkey,
      1000000000000000
    );
    console.log('mint tx:', signature);

    const toDevAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      tokenMint,
      pubkey0,
      true
    );

    const toTokenAccount1 = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      tokenMint,
      pubkey1,
      true
    );

    const toTokenAccount2 = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      tokenMint,
      pubkey2,
      true
    );

    signature = await transfer(
      provider.connection,
      payer.payer,
      tokenAccount.address,
      toTokenAccount1.address,
      myPubkey,
      1000000000000
    );

    console.log('transfer tx:', signature);

    signature = await transfer(
      provider.connection,
      payer.payer,
      tokenAccount.address,
      toTokenAccount2.address,
      myPubkey,
      1000000000000
    );
  
    console.log('transfer tx:', signature);

    let info = await getAccount(provider.connection, tokenAccount.address);
    console.log(`tokenAccount amount: ${info.amount}`);
    info = await getAccount(provider.connection, toTokenAccount1.address);
    console.log(`tokenAccount1 amount: ${info.amount}`);
    info = await getAccount(provider.connection, toTokenAccount2.address);
    console.log(`tokenAccount2 amount: ${info.amount}`);

    globalPDA = await getStatePDA(myPubkey);
    console.log(`globalPDA: ${globalPDA}`);
    vaultSPDA = await getVaultSPDA();
    console.log(`vaultSPDA: ${vaultSPDA}`);
    
    const tx = await program.methods
      .initialize()
      .accounts({
        authority: myPubkey,
        globalState: globalPDA,
        vaultState: vaultSPDA,
        tokenMint: tokenMint,
        systemProgram: web3.SystemProgram.programId
      })
      .rpc();
    console.log("Program is initialied by owner", tx);
  });

  it("User 0 bet token!", async () => {
    userPDA0 = await getUserPDA(pubkey1, 0);
    console.log(`userPDA0 address: ${userPDA0}`);

    vaultATA = await getVaultPDA(tokenMint, globalPDA);
    console.log(`vaultATA address: ${vaultATA}`);
    userATA0 = await getVaultPDA(tokenMint, pubkey1);
    console.log(`userATA0 address: ${userATA0}`);

    let info = await getAccount(provider.connection, userATA0);
    console.log(`userATA0 amount: ${info.amount}`);
    
    const tx = await program.methods
      .betToken(new BN(HUNDRED))
      .accounts({
        user: pubkey1,
        authority: myPubkey,
        globalState: globalPDA,
        userState: userPDA0,
        tokenMint: tokenMint,
        tokenAccount: vaultATA,
        userTokenAccount: userATA0,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([keypair1])
      .rpc();

    console.log("User 0 bet token", tx);

    info = await getAccount(provider.connection, userATA0);
    console.log(`userATA0 amount: ${info.amount}`);
    info = await getAccount(provider.connection, vaultATA);
    console.log(`vaultATA amount: ${info.amount}`);
  });

  it("User 1 bet token!", async () => {
    userPDA1 = await getUserPDA(pubkey2, 0);
    console.log(`userPDA01 address: ${userPDA1}`);

    vaultATA = await getVaultPDA(tokenMint, globalPDA);
    console.log(`vaultATA address: ${vaultATA}`);
    userATA1 = await getVaultPDA(tokenMint, pubkey2);
    console.log(`userATA1 address: ${userATA1}`);

    let info = await getAccount(provider.connection, userATA1);
    console.log(`userATA1 amount: ${info.amount}`);
    
    const tx = await program.methods
      .betToken(new BN(HUNDRED))
      .accounts({
        user: pubkey2,
        authority: myPubkey,
        globalState: globalPDA,
        userState: userPDA1,
        tokenMint: tokenMint,
        tokenAccount: vaultATA,
        userTokenAccount: userATA1,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([keypair2])
      .rpc();

    console.log("User 1 bet token", tx);

    info = await getAccount(provider.connection, userATA1);
    console.log(`userATA1 amount: ${info.amount}`);
    info = await getAccount(provider.connection, vaultATA);
    console.log(`vaultATA amount: ${info.amount}`);
  });

  // it("Program is reinitialized by dev!", async () => {
  //   myGlobalPDA = await getStatePDA(pubkey0);
  //   console.log(`My global PDA: ${myGlobalPDA}`);
  //   devATA = await getVaultPDA(tokenMint, pubkey0);
  //   console.log(`devATA: ${devATA}`);

  //   let tx = await program.methods
  //     .initialize()
  //     .accounts({
  //       authority: pubkey0,
  //       globalState: myGlobalPDA,
  //       vaultState: vaultSPDA,
  //       tokenMint: tokenMint,
  //       systemProgram: web3.SystemProgram.programId
  //     })
  //     .signers([myKeypair])
  //     .rpc();
  //   console.log("Program is reinitialized by dev", tx);

  //   let info = await getAccount(provider.connection, vaultATA);
  //   console.log(`vaultATA amount: ${info.amount}`);
  //   info = await getAccount(provider.connection, devATA);
  //   console.log(`devATA amount: ${info.amount}`);

  //   tx = await program.methods
  //     .withdrawToken(new BN(HUNDRED))
  //     .accounts({
  //       authority: pubkey0,
  //       globalState: myGlobalPDA,
  //       vaultState: vaultSPDA,
  //       tokenMint: tokenMint,
  //       tokenAccount: vaultATA,
  //       authorityTokenAccount: devATA,
  //       tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
  //       associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
  //       systemProgram: web3.SystemProgram.programId,
  //     })
  //     .signers([myKeypair])
  //     .rpc();

  //   console.log("dev withdrew usdc", tx);

  //   info = await getAccount(provider.connection, vaultATA);
  //   console.log(`usdcATA amount: ${info.amount}`);
  //   info = await getAccount(provider.connection, devATA);
  //   console.log(`devUsdcATA amount: ${info.amount}`);

  //   tx = await program.methods
  //     .updateConfig(true)
  //     .accounts({
  //       authority: pubkey0,
  //       globalState: myGlobalPDA,
  //       vaultState: vaultSPDA,
  //       systemProgram: web3.SystemProgram.programId,
  //     })
  //     .signers([myKeypair])
  //     .rpc();

  //   console.log("dev updated config", tx);
  // });

  it("Owner withdrew the tokens!", async () => {
    ownerATA = await getVaultPDA(tokenMint, myPubkey);
    console.log(`ownerATA address: ${ownerATA}`);

    let info = await getAccount(provider.connection, vaultATA);
    console.log(`vaultATA amount: ${info.amount}`);
    info = await getAccount(provider.connection, ownerATA);
    console.log(`ownerATA amount: ${info.amount}`);

    const tx = await program.methods
      .withdrawToken(new BN(HUNDRED))
      .accounts({
        authority: myPubkey,
        globalState: globalPDA,
        vaultState: vaultSPDA,
        tokenMint: tokenMint,
        tokenAccount: vaultATA,
        authorityTokenAccount: ownerATA,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Owner withdrew usdc", tx);

    info = await getAccount(provider.connection, vaultATA);
    console.log(`vaultATA amount: ${info.amount}`);
    info = await getAccount(provider.connection, ownerATA);
    console.log(`ownerATA amount: ${info.amount}`);
  });
});