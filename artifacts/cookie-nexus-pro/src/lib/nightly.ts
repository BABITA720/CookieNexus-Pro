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
  address: string | null;
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

function getConnectFeature() {
  return getNightlySolana()?.features?.['standard:connect'];
}

export function NightlyWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const detect = () => setAvailable(Boolean(getNightlySolana()));
    detect();
    const interval = window.setInterval(detect, 500);
    return () => window.clearInterval(interval);
  }, []);

  const connect = useCallback(async () => {
    const feature = getConnectFeature();
    if (!feature) {
      throw new Error('Nightly Wallet is not installed or not ready yet.');
    }

    setConnecting(true);
    try {
      const result = await feature.connect({ silent: false });
      const nextAddress = result.accounts[0]?.address;
      if (!nextAddress) {
        throw new Error('Nightly did not return a Solana account.');
      }
      setAddress(nextAddress);
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
    { value: { address, available, connecting, connect, disconnect } },
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