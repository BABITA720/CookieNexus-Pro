import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, FormEvent, ReactNode } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  ExternalLink,
  FileSearch,
  Fuel,
  Info,
  LifeBuoy,
  ListFilter,
  Loader2,
  LockKeyhole,
  Map,
  MessageSquare,
  Network,
  PanelRightClose,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  TimerReset,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useClaimNexusFaucet, useGetNexusActivity } from '@workspace/api-client-react';
import { useNightlyWallet } from '@/lib/nightly';

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
type NoticeTone = 'success' | 'error' | 'info';
type Notice = { tone: NoticeTone; text: string } | null;

const fallbackActivity = [
  { id: 'demo-a1', type: 'swap', label: 'Swapped COOK for USDC', amount: 1280, token: 'COOK', status: 'success', timestamp: '12 min ago', hash: '0x8f2a…41c9' },
  { id: 'demo-a2', type: 'stake', label: 'Staked into Golden Crumb', amount: 4200, token: 'COOK', status: 'success', timestamp: '2 hr ago', hash: '0x2b19…c882' },
  { id: 'demo-a3', type: 'claim', label: 'Claimed faucet tokens', amount: 2500, token: 'USDC', status: 'success', timestamp: 'Yesterday', hash: '0x6c40…de11' },
  { id: 'demo-a4', type: 'provide', label: 'Added liquidity to COOK / USDC', amount: 840, token: 'USDC', status: 'pending', timestamp: 'Yesterday', hash: '0x71aa…0f29' },
];

const shortAddress = (value: string) => value.length > 13 ? `${value.slice(0, 6)}…${value.slice(-5)}` : value;
const formatAmount = (value: number) => Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 4 });
const formatTime = (seconds: number) => `${Math.floor(seconds / 3600).toString().padStart(2, '0')}:${Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

function PageIntro({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-primary"><span className="h-px w-5 bg-primary" />{eyebrow}</div>
        <h1 className="text-2xl font-extrabold tracking-[-.045em] text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-[12px] leading-5 text-muted-foreground">{detail}</p>
      </div>
      {action}
    </div>
  );
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`glass rounded-2xl ${className}`}>{children}</section>;
}

function InlineNotice({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const style = notice.tone === 'error'
    ? 'border-red-300/20 bg-red-300/[.07] text-red-200'
    : notice.tone === 'success'
      ? 'border-emerald-300/20 bg-emerald-300/[.07] text-emerald-200'
      : 'border-sky-300/20 bg-sky-300/[.07] text-sky-100';
  const NoticeIcon = notice.tone === 'error' ? AlertCircle : notice.tone === 'success' ? CheckCircle2 : Info;
  return <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[11px] leading-5 ${style}`} data-testid="status-inline-notice"><NoticeIcon size={15} className="mt-0.5 shrink-0" /> <span>{notice.text}</span></div>;
}

