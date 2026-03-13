import dotenv from "dotenv";
import {
  BagsSDK,
  waitForSlotsToPass,
  signAndSendTransaction,
  createTipTransaction,
  sendBundleAndConfirm,
} from "@bagsfm/bags-sdk";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

dotenv.config({ quiet: true });

// ==================== ENV & SETUP ====================

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && !defaultValue) {
    console.warn(`Missing environment variable: ${name}`);
    return defaultValue || "";
  }
  return value || defaultValue || "";
}

// ==================== TYPES ====================

export interface TokenLaunchRequest {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  website: string;
  twitter: string;
  telegram: string;
  totalSupply: string;
  liquidityPercent: string;
  decimals: string;
  rpcUrl: string;
  privateKey: string;
  creator?: string;
}

export interface LaunchResult {
  signature?: string;
  tokenMint?: string;
  bundleId?: string;
  error?: string;
}

// ==================== HELPERS ====================

function enforceMinSupply(supply: bigint) {
  const MIN_TOTAL_SUPPLY = 1_000_000n;
  if (supply < MIN_TOTAL_SUPPLY) {
    throw new Error(
      `Total supply must be at least ${MIN_TOTAL_SUPPLY.toString()} tokens`
    );
  }
}

function toRawAmount(amount: bigint, decimals: number): bigint {
  return amount * BigInt(10 ** decimals);
}

function getSolscanLink(signature: string): string {
  return `https://solscan.io/tx/${signature}`;
}

// ==================== MAIN LAUNCH FUNCTION ====================

