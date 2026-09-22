import { useMemo, useState } from 'react';
import { useCreateNexusLaunch } from '@workspace/api-client-react';
import { useNightlyWallet } from '@/lib/nightly';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Coins,
  Droplets,
  FlaskConical,
  Grid3X3,
  Info,
  Layers3,
  LockKeyhole,
  Paintbrush,
  Pickaxe,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Ticket,
  TrendingUp,
  Trophy,
  Users,
  WalletCards,
  Zap,
} from 'lucide-react';

type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null;

const inputClass =
  'w-full rounded-xl border border-white/[.1] bg-[#10131d] px-3.5 py-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-primary/55 focus:ring-2 focus:ring-primary/10';
const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[11px] font-extrabold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(243,179,75,.16)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-none';
const ghostButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-white/[.1] px-4 py-3 text-[11px] font-bold text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/[.06] hover:text-primary disabled:cursor-not-allowed disabled:opacity-45';

function PageFrame({
  eyebrow,
  title,
  detail,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  icon: typeof Rocket;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-rise">
      <div className="mb-7 flex flex-col gap-5 border-b border-white/[.06] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-primary">
            <span className="h-px w-5 bg-primary" />
            {eyebrow}
          </div>
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-[-.06em] text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-[12px] leading-5 text-muted-foreground">{detail}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] px-3 py-2 font-mono text-[9px] uppercase tracking-[.12em] text-emerald-300">
          <Icon size={14} />
          Cookie Chain / creator desk
        </div>
      </div>
      {children}
    </div>
  );
}

function WalletNotice({ compact = false }: { compact?: boolean }) {
  const { address } = useNightlyWallet();
  if (address) {
    return (
      <div className={`flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] px-3 py-2 text-[10px] text-emerald-200 ${compact ? '' : 'mb-4'}`} data-testid="status-wallet-connected">
        <BadgeCheck size={14} />
        <span className="truncate">Signing account ready · {address.slice(0, 6)}…{address.slice(-4)}</span>
      </div>
    );
  }
  return (
    <div className={`flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[.055] px-3 py-2.5 text-[10px] leading-4 text-primary ${compact ? '' : 'mb-4'}`} data-testid="status-wallet-required">
      <WalletCards className="mt-0.5 shrink-0" size={14} />
      <span>Connect Nightly to enable this action. The final step still requires wallet approval and chain signing.</span>
    </div>
  );
}

