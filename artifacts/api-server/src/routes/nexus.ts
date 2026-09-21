import { Router, type IRouter } from "express";
import {
  ClaimNexusFaucetBody,
  ClaimNexusFaucetResponse,
  CreateNexusLaunchBody,
  CreateNexusLaunchResponse,
  CreateNexusSwapQuoteBody,
  CreateNexusSwapQuoteResponse,
  GetNexusActivityResponse,
  GetNexusMarketsResponse,
  GetNexusOverviewResponse,
  GetNexusVaultsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const overview = {
  portfolioValue: 24842.18,
  portfolioChange: 12.84,
  cookBalance: 12480.55,
  stakedValue: 8520.3,
  tvl: 18420000,
  activeWallets: 12842,
  cookPrice: 1.986,
  volume24h: 2460000,
  faucetCooldown: 0,
};

const markets = [
  {
    id: "cook-usdc",
    pair: "COOK / USDC",
    tokenA: "COOK",
    tokenB: "USDC",
    price: 1.986,
    change24h: 8.42,
    volume24h: 1280000,
    tvl: 8420000,
    feeTier: 0.3,
    sparkline: [1.64, 1.7, 1.68, 1.78, 1.74, 1.89, 1.86, 1.98],
  },
  {
    id: "cook-sol",
    pair: "COOK / SOL",
    tokenA: "COOK",
    tokenB: "SOL",
    price: 0.0114,
    change24h: 5.17,
    volume24h: 746000,
    tvl: 5240000,
    feeTier: 0.3,
    sparkline: [0.0092, 0.0098, 0.0097, 0.0102, 0.0108, 0.0105, 0.0112, 0.0114],
  },
  {
    id: "cook-cookie",
    pair: "COOK / COOKIE",
    tokenA: "COOK",
    tokenB: "COOKIE",
    price: 6.42,
    change24h: -1.24,
    volume24h: 212000,
    tvl: 1800000,
    feeTier: 1,
    sparkline: [6.5, 6.62, 6.48, 6.7, 6.58, 6.44, 6.5, 6.42],
  },
];

const activities = [
  {
    id: "tx-1",
    type: "swap" as const,
    label: "Swapped USDC for COOK",
    amount: 2400,
    token: "COOK",
    status: "success" as const,
    timestamp: "12 min ago",
    hash: "4rX8...pQ2m",
  },
  {
    id: "tx-2",
    type: "stake" as const,
    label: "Staked into Cookie Jar",
    amount: 1200,
    token: "COOK",
    status: "success" as const,
    timestamp: "2 hr ago",
    hash: "8kLm...91Va",
  },
  {
    id: "tx-3",
    type: "provide" as const,
    label: "Added liquidity to COOK / SOL",
    amount: 840,
    token: "USDC",
    status: "pending" as const,
    timestamp: "Yesterday",
    hash: "2zTq...a7Mn",
  },
  {
    id: "tx-4",
    type: "claim" as const,
    label: "Claimed vault rewards",
    amount: 48.2,
    token: "COOK",
    status: "success" as const,
    timestamp: "Sep 18",
    hash: "9dFw...k32B",
  },
];

const vaults = [
  {
    id: "cookie-jar",
    name: "Cookie Jar",
    token: "COOK",
    apy: 24.8,
    tvl: 6800000,
    lockup: "30 days",
    userStaked: 4200,
    color: "amber",
  },
  {
    id: "crunchy-lp",
    name: "Crunchy LP",
    token: "COOK / USDC",
    apy: 42.6,
    tvl: 5240000,
    lockup: "Flexible",
    userStaked: 1840,
    color: "violet",
  },
  {
    id: "oven-boost",
    name: "Oven Boost",
    token: "COOK",
    apy: 68.4,
    tvl: 2180000,
    lockup: "90 days",
    userStaked: 2480,
    color: "rose",
  },
];

router.get("/nexus/overview", (_req, res) => {
  res.json(GetNexusOverviewResponse.parse(overview));
});

router.get("/nexus/markets", (_req, res) => {
  res.json(GetNexusMarketsResponse.parse(markets));
});

router.get("/nexus/activity", (_req, res) => {
  res.json(GetNexusActivityResponse.parse(activities));
});

router.get("/nexus/vaults", (_req, res) => {
  res.json(GetNexusVaultsResponse.parse(vaults));
});

router.post("/nexus/faucet/claim", (req, res) => {
  const body = ClaimNexusFaucetBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Enter a valid wallet address and asset." });
    return;
  }

  res.json(
    ClaimNexusFaucetResponse.parse({
      success: true,
      asset: body.data.asset,
      amount: body.data.asset === "COOK" ? 100 : 25,
      nextClaimIn: 86400,
      txHash: "faucet-" + body.data.wallet.slice(0, 8),
    }),
  );
});

router.post("/nexus/swap/quote", (req, res) => {
  const body = CreateNexusSwapQuoteBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Enter a valid amount, token pair, and slippage." });
    return;
  }

  const isUsdcToCook = body.data.fromToken === "USDC" && body.data.toToken === "COOK";
  const rate = isUsdcToCook ? 1 / overview.cookPrice : overview.cookPrice;
  const outputAmount = body.data.amount * rate * 0.997;
  res.json(
    CreateNexusSwapQuoteResponse.parse({
      fromToken: body.data.fromToken,
      toToken: body.data.toToken,
      inputAmount: body.data.amount,
      outputAmount,
      rate,
      priceImpact: Math.min(2.4, Math.max(0.08, body.data.amount / 100000)),
      minimumReceived: outputAmount * (1 - body.data.slippage / 100),
      route: isUsdcToCook ? "USDC → COOK" : `${body.data.fromToken} → COOK`,
    }),
  );
});

router.post("/nexus/launchpad", (req, res) => {
  const body = CreateNexusLaunchBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Complete the token name, symbol, supply, and creator wallet." });
    return;
  }

  res.status(201).json(
    CreateNexusLaunchResponse.parse({
      id: `launch-${Date.now()}`,
      name: body.data.name,
      symbol: body.data.symbol.toUpperCase(),
      status: "queued",
      createdAt: new Date().toISOString(),
    }),
  );
});

export default router;