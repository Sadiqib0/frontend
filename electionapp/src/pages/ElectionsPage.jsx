import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getElectionStatus, getElectionPositions, getElectionStats, getResults, verifyVote, positionLabel } from '../api/elections';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';

function ElectionCard({ title, subtitle, meta, to }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-5 py-4 bg-neutral-900/60 border border-neutral-800 rounded-xl hover:bg-neutral-800/60 transition-colors"
    >
      <div>
        <p className="font-semibold text-white text-sm">{title}</p>
        <p className="text-neutral-500 text-xs mt-0.5">{subtitle}</p>
        {meta && <p className="text-neutral-600 text-xs mt-0.5">{meta}</p>}
      </div>
      <svg className="w-5 h-5 text-neutral-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function VerifySection() {
  const [receipt, setReceipt] = useState('');
  const [status, setStatus] = useState(null);
  const [info, setInfo] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!receipt.trim()) return;
    setStatus('loading');
    setInfo(null);
    try {
      const data = await verifyVote(receipt.trim());
      setInfo(data);
      setStatus('valid');
    } catch {
      setStatus('invalid');
    }
  };

  return (
    <div className="mt-10 border-t border-neutral-800 pt-8">
      <h2 className="text-base font-bold text-white mb-1">Verify your vote</h2>
      <p className="text-neutral-500 text-xs mb-4">Enter the receipt code you received after voting to confirm it was recorded.</p>

      <form onSubmit={handleVerify} className="flex gap-2">
        <input
          value={receipt}
          onChange={e => { setReceipt(e.target.value); setStatus(null); setInfo(null); }}
          placeholder="Paste your receipt code…"
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
        />
        <button
          type="submit"
          disabled={!receipt.trim() || status === 'loading'}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm flex-shrink-0"
        >
          {status === 'loading' ? 'Checking…' : 'Verify'}
        </button>
      </form>

      {status === 'valid' && info && (
        <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <p className="text-green-400 font-semibold text-sm">Vote verified — this receipt is legitimate</p>
          </div>
          <p className="text-neutral-400 text-xs mt-1">Position: {info.position?.replace(/_/g, ' ')}</p>
          {info.timestamp && (
            <p className="text-neutral-500 text-xs">Cast at: {new Date(info.timestamp).toLocaleString()}</p>
          )}
          <p className="text-neutral-600 text-xs mt-1 font-mono break-all">Receipt: {receipt}</p>
        </div>
      )}

      {status === 'invalid' && (
        <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
          <p className="text-red-400 font-semibold text-sm">Receipt not found</p>
          <p className="text-neutral-500 text-xs mt-0.5">No vote was found for this receipt. Check the code and try again.</p>
        </div>
      )}
    </div>
  );
}

function StatsBar({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[
        { label: 'Total voters', value: stats.totalVoters },
        { label: 'Voted', value: stats.totalVoted },
        { label: 'Turnout', value: `${stats.turnoutPercentage ?? 0}%` },
      ].map(({ label, value }) => (
        <div key={label} className="bg-neutral-900/60 border border-neutral-800 rounded-xl px-4 py-3 text-center">
          <p className="text-white text-xl font-bold">{value}</p>
          <p className="text-neutral-500 text-xs mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function ElectionsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [results, setResults] = useState({});
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, st, pos] = await Promise.all([
          getElectionStatus(),
          getElectionStats().catch(() => null),
          getElectionPositions().catch(() => []),
        ]);
        setStatus(s);
        setStats(st);
        setPositions(pos ?? []);

        if (s === 'ENDED' && pos?.length) {
          const posResults = await Promise.all(pos.map(p => getResults(p).catch(() => null)));
          const map = {};
          pos.forEach((p, i) => { map[p] = posResults[i]; });
          setResults(map);
        }
      } catch {

      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const votedSet = new Set(user?.votedPositions ?? []);

  const subtitle = (pos) => {
    if (status === 'ONGOING') return votedSet.has(pos) ? 'You voted' : "You haven't voted";
    if (status === 'ENDED') return 'View results';
    return 'Nominations open — voting not started yet';
  };

  const meta = (pos) => {
    if (status === 'ENDED') {
      const r = results[pos];
      if (!r) return null;
      if (r.tied) return `Tie · ${r.totalVotesCast} votes`;
      if (r.winnerName) return `Winner: ${r.winnerName} · ${r.totalVotesCast} votes`;
    }
    if (status === 'ONGOING') {
      const count = stats?.votesByPosition?.[pos];
      if (count != null) return `${count} vote${count !== 1 ? 's' : ''} cast`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Elections</h1>
        </div>

        {(status === 'ONGOING' || status === 'ENDED') && <StatsBar stats={stats} />}

        {status && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={status} />
              <div className="flex-1 h-px bg-neutral-800" />
            </div>
            {positions.map((pos) => (
              <ElectionCard
                key={pos}
                title={positionLabel(pos)}
                subtitle={subtitle(pos)}
                meta={meta(pos)}
                to={`/elections/${pos.toLowerCase()}`}
              />
            ))}
          </div>
        )}

        {!status && (
          <div className="text-center py-20 text-neutral-600">
            <p className="text-lg">No election found.</p>
            <p className="text-sm mt-1">An admin needs to create one first.</p>
          </div>
        )}

        {status && positions.length === 0 && (
          <div className="text-center py-20 text-neutral-600">
            <p className="text-lg">Positions not configured.</p>
            <p className="text-sm mt-1">Contact the admin.</p>
          </div>
        )}

        <VerifySection />
      </main>
    </div>
  );
}