function NoticeMessage({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const tone = notice.tone === 'error' ? 'border-red-300/25 bg-red-300/[.07] text-red-200' : notice.tone === 'info' ? 'border-sky-300/20 bg-sky-300/[.06] text-sky-200' : 'border-emerald-300/20 bg-emerald-300/[.06] text-emerald-200';
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[10px] leading-4 ${tone}`} data-testid={`status-${notice.tone}`}>
      {notice.tone === 'error' ? <CircleAlert size={14} className="mt-0.5 shrink-0" /> : <Check size={14} className="mt-0.5 shrink-0" />}
      <span>{notice.text}</span>
    </div>
  );
}

const launchSteps = [
  { label: 'Token', icon: Coins, caption: 'Identity & supply' },
  { label: 'Liquidity', icon: Droplets, caption: 'Opening pool' },
  { label: 'Review', icon: ShieldCheck, caption: 'Sign & deploy' },
];

export function TokenLaunchpadPage() {
  const { address } = useNightlyWallet();
  const launch = useCreateNexusLaunch();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', symbol: '', supply: '1000000', liquidity: '250', pair: 'COOK', creator: '' });
  const [notice, setNotice] = useState<Notice>(null);
  const [created, setCreated] = useState<{ status?: string; id?: string } | null>(null);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const stepValid = step === 0
    ? form.name.trim().length >= 2 && form.symbol.trim().length >= 2 && Number(form.supply) >= 1
    : step === 1
      ? Number(form.liquidity) > 0 && Boolean(form.pair)
      : Boolean(address);
  const next = () => {
    setNotice(null);
    if (step === 0 && !stepValid) return setNotice({ tone: 'error', text: 'Add a token name, ticker, and supply before continuing.' });
    if (step === 1 && !stepValid) return setNotice({ tone: 'error', text: 'Choose a liquidity pair and opening amount greater than zero.' });
    if (step < 2) setStep((current) => current + 1);
  };
  const submit = () => {
    if (!address) return setNotice({ tone: 'error', text: 'Connect Nightly before preparing a signed launch.' });
    if (form.creator.trim().length < 8) update('creator', address);
    launch.mutate(
      { data: { name: form.name.trim(), symbol: form.symbol.trim().toUpperCase(), supply: Number(form.supply), creator: form.creator.trim() || address } },
      {
        onSuccess: (result) => {
          setCreated(result as { status?: string; id?: string });
          setNotice({ tone: 'success', text: 'Launch draft created. Review metadata, then approve the deployment in Nightly.' });
        },
        onError: () => setNotice({ tone: 'error', text: 'The launch draft could not be prepared. Check the wallet and retry.' }),
      },
    );
  };
  return (
    <PageFrame eyebrow="Creator ecosystem / 01" title="Turn an idea into a live pool." detail="A guided SPL launch flow for creators who want supply, liquidity, and signing details in one deliberate sequence." icon={Rocket}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px]">
        <section className="glass rounded-2xl p-5 sm:p-7" data-testid="panel-launchpad-wizard">
          <WalletNotice />
          <div className="mb-8 grid grid-cols-3 gap-2">
            {launchSteps.map((item, index) => {
              const StepIcon = item.icon;
              return (
                <button key={item.label} type="button" onClick={() => index <= step && setStep(index)} className={`relative rounded-xl border p-3 text-left transition-colors ${index === step ? 'border-primary/40 bg-primary/[.1]' : index < step ? 'border-emerald-300/20 bg-emerald-300/[.045]' : 'border-white/[.07] bg-white/[.02]'}`} data-testid={`button-launch-step-${index}`}>
                  <div className={`flex items-center gap-2 text-[10px] font-bold ${index === step ? 'text-primary' : index < step ? 'text-emerald-300' : 'text-muted-foreground'}`}><StepIcon size={14} /><span>0{index + 1}</span></div>
                  <div className="mt-2 text-[11px] font-bold">{item.label}</div>
                  <div className="mt-0.5 hidden text-[9px] text-muted-foreground sm:block">{item.caption}</div>
                </button>
              );
            })}
          </div>
          {step === 0 && (
            <div className="animate-rise">
              <div className="mb-5"><div className="text-sm font-bold">Token identity</div><div className="mt-1 text-[10px] text-muted-foreground">Give the community a clear handle to rally around.</div></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2"><span className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">Token name</span><input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Night Oven" className={inputClass} data-testid="input-launch-name" /></label>
                <label className="space-y-2"><span className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">Ticker symbol</span><input value={form.symbol} onChange={(event) => update('symbol', event.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 8))} placeholder="e.g. OVEN" className={`${inputClass} uppercase`} data-testid="input-launch-symbol" /></label>
                <label className="space-y-2 sm:col-span-2"><span className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">Total supply</span><input type="number" min="1" value={form.supply} onChange={(event) => update('supply', event.target.value)} className={`${inputClass} font-mono`} data-testid="input-launch-supply" /><span className="block text-[10px] text-muted-foreground">Fixed supply minted at deployment. Use a whole number.</span></label>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="animate-rise">
              <div className="mb-5"><div className="text-sm font-bold">Opening liquidity</div><div className="mt-1 text-[10px] text-muted-foreground">Seed the first market so the community has somewhere to trade.</div></div>
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
                <label className="space-y-2"><span className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">Pair asset</span><select value={form.pair} onChange={(event) => update('pair', event.target.value)} className={inputClass} data-testid="select-launch-pair"><option value="COOK">COOK · ecosystem native</option><option value="USDC">USDC · stable quote</option><option value="SOL">SOL · native route</option></select></label>
                <label className="space-y-2"><span className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">Opening {form.pair}</span><input type="number" min="1" value={form.liquidity} onChange={(event) => update('liquidity', event.target.value)} className={`${inputClass} font-mono`} data-testid="input-launch-liquidity" /></label>
              </div>
              <div className="mt-5 rounded-xl border border-primary/15 bg-primary/[.05] p-4"><div className="flex gap-3"><Droplets size={16} className="mt-0.5 shrink-0 text-primary" /><div><div className="text-[11px] font-bold">Pool economics</div><p className="mt-1 text-[10px] leading-5 text-muted-foreground">Your token allocation and the selected quote asset are reserved for the initial pool. Exact network fees appear in Nightly before signing.</p></div></div></div>
            </div>
          )}
          {step === 2 && (
            <div className="animate-rise">
              <div className="mb-5"><div className="text-sm font-bold">Review and sign</div><div className="mt-1 text-[10px] text-muted-foreground">Your draft is ready for a final operator check.</div></div>
              <div className="divide-y divide-white/[.06] rounded-xl border border-white/[.08] bg-white/[.02]">
                {[['Token', `${form.name || 'Unnamed token'} · $${form.symbol.toUpperCase() || 'TICKER'}`], ['Supply', Number(form.supply || 0).toLocaleString()], ['Initial pool', `${form.liquidity || '0'} ${form.pair} + token allocation`], ['Creator', address ? `${address.slice(0, 7)}…${address.slice(-5)}` : 'Nightly account required']].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 px-4 py-3 text-[11px]"><span className="text-muted-foreground">{label}</span><span className="text-right font-semibold">{value}</span></div>)}
              </div>
              <div className="mt-4 flex gap-3 rounded-xl border border-emerald-300/20 bg-emerald-300/[.045] p-4"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-300" /><p className="text-[10px] leading-5 text-muted-foreground">Creating a draft does not move funds. Deployment and liquidity funding require explicit approval from the connected Nightly wallet.</p></div>
            </div>
          )}
          <NoticeMessage notice={notice} />
          <div className="mt-7 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || launch.isPending} className={ghostButtonClass} data-testid="button-launch-back"><ChevronLeft size={14} />Back</button>
            {step < 2 ? <button type="button" onClick={next} className={buttonClass} data-testid="button-launch-next">Continue <ChevronRight size={14} /></button> : <button type="button" onClick={submit} disabled={!address || launch.isPending} className={buttonClass} data-testid="button-launch-submit">{launch.isPending ? 'Preparing draft…' : created ? 'Draft prepared' : 'Prepare signed launch'} <Rocket size={14} /></button>}
          </div>
        </section>
        <aside className="space-y-4">
          <section className="glass rounded-2xl p-5" data-testid="card-launch-preview">
            <div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Launch preview</span><span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-[9px] text-primary">SPL TOKEN</span></div>
            <div className="mt-5 rounded-2xl border border-white/[.08] bg-gradient-to-br from-[#302638] to-[#12151e] p-5">
              <div className="flex items-center gap-3"><div className="grid size-12 place-items-center rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground">{form.symbol.slice(0, 1).toUpperCase() || '?'}</div><div><div className="text-sm font-bold">{form.name || 'Your token name'}</div><div className="mt-1 font-mono text-[10px] text-primary">${form.symbol.toUpperCase() || 'TICKER'}</div></div></div>
              <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/[.08] pt-4"><div><div className="font-mono text-[9px] text-muted-foreground">SUPPLY</div><div className="mt-1 text-xs font-bold" data-testid="text-launch-preview-supply">{Number(form.supply || 0).toLocaleString()}</div></div><div><div className="font-mono text-[9px] text-muted-foreground">POOL</div><div className="mt-1 text-xs font-bold" data-testid="text-launch-preview-pool">{form.liquidity || '0'} {form.pair}</div></div></div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground"><FlaskConical size={14} className="text-primary" /> Testnet-safe draft environment</div>
          </section>
          <section className="glass rounded-2xl p-5"><div className="flex items-center gap-2 text-emerald-300"><Layers3 size={15} /><span className="text-xs font-bold">Deployment checklist</span></div><div className="mt-4 space-y-3 text-[10px] text-muted-foreground"><div className="flex items-center justify-between"><span>Token metadata</span><Check size={13} className="text-emerald-300" /></div><div className="flex items-center justify-between"><span>Pool route</span><span className="text-primary">Review</span></div><div className="flex items-center justify-between"><span>Wallet signature</span><span>{address ? 'Ready' : 'Waiting'}</span></div></div></section>
          {created && <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[.06] p-5" data-testid="status-launch-created"><div className="flex items-center gap-2 text-emerald-300"><BadgeCheck size={16} /><span className="text-xs font-bold">Draft queued</span></div><div className="mt-2 font-mono text-[10px] text-muted-foreground">Reference {created.id || 'pending-index'}</div></div>}
        </aside>
      </div>
    </PageFrame>
  );
}

const creators = [
  { id: 'mara', name: 'Mara Vale', handle: '@maravale', role: 'Illustrator collective', color: '#e98b63', raised: 18420, goal: 24000 },
  { id: 'orbit', name: 'Orbit Works', handle: '@orbitworks', role: 'Builder studio', color: '#6bd4b0', raised: 9310, goal: 12000 },
  { id: 'crumb', name: 'Crumb Radio', handle: '@crumbradio', role: 'Community broadcast', color: '#8aa0ff', raised: 6880, goal: 10000 },
];

export function CookieJarPage() {
  const { address } = useNightlyWallet();
  const [creatorId, setCreatorId] = useState(creators[0].id);
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);
  const selected = creators.find((creator) => creator.id === creatorId) || creators[0];
  const contribute = () => {
    const value = Number(amount);
    if (!address) return setNotice({ tone: 'error', text: 'Connect Nightly to prepare a contribution.' });
    if (!value || value <= 0) return setNotice({ tone: 'error', text: 'Enter a contribution greater than zero.' });
    setPending(true);
    setNotice({ tone: 'info', text: 'Contribution prepared. Confirm the transfer in Nightly to finish.' });
    window.setTimeout(() => { setPending(false); setAmount(''); setNotice({ tone: 'success', text: `Your ${value.toLocaleString()} COOK contribution is ready for wallet approval.` }); }, 900);
  };
  return (
    <PageFrame eyebrow="Creator ecosystem / 02" title="Put a little more in the jar." detail="Back the people making Cookie Chain feel alive. Every contribution is a wallet-aware intent, ready for your approval." icon={WalletCards}>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <section className="glass overflow-hidden rounded-2xl" data-testid="panel-cookie-jar">
          <div className="border-b border-white/[.06] p-5 sm:p-7"><WalletNotice /><div className="flex items-start justify-between gap-4"><div><div className="text-sm font-bold">Choose a creator</div><div className="mt-1 text-[10px] text-muted-foreground">Your support lands in their community vault.</div></div><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Trophy size={18} /></div></div></div>
          <div className="divide-y divide-white/[.06]">
            {creators.map((creator) => <button type="button" key={creator.id} onClick={() => { setCreatorId(creator.id); setNotice(null); }} className={`flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/[.035] ${creator.id === creatorId ? 'bg-primary/[.055]' : ''}`} data-testid={`button-select-creator-${creator.id}`}><div className="grid size-10 shrink-0 place-items-center rounded-xl font-extrabold" style={{ backgroundColor: `${creator.color}22`, color: creator.color }}>{creator.name.slice(0, 1)}</div><div className="min-w-0 flex-1"><div className="text-xs font-bold">{creator.name}</div><div className="mt-1 text-[10px] text-muted-foreground">{creator.handle} · {creator.role}</div><div className="mt-2 h-1.5 max-w-[230px] overflow-hidden rounded-full bg-white/[.07]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, creator.raised / creator.goal * 100)}%`, backgroundColor: creator.color }} /></div></div><div className="text-right">{creator.id === creatorId ? <Check size={16} className="ml-auto text-primary" /> : <Plus size={16} className="ml-auto text-muted-foreground" />}<div className="mt-2 font-mono text-[9px] text-muted-foreground">${creator.raised.toLocaleString()} raised</div></div></button>)}
          </div>
          <div className="border-t border-white/[.06] p-5 sm:p-7"><div className="mb-4 flex items-center justify-between"><div className="text-sm font-bold">Your contribution</div><span className="font-mono text-[9px] uppercase tracking-[.12em] text-primary">COOK vault</span></div><div className="relative"><input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className={`${inputClass} pr-20 text-lg font-extrabold`} data-testid="input-jar-amount" /><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-primary">COOK</span></div><div className="mt-3 flex gap-2">{['25', '100', '500'].map((value) => <button type="button" key={value} onClick={() => setAmount(value)} className="rounded-lg border border-white/[.08] px-3 py-2 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary" data-testid={`button-jar-amount-${value}`}>{value} COOK</button>)}</div><button type="button" onClick={contribute} disabled={pending || !address} className={`${buttonClass} mt-5 w-full`} data-testid="button-jar-contribute">{pending ? 'Preparing contribution…' : 'Prepare contribution'} <ArrowRight size={14} /></button><div className="mt-3"><NoticeMessage notice={notice} /></div></div>
        </section>
        <aside className="space-y-4">
          <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[.18] via-primary/[.07] to-transparent p-6" data-testid="card-jar-selected"><div className="pointer-events-none absolute -right-10 -top-14 size-48 rounded-full border border-primary/15" /><div className="relative"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.15em] text-primary"><Sparkles size={14} />Selected vault</div><div className="mt-6 flex items-center gap-3"><div className="grid size-14 place-items-center rounded-2xl text-xl font-extrabold" style={{ backgroundColor: `${selected.color}28`, color: selected.color }}>{selected.name.slice(0, 1)}</div><div><div className="text-lg font-extrabold">{selected.name}</div><div className="mt-1 text-[10px] text-muted-foreground">{selected.handle}</div></div></div><div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/[.1] pt-4"><div><div className="font-mono text-[9px] text-muted-foreground">RAISED</div><div className="mt-1 text-lg font-extrabold">${selected.raised.toLocaleString()}</div></div><div><div className="font-mono text-[9px] text-muted-foreground">GOAL</div><div className="mt-1 text-lg font-extrabold">${selected.goal.toLocaleString()}</div></div></div></div></section>
          <section className="glass rounded-2xl p-5"><div className="flex items-center gap-2 text-muted-foreground"><Info size={15} /><span className="text-xs font-bold">How the jar works</span></div><div className="mt-4 space-y-4 text-[10px] leading-5 text-muted-foreground"><div className="flex gap-3"><span className="grid size-5 shrink-0 place-items-center rounded-md bg-primary/10 font-mono text-[9px] text-primary">01</span><span>Pick a creator and choose your COOK amount.</span></div><div className="flex gap-3"><span className="grid size-5 shrink-0 place-items-center rounded-md bg-primary/10 font-mono text-[9px] text-primary">02</span><span>Review the recipient and network fee in Nightly.</span></div><div className="flex gap-3"><span className="grid size-5 shrink-0 place-items-center rounded-md bg-primary/10 font-mono text-[9px] text-primary">03</span><span>Approve the signed transfer. No contribution moves automatically.</span></div></div></section>
          <div className="flex items-center gap-2 rounded-xl border border-white/[.07] px-3 py-2.5 text-[10px] text-muted-foreground"><LockKeyhole size={14} className="text-emerald-300" /> Non-custodial creator vaults</div>
        </aside>
      </div>
    </PageFrame>
  );
}