export async function launchToken(
  req: TokenLaunchRequest
): Promise<LaunchResult> {
  const startTime = Date.now();
  console.log("🚀 Starting Solana Token Launch...");

  try {
    // Parse request data
    const totalSupply = BigInt(req.totalSupply);
    const decimals = parseInt(req.decimals, 10);
    const liquidityPercent = parseFloat(req.liquidityPercent) / 100;

    // Validate
    enforceMinSupply(totalSupply);

    if (!req.privateKey) {
      throw new Error("Private key is required");
    }

    // Setup connection and SDK
    const rpcUrl = req.rpcUrl || getEnvVar("SOLANA_RPC_URL");
    const bagsApiKey = getEnvVar("BAGS_API_KEY");

    if (!rpcUrl) {
      throw new Error("SOLANA_RPC_URL is required");
    }
    if (!bagsApiKey) {
      throw new Error("BAGS_API_KEY is required");
    }

    const connection = new Connection(rpcUrl, "confirmed");
    const sdk = new BagsSDK(bagsApiKey, connection, "confirmed");

    // Parse keypair
    let creatorKeypair: Keypair;
    try {
      creatorKeypair = Keypair.fromSecretKey(bs58.decode(req.privateKey));
    } catch (err) {
      throw new Error("Invalid private key format (must be base58)");
    }

    const creatorPubkey = creatorKeypair.publicKey;
    console.log(`👤 Creator: ${creatorPubkey.toBase58()}`);

    // Calculate supplies
    const liquiditySupply = BigInt(
      Math.floor(Number(totalSupply) * liquidityPercent)
    );
    const creatorSupply = totalSupply - liquiditySupply;

    const totalSupplyRaw = toRawAmount(totalSupply, decimals);
    const liquiditySupplyRaw = toRawAmount(liquiditySupply, decimals);

    console.log("📦 Supply Breakdown:");
    console.log(`  Total: ${totalSupply.toString()} Tokens`);
    console.log(`  Liquidity (Locked): ${liquiditySupply.toString()} Tokens`);
    console.log(`  Creator: ${creatorSupply.toString()} Tokens`);

    // ==================== STEP 1: CREATE TOKEN METADATA ====================
    console.log("\n📝 Step 1: Creating Token Metadata...");

    const tokenInfo = await sdk.tokenLaunch.createTokenInfo({
      name: req.name,
      symbol: req.symbol,
      description: req.description,
      imageUrl: req.imageUrl,
      website: req.website,
      twitter: req.twitter,
      telegram: req.telegram,
      totalSupply: totalSupplyRaw.toString(),
      decimals: decimals,
    });

    console.log(`✅ Metadata created! ID: ${tokenInfo.id}`);

    // ==================== STEP 2: CREATE FEE SHARE CONFIG ====================
    console.log("\n⚙️ Step 2: Creating Fee Share Config...");

    const feeShareConfig = await sdk.tokenLaunch.createConfig({
      tokenInfoId: tokenInfo.id,
      creator: creatorPubkey.toBase58(),
      claimers: [
        {
          address: creatorPubkey.toBase58(),
          bps: 10000, // 100% to creator
        },
      ],
    });

    console.log(`✅ Fee config created! ID: ${feeShareConfig.id}`);

    // ==================== STEP 3: OPTIMIZED METEORA DBC CONFIG ====================
    console.log("\n🔐 Step 3: Preparing High-Impact Liquidity Config...");

    const METEORA_DBC_PROGRAM_ID = new PublicKey(
      "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN"
    );

    const dbcConfig = {
      dbcProgramId: METEORA_DBC_PROGRAM_ID.toBase58(),
      initialTokenLiquidity: liquiditySupplyRaw.toString(),
      // 🔥 TWEAK 1: Increase initial SOL to make the pool look healthier
      // (Example: 2 SOL. Change this based on your budget)
      initialSolLiquidityLamports: (2.0 * LAMPORTS_PER_SOL).toString(),
      curveConfig: {
        // 🔥 TWEAK 2: Lower starting price to give early buyers a better multiplier
        startingPriceLamports: (0.0001 * LAMPORTS_PER_SOL).toString(),
      },
    };

    // ==================== STEP 4: GET LAUNCH TRANSACTIONS ====================
    console.log("\n🏗️ Step 4: Fetching Launch Transactions...");

    const { unsignedTransactions, jitoTipLamports } =
      await sdk.tokenLaunch.getLaunchTransaction({
        tokenInfoId: tokenInfo.id,
        configId: feeShareConfig.id,
        creator: creatorPubkey.toBase58(),
        meteoraDbcConfig: dbcConfig,
      });

    console.log(`📄 Received ${unsignedTransactions.length} transaction(s)`);

    // ==================== STEP 5: SIGN & SEND TRANSACTIONS ====================
    console.log("\n🚀 Step 5: Broadcasting to Mainnet...");

    const txs = unsignedTransactions.map((txBytes: Buffer) =>
      VersionedTransaction.deserialize(txBytes)
    );

    let finalSignature: string | undefined;
    let bundleId: string | undefined;
    const FALLBACK_JITO_TIP = 0.02 * LAMPORTS_PER_SOL;

    if (txs.length > 1) {
      console.log("📦 Packaging as Jito Bundle...");

      const tipLamports =
        jitoTipLamports ?? BigInt(Math.floor(FALLBACK_JITO_TIP));

      const tipTx = await createTipTransaction({
        connection,
        payer: creatorPubkey,
        tipLamports: Number(tipLamports),
      });

      const allTxs = [...txs, tipTx];
      allTxs.forEach((tx) => tx.sign([creatorKeypair]));

      try {
        bundleId = await sendBundleAndConfirm({
          connection,
          transactions: allTxs,
        });
        console.log(`✅ Bundle sent! ID: ${bundleId}`);
        finalSignature = bundleId;
      } catch (bundleErr) {
        console.error(
          "⚠️ Bundle failed. Falling back to sequential broadcast..."
        );

        for (const [index, tx] of txs.entries()) {
          const sig = await signAndSendTransaction({
            connection,
            transaction: tx,
            signers: [creatorKeypair],
          });
          console.log(`✔️ Fallback Tx ${index + 1}: ${getSolscanLink(sig)}`);
          if (index === 0) finalSignature = sig;
        }
      }
    } else {
      console.log("📨 Sending single transaction...");
      const tx = txs[0];
      tx.sign([creatorKeypair]);

      finalSignature = await signAndSendTransaction({
        connection,
        transaction: tx,
        signers: [creatorKeypair],
      });

      console.log(`✅ Confirmed: ${getSolscanLink(finalSignature)}`);
    }

    // Wait for propagation
    await waitForSlotsToPass(connection, 3);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Launch completed in ${duration}s!`);

    return {
      signature: finalSignature,
      tokenMint: tokenInfo.id,
      bundleId: bundleId,
    };
  } catch (err) {
    console.error("❌ Launch failed:", err);
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