function WalletStatus({ compact = false }: { compact?: boolean }) {
  const { address, available, connecting, connect, disconnect } = useNightlyWallet();
  const [notice, setNotice] = useState<Notice>(null);
  const handleClick = async () => {
    if (address) {
      await disconnect();
      setNotice({ tone: 'info', text: 'Nightly wallet disconnected.' });
      return;
    }
    if (!available) {
      setNotice({ tone: 'error', text: 'Nightly Wallet was not detected. Install it, then reload this console.' });
      return;
    }
    try {
      const connectedAddress = await connect();
      setNotice({ tone: 'success', text: `Connected ${shortAddress(connectedAddress)}.` });
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Connection was cancelled.' });
    }
  };
  return (
    <div className={`flex ${compact ? 'flex-col items-end gap-2' : 'flex-col gap-2'}`}>
      <button type="button" onClick={handleClick} disabled={connecting} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-bold transition-colors disabled:cursor-wait disabled:opacity-60 ${address ? 'border-emerald-300/25 bg-emerald-300/[.08] text-emerald-200' : 'border-primary/35 bg-primary/[.1] text-primary hover:bg-primary/[.16]'}`} data-testid="button-wallet-status">
        <span className={`size-1.5 rounded-full ${address ? 'bg-emerald-300' : 'bg-primary'}`} />
        {connecting ? 'Connecting…' : address ? shortAddress(address) : available ? 'Connect Nightly' : 'Nightly unavailable'}
      </button>
      {notice && <div className="max-w-[240px] text-right text-[10px] text-muted-foreground" data-testid="status-wallet">{notice.text}</div>}
    </div>
  );
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return <label htmlFor={htmlFor} className="mb-2 block font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">{children}</label>;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: 'border-emerald-300/20 bg-emerald-300/[.08] text-emerald-200',
    pending: 'border-primary/20 bg-primary/[.08] text-primary',
    failed: 'border-red-300/20 bg-red-300/[.08] text-red-200',
    ready: 'border-sky-300/20 bg-sky-300/[.08] text-sky-200',
  };
  return <span className={`inline-flex rounded-md border px-2 py-1 font-mono text-[9px] uppercase tracking-[.08em] ${styles[status] || styles.ready}`} data-testid={`status-pill-${status}`}>{status}</span>;
}

export function FaucetPage() {
  const { address } = useNightlyWallet();
  const faucet = useClaimNexusFaucet();
  const [wallet, setWallet] = useState('');
  const [asset, setAsset] = useState<'COOK' | 'USDC'>('COOK');
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    if (address && !wallet) setWallet(address);
  }, [address, wallet]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const claim = (event: FormEvent) => {
    event.preventDefault();
    const destination = wallet.trim();
    if (destination.length < 8) {
      setNotice({ tone: 'error', text: 'Enter a wallet address with at least 8 characters.' });
      return;
    }
    if (cooldown > 0) {
      setNotice({ tone: 'info', text: `This wallet is cooling down. Try again in ${formatTime(cooldown)}.` });
      return;
    }
    setNotice({ tone: 'info', text: `Requesting ${asset} from the Cookie Chain testnet faucet…` });
    faucet.mutate({ data: { wallet: destination, asset } }, {
      onSuccess: (result) => {
        setCooldown(result.nextClaimIn || 3600);
        setNotice({ tone: 'success', text: `${formatAmount(result.amount)} ${result.asset} sent to the requested wallet.${result.txHash ? ` Transaction ${result.txHash}` : ''}` });
      },
      onError: () => setNotice({ tone: 'error', text: 'The faucet could not complete this request. Check the address and try again.' }),
    });
  };

  return (
    <div className="animate-rise">
      <PageIntro eyebrow="Testnet utility / 05" title="Claim a clean starting balance." detail="Top up a Cookie Chain testnet wallet with a small amount of COOK or USDC. Faucet claims are rate-limited per wallet." action={<WalletStatus compact />} />
      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-white/[.06] px-5 py-4"><div className="flex items-center gap-2 text-primary"><ArrowDownToLine size={16} /><span className="font-mono text-[10px] uppercase tracking-[.18em]">Free testnet claim</span></div><h2 className="mt-3 text-xl font-extrabold tracking-[-.04em]">Send tokens to your operator wallet.</h2><p className="mt-2 max-w-lg text-[11px] leading-5 text-muted-foreground">Choose one asset, confirm the destination, and submit a faucet request. This does not move mainnet funds.</p></div>
          <form onSubmit={claim} className="space-y-5 p-5">
            <div><FieldLabel htmlFor="faucet-wallet">Destination wallet</FieldLabel><div className="flex gap-2"><input id="faucet-wallet" value={wallet} onChange={(event) => setWallet(event.target.value)} placeholder="Paste a Cookie Chain address" className="min-w-0 flex-1 rounded-xl border border-white/[.1] bg-black/20 px-3 py-3 font-mono text-[11px] outline-none placeholder:text-muted-foreground/60 focus:border-primary/50" data-testid="input-faucet-wallet" /><button type="button" onClick={() => address && setWallet(address)} disabled={!address} className="rounded-xl border border-white/[.1] px-3 text-[10px] font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-use-connected-wallet">Use connected</button></div></div>
            <div><FieldLabel htmlFor="faucet-asset">Asset</FieldLabel><div className="grid grid-cols-2 gap-2">{(['COOK', 'USDC'] as const).map((option) => <button key={option} type="button" onClick={() => setAsset(option)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${asset === option ? 'border-primary/50 bg-primary/[.1]' : 'border-white/[.08] bg-white/[.025] hover:border-white/20'}`} data-testid={`button-faucet-asset-${option.toLowerCase()}`}><span className={`grid size-8 place-items-center rounded-lg font-mono text-[10px] font-bold ${option === 'COOK' ? 'bg-primary/15 text-primary' : 'bg-sky-300/10 text-sky-200'}`}>{option === 'COOK' ? 'C' : '$'}</span><span><span className="block text-xs font-bold">{option}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{option === 'COOK' ? 'Protocol token' : 'Test dollar'}</span></span>{asset === option && <Check size={15} className="ml-auto text-primary" />}</button>)}</div></div>
            <button type="submit" disabled={faucet.isPending || cooldown > 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[11px] font-extrabold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55" data-testid="button-claim-faucet">{faucet.isPending ? <><Loader2 size={14} className="animate-spin" /> Requesting claim…</> : cooldown > 0 ? <><TimerReset size={14} /> Available in {formatTime(cooldown)}</> : <><ArrowDownToLine size={14} /> Claim free {asset}</>}</button>
            <InlineNotice notice={notice} />
          </form>
        </Panel>
        <div className="space-y-4">
          <Panel className="p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-muted-foreground"><Clock3 size={16} /><span className="font-mono text-[10px] uppercase tracking-[.17em]">Cooldown monitor</span></div><StatusPill status={cooldown > 0 ? 'pending' : 'ready'} /></div><div className="mt-5 text-4xl font-extrabold tracking-[-.07em]" data-testid="value-faucet-cooldown">{cooldown > 0 ? formatTime(cooldown) : 'Ready'}</div><p className="mt-2 text-[11px] leading-5 text-muted-foreground">{cooldown > 0 ? 'The next request is locked for this browser session while the faucet window clears.' : 'No local cooldown is active. A successful claim starts a new cooldown.'}</p><div className="mt-5 h-1 overflow-hidden rounded-full bg-white/[.07]"><div className={`h-full rounded-full bg-primary transition-all ${cooldown > 0 ? 'w-2/3' : 'w-full'}`} /></div></Panel>
          <Panel className="p-5"><div className="flex items-center gap-2 text-emerald-200"><ShieldCheck size={16} /><span className="font-mono text-[10px] uppercase tracking-[.17em]">Safety note</span></div><ul className="mt-4 space-y-3 text-[11px] leading-5 text-muted-foreground"><li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />Use a testnet address only. Never paste a recovery phrase.</li><li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />The faucet request is the only action submitted by this page.</li><li className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />Verify any resulting hash in Activity before continuing.</li></ul></Panel>
        </div>
      </div>
    </div>
  );
}

