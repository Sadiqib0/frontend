import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  createElection, startElection, endElection,
  nominateCandidate, getAuditLog,
} from '../api/admin';
import { getElectionStatus, getElectionStats, getElectionPositions, getCandidates } from '../api/elections';
import { useAdmin } from '../context/AdminContext';
import { saveElectionPositions } from '../context/AdminContext';
import { StatusBadge } from '../components/StatusBadge';
import { Toast } from '../components/Toast';

function Section({ title, children }) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
      {children}
    </div>
  );
}

const DEFAULT_POSITIONS = ['President', 'Vice President', 'Secretary', 'Treasurer'];

function ElectionControl({ status, token, onRefresh, setToast }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(new Set(DEFAULT_POSITIONS));
  const [loading, setLoading] = useState('');
  const [resetting, setResetting] = useState(false);

  const toggle = (pos) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(pos) ? next.delete(pos) : next.add(pos);
      return next;
    });

  const act = async (label, fn) => {
    setLoading(label);
    try {
      await fn();
      setToast({ message: `${label} successful`, type: 'success' });
      onRefresh();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading('');
    }
  };

  const handleCreate = () => {
    if (!name.trim()) { setToast({ message: 'Enter an election name', type: 'error' }); return; }
    const posList = DEFAULT_POSITIONS.filter(p => selected.has(p)).map(p => p.toUpperCase().replace(/ /g, '_'));
    if (!posList.length) { setToast({ message: 'Select at least one position', type: 'error' }); return; }
    act('Create election', async () => {
      await createElection(name.trim(), posList, token);
      saveElectionPositions(posList);
      setResetting(false);
    });
  };

  if (!status || status === 'NOT_CREATED' || status === 'ENDED') {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col gap-4">
        {status === 'ENDED'
          ? <p className="text-neutral-400 text-sm">The previous election has ended. Create a new one to get started.</p>
          : <p className="text-neutral-400 text-sm">No election exists yet. Create one to get started.</p>
        }
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Election Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. 2025 Student Union Election"
            className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-neutral-600"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Positions</label>
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_POSITIONS.map(pos => (
              <button
                key={pos}
                type="button"
                onClick={() => toggle(pos)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  selected.has(pos)
                    ? 'bg-blue-500/15 border-blue-500 text-blue-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected.has(pos) ? 'bg-blue-500 border-blue-500' : 'border-neutral-600'}`}>
                  {selected.has(pos) && <span className="text-white text-xs">✓</span>}
                </span>
                {pos}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={!!loading || selected.size === 0 || !name.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {loading === 'Create election' ? 'Creating…' : 'Create election'}
        </button>
      </div>
    );
  }

  if (resetting) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col gap-4">
        <p className="text-neutral-400 text-sm">Select positions for the new election.</p>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Election Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. 2025 Student Union Election"
            className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-neutral-600"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Positions</label>
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_POSITIONS.map(pos => (
              <button
                key={pos}
                type="button"
                onClick={() => toggle(pos)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  selected.has(pos)
                    ? 'bg-blue-500/15 border-blue-500 text-blue-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected.has(pos) ? 'bg-blue-500 border-blue-500' : 'border-neutral-600'}`}>
                  {selected.has(pos) && <span className="text-white text-xs">✓</span>}
                </span>
                {pos}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCreate}
            disabled={!!loading || selected.size === 0}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {loading === 'Create election' ? 'Creating…' : 'Create election'}
          </button>
          <button
            onClick={() => setResetting(false)}
            className="px-5 py-3 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex items-center justify-between gap-4">
      <StatusBadge status={status} />
      <div className="flex gap-3">
        {status === 'NOT_STARTED' && (
          <>
            <button
              onClick={() => setResetting(true)}
              disabled={!!loading}
              className="border border-neutral-700 text-neutral-400 hover:text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              Reset
            </button>
            <button
              onClick={() => act('Start election', () => startElection(token))}
              disabled={!!loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              {loading === 'Start election' ? 'Starting…' : 'Start election'}
            </button>
          </>
        )}
        {status === 'ONGOING' && (
          <button
            onClick={() => act('End election', () => endElection(token))}
            disabled={!!loading}
            className="bg-red-500/80 hover:bg-red-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            {loading === 'End election' ? 'Ending…' : 'End election'}
          </button>
        )}
      </div>
    </div>
  );
}

function NominateSection({ token, positions }) {
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [selectedPos, setSelectedPos] = useState('');

  const loadCandidates = useCallback(async (pos) => {
    if (!pos) return;
    try {
      const data = await getCandidates(pos);
      setCandidates(data);
    } catch {
      setCandidates([]);
    }
  }, []);

  useEffect(() => {
    if (positions?.length) {
      const first = positions[0];
      setSelectedPos(first);
      setPosition(first);
      loadCandidates(first);
    }
  }, [positions, loadCandidates]);

  const handleTabChange = (pos) => {
    setSelectedPos(pos);
    loadCandidates(pos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!fullName.trim() || !position) return;
    setLoading(true);
    try {
      const candidate = await nominateCandidate({ fullName: fullName.trim(), position }, token);
      setSuccess(`${candidate.fullName} nominated for ${candidate.position}.`);
      setFullName('');
      loadCandidates(position);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!positions?.length) return (
    <p className="text-neutral-500 text-sm">Create an election first to nominate candidates.</p>
  );

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col gap-4">
        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">{error}</p>}
        {success && <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 px-4 py-2.5 rounded-xl">{success}</p>}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Full Name</label>
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="e.g. John Doe"
            required
            className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Position</label>
          <div className="grid grid-cols-2 gap-2">
            {positions.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPosition(p)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  position === p
                    ? 'bg-blue-500/15 border-blue-500 text-blue-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                {p.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !fullName.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {loading ? 'Nominating…' : 'Nominate candidate'}
        </button>
      </form>

      <div>
        <div className="flex gap-2 mb-4 flex-wrap">
          {positions.map(pos => (
            <button
              key={pos}
              onClick={() => handleTabChange(pos)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                selectedPos === pos
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-neutral-700 text-neutral-400 hover:text-white'
              }`}
            >
              {pos.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        {candidates.length === 0 ? (
          <p className="text-neutral-600 text-sm">No candidates for {selectedPos?.replace(/_/g, ' ')} yet.</p>
        ) : (
          <div className="border border-neutral-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-4 py-3 text-neutral-500 font-semibold">#</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 text-neutral-500 font-semibold">Position</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => (
                  <tr key={c.id} className="border-b border-neutral-800/50 last:border-0">
                    <td className="px-4 py-3 text-neutral-500">{i + 1}</td>
                    <td className="px-4 py-3 text-white font-medium">{c.fullName}</td>
                    <td className="px-4 py-3 text-neutral-400">{c.position?.replace(/_/g, ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatsPanel({ stats }) {
  if (!stats) return null;
  const items = [
    { label: 'Total voters', value: stats.totalVoters },
    { label: 'Total voted', value: stats.totalVoted },
    { label: 'Turnout', value: `${stats.turnoutPercentage ?? 0}%` },
  ];
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map(({ label, value }) => (
        <div key={label} className="bg-neutral-900/60 border border-neutral-800 rounded-xl px-4 py-4 text-center">
          <p className="text-white text-2xl font-bold">{value}</p>
          <p className="text-neutral-500 text-xs mt-1">{label}</p>
        </div>
      ))}
      {stats.votesByPosition && Object.entries(stats.votesByPosition).map(([pos, count]) => (
        <div key={pos} className="bg-neutral-900/60 border border-neutral-800 rounded-xl px-4 py-4 text-center">
          <p className="text-white text-2xl font-bold">{count}</p>
          <p className="text-neutral-500 text-xs mt-1">{pos.replace(/_/g, ' ')}</p>
        </div>
      ))}
    </div>
  );
}


function AuditTable({ token }) {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const SIZE = 10;

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const data = await getAuditLog(p, SIZE, token);
      setLogs(data);
      setHasMore(data.length === SIZE);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(page); }, [page, load]);

  const grouped = logs.reduce((acc, log) => {
    const key = log.details?.split(' | ')[0] ?? 'Unknown Election';
    const date = log.timestamp ? new Date(log.timestamp).toLocaleDateString() : '—';
    const groupKey = `${key}__${date}`;
    if (!acc[groupKey]) acc[groupKey] = { name: key, date, entries: [] };
    acc[groupKey].entries.push(log);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <div className="border border-neutral-800 rounded-xl py-10 text-center text-neutral-600 text-sm">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="border border-neutral-800 rounded-xl py-10 text-center text-neutral-600 text-sm">
          No past elections yet.
        </div>
      ) : Object.values(grouped).map((group) => (
        <div key={group.name + group.date} className="border border-neutral-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between">
            <p className="text-white text-sm font-semibold">{group.name}</p>
            <p className="text-neutral-500 text-xs">{group.date}</p>
          </div>
          <div className="divide-y divide-neutral-800/50">
            {group.entries.map(log => {
              const resultPart = log.details?.split('| Results: ')[1] ?? 'No votes cast';
              const totalPart = log.details?.match(/Total votes: (\d+)/)?.[1] ?? '0';
              return (
                <div key={log.id} className="px-4 py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-neutral-300 text-sm font-medium">{log.position?.replace(/_/g, ' ')}</p>
                    <p className="text-neutral-500 text-xs mt-0.5">{resultPart}</p>
                  </div>
                  <span className="text-neutral-500 text-xs flex-shrink-0">{totalPart} votes</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          className="text-sm text-neutral-500 hover:text-neutral-300 disabled:opacity-30 transition-colors px-3 py-1.5 rounded-lg border border-neutral-800"
        >
          ← Previous
        </button>
        <span className="text-neutral-600 text-xs">Page {page + 1}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!hasMore || loading}
          className="text-sm text-neutral-500 hover:text-neutral-300 disabled:opacity-30 transition-colors px-3 py-1.5 rounded-lg border border-neutral-800"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [positions, setPositions] = useState([]);
  const [toast, setToast] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      const [s, st, pos] = await Promise.all([
        getElectionStatus().catch(() => null),
        getElectionStats().catch(() => null),
        getElectionPositions().catch(() => []),
      ]);
      setStatus(s);
      setStats(st);
      setPositions(pos ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-2 font-bold text-white text-lg">
          <span className="text-blue-500 text-xl">◆</span>
          Election App
          <span className="ml-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-neutral-500 text-sm">{admin?.username}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-2 py-1 rounded"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-10">Admin Dashboard</h1>

        <Section title="Election Control">
          <ElectionControl
            status={status}
            token={admin?.token}
            onRefresh={loadStatus}
            setToast={setToast}
          />
        </Section>

        {status === 'NOT_STARTED' && (
          <Section title="Nominate Candidates">
            <NominateSection token={admin?.token} positions={positions} />
          </Section>
        )}

        {(status === 'ONGOING' || status === 'ENDED') && (
          <Section title="Live Statistics">
            <StatsPanel stats={stats} />
          </Section>
        )}


        <Section title="Audit Log">
          <AuditTable token={admin?.token} />
        </Section>
      </main>
    </div>
  );
}
