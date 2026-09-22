import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

type NightlyAccount = {
  address: string;
};

type NightlySolanaProvider = {
  connect?: () => Promise<{ publicKey?: { toString: () => string }; address?: string }>;
  features?: {
    'standard:connect'?: {
      connect: (input?: { silent?: boolean }) => Promise<{
        accounts: readonly NightlyAccount[];
      }>;
    };
    'standard:disconnect'?: {
      disconnect: () => Promise<void> | void;
    };
  };
};

declare global {
  interface Window {
    nightly?: {
      solana?: NightlySolanaProvider;
    };
  }
}

type NightlyWalletState = {
  isConnected: boolean;
  address: string | null;
  provider: NightlySolanaProvider | null;
  available: boolean;
  connecting: boolean;
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
};

const NightlyWalletContext = createContext<NightlyWalletState | undefined>(
  undefined,
);

function getNightlySolana() {
  if (typeof window === 'undefined') return undefined;
  return window.nightly?.solana;
}

function getConnectFeature(provider = getNightlySolana()) {
  return provider?.features?.['standard:connect'];
}

async function initializeNightly() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 1500) {
    const provider = getNightlySolana();
    if (provider && (getConnectFeature(provider) || provider.connect)) {
      return provider;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  return getNightlySolana();
}

export function NightlyWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<NightlySolanaProvider | null>(null);
  const [available, setAvailable] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const detect = () => {
      const provider = getNightlySolana();
      setProvider(provider ?? null);
      setAvailable(Boolean(window.nightly && provider && (getConnectFeature(provider) || provider.connect)));
    };
    detect();
    const interval = window.setInterval(detect, 500);
    return () => window.clearInterval(interval);
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const provider = await initializeNightly();
      const feature = getConnectFeature(provider);
      let nextAddress: string | undefined;
      if (feature) {
        const result = await feature.connect({ silent: false });
        nextAddress = result.accounts[0]?.address;
      } else if (provider?.connect) {
        const result = await provider.connect();
        nextAddress = result.address ?? result.publicKey?.toString();
      }
      if (!nextAddress) {
        throw new Error('Nightly Wallet is installed but could not initialize its connection provider.');
      }
      setAddress(nextAddress);
      setProvider(provider ?? null);
      setAvailable(true);
      return nextAddress;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const feature = getNightlySolana()?.features?.['standard:disconnect'];
    if (feature) await feature.disconnect();
    setAddress(null);
  }, []);

  return createElement(
    NightlyWalletContext.Provider,
    { value: { isConnected: Boolean(address), address, provider, available, connecting, connect, disconnect } },
    children,
  );
}

export function useNightlyWallet() {
  const wallet = useContext(NightlyWalletContext);
  if (!wallet) {
    throw new Error('useNightlyWallet must be used within NightlyWalletProvider');
  }
  return wallet;
}