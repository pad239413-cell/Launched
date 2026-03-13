import { RequestHandler } from "express";
import { launchToken, TokenLaunchRequest } from "../services/solana-launchpad";

export const handleLaunchToken: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      symbol,
      description,
      imageUrl,
      website,
      twitter,
      telegram,
      totalSupply,
      liquidityPercent,
      decimals,
      rpcUrl,
      privateKey,
    } = req.body;

    // Validation
    if (!name || !symbol || !privateKey) {
      return res.status(400).json({
        error: "Missing required fields: name, symbol, privateKey",
      });
    }

    if (!totalSupply || isNaN(parseFloat(totalSupply))) {
      return res.status(400).json({
        error: "Invalid total supply",
      });
    }

    if (!decimals || isNaN(parseInt(decimals, 10))) {
      return res.status(400).json({
        error: "Invalid decimals value",
      });
    }

    const launchRequest: TokenLaunchRequest = {
      name,
      symbol,
      description: description || "",
      imageUrl: imageUrl || "",
      website: website || "",
      twitter: twitter || "",
      telegram: telegram || "",
      totalSupply,
      liquidityPercent: liquidityPercent || "40",
      decimals,
      rpcUrl: rpcUrl || "https://mainnet.helius-rpc.com/?api-key=YOUR_KEY",
      privateKey,
    };

    const result = await launchToken(launchRequest);

    if (result.error) {
      return res.status(500).json({
        error: result.error,
      });
    }

    res.json({
      success: true,
      signature: result.signature,
      tokenMint: result.tokenMint,
      bundleId: result.bundleId,
      meVProtected: result.meVProtected,
      explorerUrl: `https://solscan.io/tx/${result.signature}`,
      securityNote: result.meVProtected
        ? "🛡️ Your launch was protected by Jito bundling - MEV bots couldn't front-run!"
        : "⚠️ Launch used standard RPC - consider Jito bundling for stronger MEV protection",
    });
  } catch (err) {
    console.error("Token launch error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to launch token",
    });
  }
};