const canvasPalette = ['#f3b34b', '#e98b63', '#e4e7f2', '#6bd4b0', '#8aa0ff', '#b98be8', '#263044', '#151923'];
const initialPixels: string[] = Array.from({ length: 144 }, (_, index) => (index % 23 === 0 ? '#f3b34b' : index % 17 === 0 ? '#6bd4b0' : index % 29 === 0 ? '#8aa0ff' : '#151923'));

export function PixelCanvasPage() {
  const { address } = useNightlyWallet();
  const [pixels, setPixels] = useState(initialPixels);
  const [color, setColor] = useState(canvasPalette[0]);
  const [selectedPixel, setSelectedPixel] = useState<number | null>(null);
  const [painted, setPainted] = useState(0);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const selectPixel = (index: number) => { setSelectedPixel(index); setPixels((current) => current.map((pixel, pixelIndex) => pixelIndex === index ? color : pixel)); };
  const paint = () => {
    if (!address) return setNotice({ tone: 'error', text: 'Connect Nightly before submitting a canvas edit.' });
    if (selectedPixel === null) return setNotice({ tone: 'error', text: 'Select a pixel on the board first.' });
    setPending(true); setNotice({ tone: 'info', text: 'Canvas edit prepared. Confirm the micro-transaction in Nightly.' });
    window.setTimeout(() => { setPending(false); setPainted((value) => value + 1); setNotice({ tone: 'success', text: 'Pixel edit is ready for wallet approval.' }); }, 700);
  };
  const activeCount = useMemo(() => pixels.filter((pixel) => pixel !== '#151923').length, [pixels]);
  return (
    <PageFrame eyebrow="Creator ecosystem / 03" title="Leave a mark on the commons." detail="A shared 12 × 12 canvas for the Cookie Chain community. Paint locally, then submit the edit as a wallet-aware action." icon={Grid3X3}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="glass rounded-2xl p-4 sm:p-7" data-testid="panel-pixel-canvas">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-sm font-bold"><Paintbrush size={16} className="text-primary" />Community canvas</div><div className="mt-1 text-[10px] text-muted-foreground">Each edit is reserved locally until you submit it.</div></div><div className="flex items-center gap-3 font-mono text-[9px] text-muted-foreground"><span data-testid="text-canvas-active-count">{activeCount}/144 painted</span><span className="size-1 rounded-full bg-emerald-300" />LIVE BOARD</div></div>
          <div className="mx-auto grid max-w-[560px] grid-cols-12 gap-1 rounded-2xl border border-white/[.08] bg-[#0a0c12] p-2 shadow-[inset_0_0_50px_rgba(0,0,0,.35)] sm:gap-1.5 sm:p-3" data-testid="grid-pixel-canvas">{pixels.map((pixel, index) => <button type="button" key={index} aria-label={`Paint pixel ${index + 1}`} onClick={() => selectPixel(index)} className={`aspect-square rounded-[3px] border transition-transform hover:z-10 hover:scale-125 ${selectedPixel === index ? 'border-primary ring-2 ring-primary/60' : 'border-white/[.035]'}`} style={{ backgroundColor: pixel }} data-testid={`button-pixel-${index}`} />)}</div>
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/[.06] pt-5"><span className="mr-1 font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Palette</span>{canvasPalette.map((paletteColor, index) => <button type="button" key={paletteColor} onClick={() => setColor(paletteColor)} aria-label={`Choose palette color ${index + 1}`} className={`size-7 rounded-lg border transition-transform hover:scale-110 ${color === paletteColor ? 'border-primary ring-2 ring-primary/30' : 'border-white/[.12]'}`} style={{ backgroundColor: paletteColor }} data-testid={`button-palette-${index}`} />)}</div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-[10px] text-muted-foreground"><span className="size-3 rounded-sm border border-primary/50" style={{ backgroundColor: color }} />Selected color · {selectedPixel === null ? 'choose a pixel' : `pixel ${selectedPixel + 1}`}</div><button type="button" onClick={paint} disabled={pending || !address} className={buttonClass} data-testid="button-canvas-paint">{pending ? 'Preparing edit…' : 'Submit paint edit'} <Zap size={14} /></button></div>
          <div className="mt-3"><WalletNotice compact /><NoticeMessage notice={notice} /></div>
        </section>
        <aside className="space-y-4">
          <section className="glass rounded-2xl p-5"><div className="flex items-center gap-2 text-primary"><Users size={15} /><span className="text-xs font-bold">Canvas activity</span></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/[.07] bg-white/[.025] p-3"><div className="font-mono text-[9px] text-muted-foreground">ARTISTS ONLINE</div><div className="mt-2 text-xl font-extrabold" data-testid="text-canvas-artists">18</div></div><div className="rounded-xl border border-white/[.07] bg-white/[.025] p-3"><div className="font-mono text-[9px] text-muted-foreground">YOUR EDITS</div><div className="mt-2 text-xl font-extrabold text-primary" data-testid="text-canvas-edits">{painted}</div></div></div><div className="mt-5 space-y-3 text-[10px]"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-300" /><span className="text-muted-foreground">mara.vale</span><span className="ml-auto font-mono text-muted-foreground">2 px · now</span></div><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" /><span className="text-muted-foreground">orbit.works</span><span className="ml-auto font-mono text-muted-foreground">5 px · 1m</span></div><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-sky-300" /><span className="text-muted-foreground">crumb.radio</span><span className="ml-auto font-mono text-muted-foreground">1 px · 4m</span></div></div></section>
          <section className="rounded-2xl border border-primary/20 bg-primary/[.055] p-5"><div className="flex items-center gap-2 text-primary"><Pickaxe size={15} /><span className="text-xs font-bold">Paint with purpose</span></div><p className="mt-3 text-[10px] leading-5 text-muted-foreground">Canvas edits use a tiny network fee to prevent spam. Your wallet shows the exact amount before you sign.</p><div className="mt-4 flex items-center gap-2 font-mono text-[9px] text-primary"><Ticket size={13} /> 0.002 COOK per edit</div></section>
        </aside>
      </div>
    </PageFrame>
  );
}