type ActivityItem = { id: string; type: string; label: string; amount: number; token: string; status: string; timestamp: string; hash: string };

function activityIcon(type: string): Icon {
  if (type === 'claim') return ArrowDownToLine;
  if (type === 'stake') return LockKeyhole;
  if (type === 'provide') return Sparkles;
  if (type === 'launch') return TicketCheck;
  return ArrowLeftRight;
}

function ActivityDetail({ item, onClose }: { item: ActivityItem; onClose: () => void }) {
  const copyHash = async () => {
    await navigator.clipboard?.writeText(item.hash);
  };
  return <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/60 p-0 backdrop-blur-sm sm:p-5" role="presentation" onClick={onClose}><aside className="glass h-[min(720px,94dvh)] w-full max-w-md overflow-y-auto rounded-t-2xl border-white/[.1] p-5 sm:rounded-2xl" role="dialog" aria-modal="true" aria-label="Activity detail" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-primary">Activity detail</div><h2 className="mt-2 text-lg font-extrabold tracking-[-.035em]">{item.label}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-white/[.06] hover:text-foreground" aria-label="Close activity detail" data-testid="button-close-activity-detail"><X size={17} /></button></div><div className="mt-6 grid gap-2"><div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Status</span><StatusPill status={item.status} /></div><div className="mt-4 text-2xl font-extrabold" data-testid="value-activity-detail-amount">{formatAmount(item.amount)} {item.token}</div></div>{[['Type', item.type], ['Timestamp', item.timestamp], ['Action metadata', `Nexus ${item.type} operation`]].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-white/[.06] py-3 text-[11px]"><span className="text-muted-foreground">{label}</span><span className="font-mono text-right text-foreground" data-testid={`value-activity-detail-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</span></div>)}<div className="rounded-xl border border-primary/20 bg-primary/[.05] p-4"><div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Transaction hash</span><button type="button" onClick={copyHash} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[.06] hover:text-primary" aria-label="Copy transaction hash" data-testid="button-copy-activity-hash"><Copy size={14} /></button></div><div className="mt-3 break-all font-mono text-[11px] text-primary" data-testid="value-activity-detail-hash">{item.hash}</div><div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground"><ExternalLink size={12} /> Explorer link is available after indexing</div></div></div></aside></div>;
}

export function ActivityLogPage() {
  const activityQuery = useGetNexusActivity();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<ActivityItem | null>(null);
  const rawItems = activityQuery.data as ActivityItem[] | undefined;
  const items = rawItems ?? (activityQuery.isError ? fallbackActivity : []);
  const filtered = useMemo(() => filter === 'all' ? items : items.filter((item) => item.type === filter), [filter, items]);
  const filters = ['all', 'swap', 'stake', 'claim', 'provide', 'launch'];
  const hasError = activityQuery.isError;
  return <div className="animate-rise">
    <PageIntro eyebrow="Traceability / 06" title="Every move, accounted for." detail="A live activity ledger for wallet actions across Cookie Chain. Select a row to inspect its hash and operation metadata." action={<button type="button" onClick={() => void activityQuery.refetch()} disabled={activityQuery.isFetching} className="flex items-center gap-2 rounded-xl border border-white/[.1] px-3 py-2.5 text-[11px] font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50" data-testid="button-refresh-activity"><RefreshCw size={14} className={activityQuery.isFetching ? 'animate-spin' : ''} /> {activityQuery.isFetching ? 'Refreshing…' : 'Refresh log'}</button>} />
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-white/[.06] px-5 py-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2 text-sky-200"><FileSearch size={16} /><span className="font-mono text-[10px] uppercase tracking-[.17em]">Live history</span><span className="size-1.5 animate-pulse rounded-full bg-emerald-300" /></div><p className="mt-2 text-[11px] text-muted-foreground" data-testid="status-activity-source">{hasError ? 'Service unavailable · showing the last known console sample' : 'Synced from the Nexus activity service'}</p></div><div className="flex flex-wrap items-center gap-1.5" data-testid="filter-activity-types"><ListFilter size={14} className="mr-1 text-muted-foreground" />{filters.map((option) => <button type="button" key={option} onClick={() => setFilter(option)} className={`rounded-lg px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[.08em] transition-colors ${filter === option ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/[.06] hover:text-foreground'}`} data-testid={`button-filter-activity-${option}`}>{option}</button>)}</div></div>
      {activityQuery.isLoading ? <div className="space-y-3 p-5" data-testid="state-activity-loading">{[1, 2, 3, 4].map((row) => <div key={row} className="h-14 animate-pulse rounded-xl border border-white/[.05] bg-white/[.025]" />)}</div> : filtered.length === 0 ? <div className="flex flex-col items-center justify-center px-5 py-16 text-center" data-testid="state-activity-empty"><div className="grid size-12 place-items-center rounded-2xl bg-white/[.05] text-muted-foreground"><FileSearch size={20} /></div><h2 className="mt-4 text-sm font-bold">No matching activity</h2><p className="mt-2 max-w-xs text-[11px] leading-5 text-muted-foreground">Try a different operation filter or refresh the ledger.</p></div> : <div className="overflow-x-auto"><div className="min-w-[720px]"><div className="grid grid-cols-[1.5fr_.75fr_.8fr_.95fr_28px] gap-4 px-5 py-3 font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground"><div>Action</div><div>Amount</div><div>Status</div><div>Time / hash</div><div /></div>{filtered.map((item) => { const Icon = activityIcon(item.type); return <button type="button" key={item.id} onClick={() => setSelected(item)} className="grid w-full grid-cols-[1.5fr_.75fr_.8fr_.95fr_28px] items-center gap-4 border-t border-white/[.05] px-5 py-4 text-left transition-colors hover:bg-white/[.035]" data-testid={`row-activity-${item.id}`}><div className="flex items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon size={14} /></span><span><span className="block text-[11px] font-bold">{item.label}</span><span className="mt-1 block font-mono text-[9px] uppercase text-muted-foreground">{item.type}</span></span></div><div className="font-mono text-[11px]" data-testid={`value-activity-amount-${item.id}`}>{formatAmount(item.amount)} {item.token}</div><div><StatusPill status={item.status} /></div><div><div className="text-[10px] text-muted-foreground">{item.timestamp}</div><div className="mt-1 font-mono text-[9px] text-primary">{item.hash}</div></div><ChevronRight size={15} className="text-muted-foreground" /></button>; })}</div></div>}
    </Panel>
    {hasError && <div className="mt-3 flex items-center gap-2 text-[10px] text-primary" data-testid="status-activity-error"><AlertCircle size={13} /> The API did not respond. The displayed sample is clearly marked as last-known console data.</div>}
    {selected && <ActivityDetail item={selected} onClose={() => setSelected(null)} />}
  </div>;
}

type RouteStep = { title: string; detail: string };
const routeSteps: RouteStep[] = [
  { title: 'Route selected', detail: 'Monitored path is available' },
  { title: 'Wallet approval', detail: 'Requires confirmation in Nightly' },
  { title: 'Bridge relay', detail: 'Waiting for a submitted transfer' },
  { title: 'Destination credit', detail: 'Not started' },
];

export function BridgePage() {
  const { address } = useNightlyWallet();
  const [asset, setAsset] = useState('COOK');
  const [amount, setAmount] = useState('250');
  const [direction, setDirection] = useState('solana-cookie');
  const [routeStatus, setRouteStatus] = useState<'idle' | 'ready' | 'prepared'>('idle');
  const [notice, setNotice] = useState<Notice>(null);
  const source = direction === 'solana-cookie' ? 'Solana' : 'Cookie Chain';
  const destination = direction === 'solana-cookie' ? 'Cookie Chain' : 'Solana';
  const findRoute = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setNotice({ tone: 'error', text: 'Enter an amount greater than zero to preview a route.' });
      return;
    }
    setRouteStatus('ready');
    setNotice({ tone: 'success', text: 'Route preview ready. Nothing has been submitted on-chain.' });
  };
  const prepareTransfer = () => {
    if (!address) {
      setNotice({ tone: 'info', text: 'Connect Nightly first. The next step only prepares a wallet approval request.' });
      return;
    }
    setRouteStatus('prepared');
    setNotice({ tone: 'info', text: 'Transfer prepared for wallet approval. No bridge transaction has been submitted.' });
  };
  return <div className="animate-rise">
    <PageIntro eyebrow="Cross-chain ops / 07" title="Find the safest bridge route." detail="Compare a monitored Solana ↔ Cookie Chain path before you hand anything to your wallet. This screen is a local route preview, not a transfer receipt." action={<WalletStatus compact />} />
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-sky-300/20 bg-sky-300/[.06] px-3 py-2.5 text-[10px] leading-5 text-sky-100" data-testid="status-bridge-preview"><Map size={14} className="shrink-0" /><span><strong>Monitored route preview.</strong> Fee and ETA are indicative. A successful preview never means funds moved.</span></div>
    <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
      <Panel className="p-5"><div className="flex items-center gap-2 text-primary"><ArrowLeftRight size={16} /><span className="font-mono text-[10px] uppercase tracking-[.17em]">Route finder</span></div><div className="mt-5 space-y-5"><div><FieldLabel htmlFor="bridge-direction">Direction</FieldLabel><button type="button" onClick={() => { setDirection((value) => value === 'solana-cookie' ? 'cookie-solana' : 'solana-cookie'); setRouteStatus('idle'); }} className="flex w-full items-center justify-between rounded-xl border border-white/[.1] bg-black/20 p-3 text-left hover:border-primary/35" data-testid="button-toggle-bridge-direction"><span><span className="block text-[11px] font-bold">{source} <ArrowRight className="mx-1 inline text-primary" size={13} /> {destination}</span><span className="mt-1 block text-[10px] text-muted-foreground">Native route pair</span></span><ArrowLeftRight size={15} className="text-muted-foreground" /></button></div><div><FieldLabel htmlFor="bridge-asset">Asset</FieldLabel><select id="bridge-asset" value={asset} onChange={(event) => { setAsset(event.target.value); setRouteStatus('idle'); }} className="w-full rounded-xl border border-white/[.1] bg-[#191b27] px-3 py-3 text-[11px] font-bold outline-none focus:border-primary/50" data-testid="select-bridge-asset"><option value="COOK">COOK · Cookie token</option><option value="USDC">USDC · Test dollar</option><option value="SOL">SOL · Solana native</option></select></div><div><FieldLabel htmlFor="bridge-amount">Amount</FieldLabel><div className="relative"><input id="bridge-amount" inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setRouteStatus('idle'); }} className="w-full rounded-xl border border-white/[.1] bg-black/20 px-3 py-3 pr-16 font-mono text-sm outline-none focus:border-primary/50" data-testid="input-bridge-amount" /><span className="absolute right-3 top-3.5 font-mono text-[10px] text-muted-foreground">{asset}</span></div></div><button type="button" onClick={findRoute} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[11px] font-extrabold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="button-find-bridge-route"><Map size={14} /> Find monitored route</button><InlineNotice notice={notice} /></div></Panel>
      <Panel className="overflow-hidden"><div className="border-b border-white/[.06] px-5 py-4"><div className="flex items-center justify-between"><div><div className="text-sm font-bold">Transfer tracker</div><div className="mt-1 text-[10px] text-muted-foreground" data-testid="status-bridge-route">{routeStatus === 'idle' ? 'Waiting for route inputs' : routeStatus === 'prepared' ? 'Prepared for wallet approval' : 'Route preview available'}</div></div><StatusPill status={routeStatus === 'idle' ? 'pending' : routeStatus === 'prepared' ? 'ready' : 'success'} /></div></div><div className="p-5"><div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-center justify-between"><div><div className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Preview amount</div><div className="mt-2 text-2xl font-extrabold" data-testid="value-bridge-amount">{amount || '0'} <span className="text-sm text-muted-foreground">{asset}</span></div></div><div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Network size={19} /></div></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[.06] pt-3"><div><div className="text-[10px] text-muted-foreground">Estimated fee</div><div className="mt-1 font-mono text-[11px]" data-testid="value-bridge-fee">{asset === 'SOL' ? '0.0008 SOL' : '0.18 COOK'}</div></div><div><div className="text-[10px] text-muted-foreground">Indicative ETA</div><div className="mt-1 font-mono text-[11px]" data-testid="value-bridge-eta">~ 2–4 min</div></div></div></div><div className="my-6 space-y-5">{routeSteps.map((step, index) => { const active = routeStatus === 'prepared' ? index < 2 : routeStatus === 'ready' ? index === 0 : false; return <div key={step.title} className="flex gap-3" data-testid={`step-bridge-${index}`}><div className={`relative grid size-7 shrink-0 place-items-center rounded-full border ${active ? 'border-primary/50 bg-primary/15 text-primary' : 'border-white/[.1] bg-white/[.03] text-muted-foreground'}`}>{active ? <Check size={14} /> : <span className="font-mono text-[10px]">{index + 1}</span>}{index < routeSteps.length - 1 && <span className={`absolute left-1/2 top-7 h-5 w-px -translate-x-1/2 ${active ? 'bg-primary/40' : 'bg-white/[.1]'}`} />}</div><div><div className={`text-[11px] font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</div><div className="mt-0.5 text-[10px] text-muted-foreground">{step.detail}</div></div></div>; })}</div><button type="button" onClick={prepareTransfer} disabled={routeStatus === 'idle'} className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/[.08] px-4 py-3 text-[11px] font-extrabold text-primary transition-colors hover:bg-primary/[.14] disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-prepare-bridge-transfer"><Wallet size={14} /> {routeStatus === 'prepared' ? 'Prepared for wallet approval' : 'Prepare transfer'}</button><p className="mt-3 text-center text-[10px] leading-4 text-muted-foreground" data-testid="status-bridge-honesty">{routeStatus === 'prepared' ? 'Awaiting your wallet approval. No transfer is complete.' : 'Connect a wallet to prepare an approval request. No transaction is sent from this preview.'}</p></div></Panel>
    </div>
  </div>;
}

export function GaslessSettingsPage() {
  const { address } = useNightlyWallet();
  const [network, setNetwork] = useState('cookie-testnet');
  const [gasless, setGasless] = useState(false);
  const [confirm, setConfirm] = useState(true);
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); window.setTimeout(() => setSaved(false), 3000); };
  return <div className="animate-rise">
    <PageIntro eyebrow="Safety controls / 08" title="Keep testing predictable." detail="Tune the preparation layer without hiding what your wallet will approve. These preferences stay local to this console." action={<WalletStatus compact />} />
    <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <Panel className="overflow-hidden"><div className="border-b border-white/[.06] px-5 py-4"><div className="flex items-center gap-2 text-primary"><Settings2 size={16} /><span className="font-mono text-[10px] uppercase tracking-[.17em]">Network & preparation</span></div><h2 className="mt-3 text-lg font-extrabold tracking-[-.035em]">Operator defaults</h2></div><div className="space-y-5 p-5"><div><FieldLabel htmlFor="settings-network">Active network</FieldLabel><select id="settings-network" value={network} onChange={(event) => setNetwork(event.target.value)} className="w-full rounded-xl border border-white/[.1] bg-[#191b27] px-3 py-3 text-[11px] font-bold outline-none focus:border-primary/50" data-testid="select-settings-network"><option value="cookie-testnet">Cookie Chain · Testnet</option><option value="solana-devnet">Solana · Devnet</option></select><div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-200"><span className="size-1.5 rounded-full bg-emerald-300" /> Endpoint responding · test funds only</div></div><div className="rounded-xl border border-primary/20 bg-primary/[.06] p-4"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-sm font-bold"><Zap size={15} className="text-primary" />Zero-fee testing</div><p className="mt-2 max-w-md text-[11px] leading-5 text-muted-foreground">Change transaction preparation to request a gasless route. It does not waive network fees by itself and requires an eligible testnet paymaster.</p></div><button type="button" role="switch" aria-checked={gasless} onClick={() => setGasless((current) => !current)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${gasless ? 'bg-primary' : 'bg-white/[.14]'}`} data-testid="toggle-gasless-testing"><span className={`absolute top-1 size-4 rounded-full bg-[#11131d] transition-transform ${gasless ? 'translate-x-6' : 'translate-x-1'}`} /></button></div><div className={`mt-4 flex items-center gap-2 text-[10px] ${gasless ? 'text-primary' : 'text-muted-foreground'}`} data-testid="status-gasless-toggle"><span className={`size-1.5 rounded-full ${gasless ? 'bg-primary' : 'bg-muted-foreground'}`} />{gasless ? 'Gasless preparation requested for eligible testnet transactions.' : 'Standard fee estimation remains active.'}</div></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[.07] p-4 hover:bg-white/[.025]"><input type="checkbox" checked={confirm} onChange={(event) => setConfirm(event.target.checked)} className="mt-0.5 accent-[hsl(var(--primary))]" data-testid="checkbox-wallet-confirmation" /><span><span className="block text-[11px] font-bold">Require wallet re-confirmation</span><span className="mt-1 block text-[10px] leading-4 text-muted-foreground">Keep the final approval visible in Nightly for every prepared transaction.</span></span></label><button type="button" onClick={save} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[11px] font-extrabold text-primary-foreground" data-testid="button-save-settings">{saved ? <><Check size={14} /> Local settings saved</> : 'Save local settings'}</button></div></Panel>
      <div className="space-y-4"><Panel className="p-5"><div className="flex items-center gap-2 text-emerald-200"><ShieldCheck size={16} /><span className="font-mono text-[10px] uppercase tracking-[.17em]">Wallet safety</span></div><div className="mt-4 flex items-center justify-between"><div><div className="text-sm font-bold">Nightly status</div><div className="mt-1 text-[10px] text-muted-foreground" data-testid="status-settings-wallet">{address ? `Connected · ${shortAddress(address)}` : 'Not connected'}</div></div><div className={`grid size-9 place-items-center rounded-xl ${address ? 'bg-emerald-300/10 text-emerald-200' : 'bg-white/[.05] text-muted-foreground'}`}><Wallet size={17} /></div></div><div className="mt-5 space-y-3 text-[11px] leading-5 text-muted-foreground"><div className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-200" />No seed phrase is requested by CookieNexus.</div><div className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-200" />Every final approval remains in your wallet.</div><div className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-200" />Gasless mode never marks a transaction as complete.</div></div></Panel><Panel className="p-5"><div className="flex items-center gap-2 text-sky-200"><Info size={16} /><span className="font-mono text-[10px] uppercase tracking-[.17em]">Current preparation</span></div><div className="mt-4 space-y-3"><div className="flex justify-between border-b border-white/[.06] pb-3 text-[11px]"><span className="text-muted-foreground">Network</span><span className="font-mono" data-testid="value-settings-network">{network === 'cookie-testnet' ? 'Cookie testnet' : 'Solana devnet'}</span></div><div className="flex justify-between border-b border-white/[.06] pb-3 text-[11px]"><span className="text-muted-foreground">Fee route</span><span className="font-mono" data-testid="value-settings-fee-route">{gasless ? 'Paymaster requested' : 'Standard gas'}</span></div><div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Final approval</span><span className="font-mono" data-testid="value-settings-approval">{confirm ? 'Required' : 'Wallet policy'}</span></div></div></Panel></div>
    </div>
  </div>;
}

const helpSections = [
  { id: 'connect', title: 'Connect Nightly', icon: Wallet, body: 'Select Connect Nightly in the header or on an operations page. Nightly opens a permission request; approve it there, then confirm the shortened address shown in the console. CookieNexus never asks for a recovery phrase.' },
  { id: 'bridge', title: 'Preview a bridge route', icon: ArrowLeftRight, body: 'Choose a direction, asset, and amount on Bridge. Find monitored route shows an indicative fee and ETA. Prepare transfer only creates a local approval-ready state; the actual transfer is still waiting for a wallet signature and relay.' },
  { id: 'faucet', title: 'Understand faucet cooldowns', icon: TimerReset, body: 'Faucet claims are for testnet only. After a successful claim, the cooldown timer blocks another request from this browser view. A timer reaching zero does not guarantee the server rate limit has cleared.' },
  { id: 'gasless', title: 'Use gasless testing', icon: Fuel, body: 'The zero-fee testing switch changes how an eligible testnet transaction is prepared. It does not pay fees, bypass Nightly, or confirm a transaction. A compatible paymaster must be available for the route.' },
  { id: 'verify', title: 'Verify a transaction', icon: FileSearch, body: 'Open Activity, refresh the ledger, and select the operation. Compare the full hash, timestamp, amount, and status with your wallet approval and the relevant explorer. Pending is not success.' },
];

const faqs = [
  ['Why is my wallet address shortened?', 'The shortened address is a display convenience. Open the activity detail drawer to compare the operation hash; Nightly remains the source of truth for the connected account.'],
  ['Did Prepare transfer move my tokens?', 'No. Prepare transfer is intentionally local and only indicates that the route can be handed to a wallet approval flow. This demo does not submit bridge transactions.'],
  ['Can I use mainnet funds at the faucet?', 'No. Use a dedicated testnet account. Faucet and gasless controls are designed for testnet experimentation only.'],
  ['What does pending mean in Activity?', 'Pending means the action has not reached a confirmed success state in the activity service. Do not treat it as completed until the status changes and the hash is verifiable.'],
];

export function HelpPage() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const normalized = search.trim().toLowerCase();
  const visibleSections = useMemo(() => helpSections.filter((section) => `${section.title} ${section.body}`.toLowerCase().includes(normalized)), [normalized]);
  const visibleFaqs = useMemo(() => faqs.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(normalized)), [normalized]);
  return <div className="animate-rise">
    <PageIntro eyebrow="Operator handbook / 09" title="Answers before the next click." detail="Short, honest guidance for wallet connections, testnet routes, and reading transaction state." action={<button type="button" onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/[.08] px-3 py-2.5 text-[11px] font-bold text-primary hover:bg-primary/[.14]" data-testid="button-open-help-drawer"><BookOpen size={14} /> Open quick start</button>} />
    <div className="mb-4"><div className="relative"><Search size={15} className="absolute left-3 top-3.5 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search wallet, bridge, faucet, gasless…" className="w-full rounded-xl border border-white/[.1] bg-white/[.025] py-3 pl-10 pr-10 text-[11px] outline-none placeholder:text-muted-foreground/60 focus:border-primary/50" data-testid="input-help-search" />{search && <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-2 rounded-lg p-1.5 text-muted-foreground hover:bg-white/[.07] hover:text-foreground" aria-label="Clear help search" data-testid="button-clear-help-search"><X size={14} /></button>}</div></div>
    <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]"><Panel className="p-5"><div className="flex items-center gap-2 text-primary"><LifeBuoy size={16} /><span className="font-mono text-[10px] uppercase tracking-[.17em]">Quick start</span></div><div className="mt-5 space-y-3">{visibleSections.map((section, index) => { const Icon = section.icon; return <article key={section.id} className="rounded-xl border border-white/[.07] bg-white/[.02] p-4" data-testid={`card-help-section-${section.id}`}><div className="flex gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon size={15} /></div><div><h2 className="text-[12px] font-bold">{index + 1}. {section.title}</h2><p className="mt-2 text-[11px] leading-5 text-muted-foreground">{section.body}</p></div></div></article>; })}{visibleSections.length === 0 && <div className="py-12 text-center" data-testid="state-help-empty"><CircleHelp className="mx-auto text-muted-foreground" size={22} /><p className="mt-3 text-xs font-bold">No guide matches that search.</p><p className="mt-1 text-[10px] text-muted-foreground">Try “wallet” or “transaction”.</p></div>}</div></Panel><Panel className="p-5"><div className="flex items-center gap-2 text-sky-200"><MessageSquare size={16} /><span className="font-mono text-[10px] uppercase tracking-[.17em]">FAQ</span></div><div className="mt-5 divide-y divide-white/[.06]">{visibleFaqs.map(([question, answer], index) => <div key={question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} className="flex w-full items-center justify-between gap-3 py-4 text-left text-[11px] font-bold" data-testid={`button-help-faq-${index}`}><span>{question}</span><ChevronDown size={15} className={`shrink-0 text-muted-foreground transition-transform ${openFaq === index ? 'rotate-180' : ''}`} /></button>{openFaq === index && <p className="pb-4 text-[11px] leading-5 text-muted-foreground" data-testid={`text-help-faq-answer-${index}`}>{answer}</p>}</div>)}{visibleFaqs.length === 0 && <div className="py-10 text-center text-[10px] text-muted-foreground">No FAQ matches that search.</div>}</div></Panel></div>
    {drawerOpen && <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/60 p-0 backdrop-blur-sm sm:p-5" role="presentation" onClick={() => setDrawerOpen(false)}><aside className="glass h-[min(680px,94dvh)] w-full max-w-md overflow-y-auto rounded-t-2xl p-5 sm:rounded-2xl" role="dialog" aria-modal="true" aria-label="Quick start guide" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-primary">Quick start</div><h2 className="mt-2 text-lg font-extrabold">A safe first run.</h2></div><button type="button" onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-white/[.06]" aria-label="Close quick start" data-testid="button-close-help-drawer"><PanelRightClose size={17} /></button></div><div className="mt-6 space-y-4"><div className="rounded-xl border border-primary/20 bg-primary/[.06] p-4"><div className="flex items-center gap-2 text-primary"><Sparkles size={15} /><span className="text-[11px] font-bold">Use testnet first</span></div><p className="mt-2 text-[10px] leading-5 text-muted-foreground">Connect a dedicated Nightly testnet account, claim a small balance, preview a route, and verify every hash in Activity.</p></div>{helpSections.map((section, index) => <div key={section.id} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-md bg-white/[.06] font-mono text-[10px] text-muted-foreground">{index + 1}</span><div><div className="text-[11px] font-bold">{section.title}</div><div className="mt-1 text-[10px] leading-4 text-muted-foreground">{section.body}</div></div></div>)}</div></aside></div>}
  </div>;
}