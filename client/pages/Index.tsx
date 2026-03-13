import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Rocket, Settings, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LaunchResult {
  success: boolean;
  signature?: string;
  tokenMint?: string;
  bundleId?: string;
  meVProtected?: boolean;
  securityNote?: string;
  explorerUrl?: string;
}

export default function Index() {
  const [activeTab, setActiveTab] = useState("metadata");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);

  const [formData, setFormData] = useState({
    // Metadata
    name: "My Launchpad Token",
    symbol: "MLP",
    description: "Token launched securely via Bags SDK",
    imageUrl: "https://your-image-url.com/logo.png",
    website: "https://your-website.com",
    twitter: "https://twitter.com/yourhandle",
    telegram: "https://t.me/yourgroup",

    // Supply
    totalSupply: "10000000",
    liquidityPercent: "40",
    decimals: "9",

    // Fee Share
    creator: "",

    // Solana Config
    rpcUrl: "https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY",
    privateKey: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setLaunchResult(null);

    try {
      // Validate inputs
      if (!formData.name || !formData.symbol) {
        throw new Error("Token name and symbol are required");
      }
      if (!formData.privateKey) {
        throw new Error("Private key is required");
      }

      const response = await fetch("/api/launch-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to launch token");
      }

      const result = await response.json();
      setLaunchResult(result);
      setSuccess(true);

      // Show detailed transaction info
      const mevStatus = result.meVProtected
        ? "🛡️ MEV PROTECTED (Jito Bundle)"
        : "⚠️ Standard RPC Launch";

      const message = `✅ TOKEN LAUNCHED SUCCESSFULLY!\n\n${mevStatus}\n\nToken Mint: ${result.tokenMint}\nTransaction: ${result.signature}\n\nView on Solscan:\n${result.explorerUrl}`;
      alert(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Rocket className="w-8 h-8 text-primary animate-bounce" />
            <h1 className="text-3xl font-bold gradient-text">Solana Token Launchpad</h1>
          </div>
          <p className="text-muted-foreground">Launch your token securely on Solana mainnet with Bags SDK</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Alert Banner */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && launchResult && (
            <div className="mb-6 space-y-3">
              <Alert className="border-green-500/50 bg-green-500/10">
                <Rocket className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-200">
                  ✅ Token launched successfully!
                </AlertDescription>
              </Alert>

              {launchResult.meVProtected && (
                <Alert className="border-primary/50 bg-primary/10">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-primary">
                    🛡️ <strong>MEV PROTECTED:</strong> Your launch was secured with Jito bundling. MEV bots couldn't front-run your deployment!
                  </AlertDescription>
                </Alert>
              )}

              {!launchResult.meVProtected && (
                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    ℹ️ <strong>Standard Launch:</strong> Consider using Jito bundling in the future for stronger MEV protection.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-sm">
                    <p><strong>Token Mint:</strong> <code className="bg-background/50 px-2 py-1 rounded text-xs break-all">{launchResult.tokenMint}</code></p>
                    <p><strong>Transaction:</strong> <code className="bg-background/50 px-2 py-1 rounded text-xs break-all">{launchResult.signature}</code></p>
                    {launchResult.bundleId && (
                      <p><strong>Bundle ID:</strong> <code className="bg-background/50 px-2 py-1 rounded text-xs break-all">{launchResult.bundleId}</code></p>
                    )}
                    <p className="mt-3">
                      <a
                        href={launchResult.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-semibold"
                      >
                        View on Solscan →
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Form Card */}
          <Card className="card-glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Launch Your Token
              </CardTitle>
              <CardDescription>Configure your token parameters and deploy to mainnet</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                    <TabsTrigger value="supply">Supply & Config</TabsTrigger>
                    <TabsTrigger value="solana">Solana Setup</TabsTrigger>
                  </TabsList>

                  {/* Metadata Tab */}
                  <TabsContent value="metadata" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Token Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="My Token"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="bg-background/50 border-border/50"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="symbol">Symbol *</Label>
                        <Input
                          id="symbol"
                          name="symbol"
                          placeholder="MTKN"
                          value={formData.symbol}
                          onChange={handleInputChange}
                          maxLength={10}
                          className="bg-background/50 border-border/50"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe your token..."
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="bg-background/50 border-border/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <Input
                        id="imageUrl"
                        name="imageUrl"
                        type="url"
                        placeholder="https://..."
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        className="bg-background/50 border-border/50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          name="website"
                          type="url"
                          placeholder="https://..."
                          value={formData.website}
                          onChange={handleInputChange}
                          className="bg-background/50 border-border/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          name="twitter"
                          type="url"
                          placeholder="https://twitter.com/..."
                          value={formData.twitter}
                          onChange={handleInputChange}
                          className="bg-background/50 border-border/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telegram">Telegram</Label>
                      <Input
                        id="telegram"
                        name="telegram"
                        type="url"
                        placeholder="https://t.me/..."
                        value={formData.telegram}
                        onChange={handleInputChange}
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                  </TabsContent>

                  {/* Supply & Config Tab */}
                  <TabsContent value="supply" className="space-y-4">
                    <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-4">
                      <h3 className="font-semibold text-accent mb-2">Supply Configuration</h3>
                      <p className="text-sm text-muted-foreground">Configure your token's total supply and liquidity allocation</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalSupply">Total Supply *</Label>
                        <Input
                          id="totalSupply"
                          name="totalSupply"
                          type="number"
                          placeholder="10000000"
                          value={formData.totalSupply}
                          onChange={handleInputChange}
                          className="bg-background/50 border-border/50"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Minimum: 1,000,000 tokens</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="decimals">Decimals *</Label>
                        <Input
                          id="decimals"
                          name="decimals"
                          type="number"
                          placeholder="9"
                          value={formData.decimals}
                          onChange={handleInputChange}
                          min="0"
                          max="9"
                          className="bg-background/50 border-border/50"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="liquidityPercent">Liquidity Pool %</Label>
                      <Input
                        id="liquidityPercent"
                        name="liquidityPercent"
                        type="number"
                        placeholder="40"
                        value={formData.liquidityPercent}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        className="bg-background/50 border-border/50"
                      />
                      <p className="text-xs text-muted-foreground">Percentage of tokens for liquidity (locked in Meteora DBC)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="creator">Creator Address</Label>
                      <Input
                        id="creator"
                        name="creator"
                        placeholder="Your Solana address (auto-filled from private key)"
                        value={formData.creator}
                        onChange={handleInputChange}
                        className="bg-background/50 border-border/50"
                        disabled
                      />
                    </div>
                  </TabsContent>

                  {/* Solana Setup Tab */}
                  <TabsContent value="solana" className="space-y-4">
                    <Alert className="bg-destructive/10 border-destructive/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Never share your private key. Always use environment variables in production.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="rpcUrl">RPC URL</Label>
                      <Input
                        id="rpcUrl"
                        name="rpcUrl"
                        type="url"
                        placeholder="https://mainnet.helius-rpc.com/?api-key=YOUR_KEY"
                        value={formData.rpcUrl}
                        onChange={handleInputChange}
                        className="bg-background/50 border-border/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: Helius RPC for best mainnet performance
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="privateKey">Private Key (Base58) *</Label>
                      <Textarea
                        id="privateKey"
                        name="privateKey"
                        placeholder="Your base58-encoded private key"
                        value={formData.privateKey}
                        onChange={handleInputChange}
                        rows={4}
                        className="bg-background/50 border-border/50 font-mono text-sm"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Your private key is only used to sign transactions. Never stored.
                      </p>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                      <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        🚀 Jito Bundling: Your MEV Protection
                      </h3>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                          <strong className="text-foreground">What it does:</strong> Jito bundling packages your launch transactions into an atomic bundle, preventing predatory MEV bots from front-running your deployment.
                        </p>
                        <p>
                          <strong className="text-foreground">Why it matters:</strong> Without Jito protection, MEV bots can intercept your launch transactions, steal the cheapest tokens on the bonding curve before real buyers get in, and sell at a profit—all within milliseconds.
                        </p>
                        <p>
                          <strong className="text-foreground">The benefit:</strong> With Jito bundling, your launch is atomic. All transactions execute together or not at all. This ensures fair access for early buyers and stops predatory MEV extraction.
                        </p>
                      </div>
                    </div>

                    <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                      <h3 className="font-semibold text-secondary mb-2 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Integration Details
                      </h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✅ Bags SDK Integration</li>
                        <li>🛡️ Jito Bundle MEV Protection (Automatic)</li>
                        <li>🔐 Meteora DBC Locked Liquidity</li>
                        <li>💰 Auto-fee-share Configuration</li>
                        <li>⚡ Optimized Liquidity Config (2 SOL + Low Start Price)</li>
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Submit Button */}
                <div className="mt-8 flex gap-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="gradient-primary glow-primary flex-1 h-12 text-lg font-semibold"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin mr-2">⏳</div>
                        Launching...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 mr-2" />
                        Launch Token on Mainnet
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            <Card className="card-glass border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Jito MEV Shield
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Automatic Jito bundling prevents bots from front-running your launch
                </p>
              </CardContent>
            </Card>

            <Card className="card-glass border-secondary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-secondary" />
                  Locked Liquidity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Meteora DBC locks your LP tokens to prevent rug-pulls
                </p>
              </CardContent>
            </Card>

            <Card className="card-glass border-accent/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4 text-accent" />
                  Optimized Pool
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  2 SOL liquidity + low starting price for better early-buyer incentives
                </p>
              </CardContent>
            </Card>

            <Card className="card-glass border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  ⚡ Full Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Customize all token parameters, supply allocation, and fees
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            Built with Bags SDK • Powered by Solana • 🚀
          </p>
        </div>
      </footer>
    </div>
  );
}