const markets = [
  { id: 'cook-price', title: 'COOK closes above $0.10', detail: 'by the end of this week', yes: 64, volume: 12840, icon: TrendingUp },
  { id: 'canvas-count', title: 'Canvas reaches 1,000 painted cells', detail: 'before the next epoch', yes: 41, volume: 6840, icon: Grid3X3 },
  { id: 'jar-goal', title: 'Mara Vale reaches her vault goal', detail: 'within 30 days', yes: 72, volume: 4920, icon: Trophy },
];

export function PredictionHubPage() {
  const { address } = useNightlyWallet();
  const [marketId, setMarketId] = useState(markets[0].id);
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState('50');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const selectedMarket = markets.find((market) => market.id === marketId) || markets[0];
  const probability = side === 'YES' ? selectedMarket.yes : 100 - selectedMarket.yes;
  const potential = Number(amount) > 0 ? (Number(amount) * (100 / probability)).toFixed(2) : '0.00';
  const submit = () => {
    if (!address) return setNotice({ tone: 'error', text: 'Connect Nightly to place a prediction.' });
    if (!Number(amount) || Number(amount) <= 0) return setNotice({ tone: 'error', text: 'Enter a stake greater than zero.' });
    setPending(true); setNotice({ tone: 'info', text: 'Bet slip prepared. Nightly will show the final transaction before signing.' });
    window.setTimeout(() => { setPending(false); setNotice({ tone: 'success', text: 'Prediction is ready for wallet approval.' }); }, 850);
  };
  return (
    <PageFrame eyebrow="Creator ecosystem / 04" title="Make your read of the chain." detail="Playful, transparent markets for the signals creators actually watch. Pick a side, set your stake, and keep custody until you sign." icon={Target}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4" data-testid="panel-prediction-markets">
          <WalletNotice />
          {markets.map((market) => { const MarketIcon = market.icon; const active = market.id === marketId; return <button type="button" key={market.id} onClick={() => { setMarketId(market.id); setNotice(null); }} className={`glass block w-full rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 ${active ? 'border-primary/35 bg-primary/[.055]' : ''}`} data-testid={`button-market-${market.id}`}><div className="flex items-start gap-4"><div className={`grid size-10 shrink-0 place-items-center rounded-xl ${active ? 'bg-primary/15 text-primary' : 'bg-white/[.05] text-muted-foreground'}`}><MarketIcon size={18} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-sm font-bold">{market.title}</div><div className="mt-1 text-[10px] text-muted-foreground">{market.detail}</div></div><div className="font-mono text-[9px] text-muted-foreground">${market.volume.toLocaleString()} vol</div></div><div className="mt-5 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-red-300/15"><div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${market.yes}%` }} /></div><span className="font-mono text-[10px] font-bold text-emerald-300">{market.yes}% YES</span></div></div></div></button>; })}
          <div className="flex items-center gap-2 rounded-xl border border-white/[.07] px-3 py-2.5 text-[10px] text-muted-foreground"><Info size={14} className="text-primary" /> Market odds update as the community takes a side.</div>
        </section>
        <aside className="glass h-fit rounded-2xl p-5 sm:p-6" data-testid="panel-betting-slip">
          <div className="flex items-center justify-between"><div><div className="font-mono text-[9px] uppercase tracking-[.16em] text-primary">Betting slip</div><div className="mt-2 text-lg font-extrabold">Your call</div></div><div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Target size={17} /></div></div>
          <div className="mt-5 rounded-xl border border-white/[.08] bg-white/[.025] p-3"><div className="text-[11px] font-bold leading-5">{selectedMarket.title}</div><div className="mt-1 text-[10px] text-muted-foreground">{selectedMarket.detail}</div></div>
          <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setSide('YES')} className={`rounded-xl border px-3 py-3 text-left transition-colors ${side === 'YES' ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-200' : 'border-white/[.08] text-muted-foreground hover:border-emerald-300/25'}`} data-testid="button-prediction-yes"><div className="font-mono text-[9px] uppercase">I say</div><div className="mt-1 text-sm font-extrabold">YES</div><div className="mt-1 font-mono text-[9px]">{selectedMarket.yes}% odds</div></button><button type="button" onClick={() => setSide('NO')} className={`rounded-xl border px-3 py-3 text-left transition-colors ${side === 'NO' ? 'border-red-300/40 bg-red-300/10 text-red-200' : 'border-white/[.08] text-muted-foreground hover:border-red-300/25'}`} data-testid="button-prediction-no"><div className="font-mono text-[9px] uppercase">I say</div><div className="mt-1 text-sm font-extrabold">NO</div><div className="mt-1 font-mono text-[9px]">{100 - selectedMarket.yes}% odds</div></button></div>
          <label className="mt-5 block space-y-2"><span className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">Stake amount</span><div className="relative"><input type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} className={`${inputClass} pr-20 font-mono`} data-testid="input-prediction-amount" /><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-primary">COOK</span></div></label>
          <div className="mt-5 space-y-3 border-t border-white/[.07] pt-4 text-[10px]"><div className="flex justify-between text-muted-foreground"><span>Selected side</span><span className={`font-bold ${side === 'YES' ? 'text-emerald-300' : 'text-red-300'}`}>{side}</span></div><div className="flex justify-between text-muted-foreground"><span>Implied odds</span><span className="font-mono text-foreground">{probability}%</span></div><div className="flex justify-between font-bold"><span>Potential return</span><span className="font-mono text-primary" data-testid="text-prediction-return">{potential} COOK</span></div></div>
          <button type="button" onClick={submit} disabled={pending || !address} className={`${buttonClass} mt-5 w-full`} data-testid="button-prediction-submit">{pending ? 'Preparing bet…' : 'Prepare prediction'} <ArrowRight size={14} /></button>
          <div className="mt-3"><NoticeMessage notice={notice} /></div>
          <div className="mt-4 flex items-center gap-2 text-[9px] leading-4 text-muted-foreground"><ShieldCheck size={13} className="shrink-0 text-emerald-300" /> Funds remain in your wallet until you review and sign.</div>
        </aside>
      </div>
    </PageFrame>
  );
}