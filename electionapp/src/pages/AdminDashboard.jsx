import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createElection, startElection, endElection,
  nominateCandidate, getAuditLog,
} from '../api/admin';
import {
  getElectionStatus, getElectionStats, getElectionPositions,
  getCandidates, getResults, positionLabel,
} from '../api/elections';
import { useAdmin, saveElectionPositions } from '../context/AdminContext';
import { StatusBadge } from '../components/StatusBadge';
import { Toast } from '../components/Toast';
import { Logo } from '../components/Logo';

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 4a2 2 0 100-4 2 2 0 000 4zM3 20a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className={`rounded-xl border px-5 py-4 flex flex-col gap-1 ${accent ? 'bg-blue-500/10 border-blue-500/30' : 'bg-neutral-900/60 border-neutral-800'}`}>
      <p className="text-neutral-500 text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-blue-400' : 'text-white'}`}>{value ?? '—'}</p>
      {sub && <p className="text-neutral-600 text-xs">{sub}</p>}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ status, stats, positions, token, onRefresh, setToast, setTab }) {
  const [loading, setLoading] = useState('');

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

  const turnout = stats?.turnoutPercentage ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Overview</h2>
        <p className="text-neutral-500 text-sm">Election system at a glance</p>
      </div>

      {/* Status banner */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-neutral-500 text-sm">Current status</span>
          <StatusBadge status={status ?? 'NOT_CREATED'} />
        </div>
        <div className="flex gap-3">
          {status === 'NOT_STARTED' && (
            <button
              onClick={() => act('Start election', () => startElection(token))}
              disabled={!!loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              {loading === 'Start election' ? 'Starting…' : 'Start election'}
            </button>
          )}
          {status === 'ONGOING' && (
            <button
              onClick={() => act('End election', () => endElection(token))}
              disabled={!!loading}
              className="bg-red-500/80 hover:bg-red-600 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              {loading === 'End election' ? 'Ending…' : 'End election'}
            </button>
          )}
          {(!status || status === 'NOT_CREATED' || status === 'ENDED') && (
            <button
              onClick={() => setTab('elections')}
              className="border border-neutral-700 text-neutral-400 hover:text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Create election
            </button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Voters" value={stats?.totalVoters ?? 0} />
        <StatCard label="Votes Cast" value={stats?.totalVoted ?? 0} />
        <StatCard label="Turnout" value={`${turnout}%`} accent />
        <StatCard label="Positions" value={positions?.length ?? 0} sub="in this election" />
      </div>

      {/* Turnout progress bar */}
      {stats && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Voter Turnout</p>
            <p className="text-sm text-blue-400 font-bold">{turnout}%</p>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(turnout, 100)}%` }}
            />
          </div>
          <p className="text-neutral-600 text-xs mt-2">{stats.totalVoted} of {stats.totalVoters} registered voters</p>
        </div>
      )}

      {/* Votes by position */}
      {stats?.votesByPosition && Object.keys(stats.votesByPosition).length > 0 && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-800">
            <p className="text-sm font-semibold text-white">Votes by Position</p>
          </div>
          <div className="divide-y divide-neutral-800/50">
            {Object.entries(stats.votesByPosition).map(([pos, count]) => {
              const pct = stats.totalVoters > 0 ? Math.round((count / stats.totalVoters) * 100) : 0;
              return (
                <div key={pos} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-neutral-300">{positionLabel(pos)}</span>
                    <span className="text-sm text-neutral-400">{count} votes</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500/70 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Elections Tab ─────────────────────────────────────────────────────────────

const DEFAULT_POSITIONS = ['President', 'Vice President', 'Secretary', 'Treasurer'];

function ElectionsTab({ status, token, onRefresh, setToast }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(new Set(DEFAULT_POSITIONS));
  const [loading, setLoading] = useState('');

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
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Election Management</h2>
        <p className="text-neutral-500 text-sm">Create, start, and end elections</p>
      </div>

      {/* Current status card */}
      {status && status !== 'NOT_CREATED' && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-neutral-500 text-sm">Status</span>
            <StatusBadge status={status} />
          </div>
          <div className="flex gap-3">
            {status === 'NOT_STARTED' && (
              <button
                onClick={() => act('Start election', () => startElection(token))}
                disabled={!!loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-xl text-sm"
              >
                {loading === 'Start election' ? 'Starting…' : 'Start election'}
              </button>
            )}
            {status === 'ONGOING' && (
              <button
                onClick={() => act('End election', () => endElection(token))}
                disabled={!!loading}
                className="bg-red-500/80 hover:bg-red-600 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-xl text-sm"
              >
                {loading === 'End election' ? 'Ending…' : 'End election'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create election form */}
      {(!status || status === 'NOT_CREATED' || status === 'ENDED') && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col gap-5">
          <p className="text-sm text-neutral-400">
            {status === 'ENDED' ? 'Previous election ended. Create a new one.' : 'No election yet. Set one up below.'}
          </p>

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
                    {selected.has(pos) && <span className="text-white text-xs leading-none">✓</span>}
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
      )}
    </div>
  );
}

// ── Candidates Tab ────────────────────────────────────────────────────────────

function CandidatesTab({ token, positions, status }) {
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
      setSuccess(`${candidate.fullName} nominated for ${positionLabel(candidate.position)}.`);
      setFullName('');
      loadCandidates(position);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!positions?.length) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Candidates</h2>
          <p className="text-neutral-500 text-sm">Manage candidates for each position</p>
        </div>
        <div className="border border-neutral-800 rounded-xl py-12 text-center text-neutral-500 text-sm">
          Create an election first to manage candidates.
        </div>
      </div>
    );
  }

  const canNominate = status === 'NOT_STARTED';

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Candidates</h2>
        <p className="text-neutral-500 text-sm">Nominate and view candidates for each position</p>
      </div>

      {canNominate && (
        <form onSubmit={handleSubmit} className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col gap-4">
          <p className="text-sm font-semibold text-white">Nominate a Candidate</p>
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
                  {positionLabel(p)}
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
      )}

      {!canNominate && (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl px-5 py-3 text-neutral-500 text-sm">
          {status === 'ONGOING' ? 'Election is ongoing — nominations are closed.' : 'Nominations are closed.'}
        </div>
      )}

      {/* Candidate list by position */}
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
              {positionLabel(pos)}
            </button>
          ))}
        </div>

        {candidates.length === 0 ? (
          <div className="border border-neutral-800 rounded-xl py-10 text-center text-neutral-600 text-sm">
            No candidates for {positionLabel(selectedPos)} yet.
          </div>
        ) : (
          <div className="border border-neutral-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/40">
                  <th className="text-left px-5 py-3 text-neutral-500 font-semibold">#</th>
                  <th className="text-left px-5 py-3 text-neutral-500 font-semibold">Name</th>
                  <th className="text-left px-5 py-3 text-neutral-500 font-semibold">Position</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => (
                  <tr key={c.id} className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/20 transition-colors">
                    <td className="px-5 py-3 text-neutral-500">{i + 1}</td>
                    <td className="px-5 py-3 text-white font-medium">{c.fullName}</td>
                    <td className="px-5 py-3 text-neutral-400">{positionLabel(c.position)}</td>
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

// ── Results Tab ───────────────────────────────────────────────────────────────

function ResultsTab({ positions, status }) {
  const [results, setResults] = useState({});
  const [selectedPos, setSelectedPos] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!positions?.length || status !== 'ENDED') return;
    setLoading(true);
    Promise.all(positions.map(p => getResults(p).catch(() => null)))
      .then(all => {
        const map = {};
        positions.forEach((p, i) => { map[p] = all[i]; });
        setResults(map);
        setSelectedPos(positions[0]);
      })
      .finally(() => setLoading(false));
  }, [positions, status]);

  const current = results[selectedPos];

  if (status !== 'ENDED') {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Results</h2>
          <p className="text-neutral-500 text-sm">Final results after the election ends</p>
        </div>
        <div className="border border-neutral-800 rounded-xl py-12 text-center text-neutral-500 text-sm">
          Results will appear here once the election has ended.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Results</h2>
        <p className="text-neutral-500 text-sm">Final vote counts and winners</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {positions.map(pos => (
              <button
                key={pos}
                onClick={() => setSelectedPos(pos)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  selectedPos === pos
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                {positionLabel(pos)}
              </button>
            ))}
          </div>

          {current ? (
            <div className="flex flex-col gap-4">
              {current.tied ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3 text-amber-400 text-sm font-semibold">
                  Tie between {current.winnerName}
                </div>
              ) : current.winnerName && current.totalVotesCast > 0 ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-3 flex items-center gap-3">
                  <span className="text-green-400 text-lg">🏆</span>
                  <div>
                    <p className="text-green-400 font-semibold text-sm">Winner: {current.winnerName}</p>
                    <p className="text-neutral-500 text-xs">{current.totalVotesCast} total votes cast</p>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl px-5 py-3 text-neutral-500 text-sm">
                  No votes were cast for this position.
                </div>
              )}

              <div className="border border-neutral-800 rounded-xl overflow-hidden">
                {(current.breakdown ?? []).map((item, i) => {
                  const pct = current.totalVotesCast > 0
                    ? Math.round((item.voteCount / current.totalVotesCast) * 100)
                    : 0;
                  const isWinner = !current.tied && item.candidateName === current.winnerName;
                  return (
                    <div key={i} className={`px-5 py-4 border-b border-neutral-800 last:border-0 ${isWinner ? 'bg-green-500/5' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isWinner && <span className="text-green-400 text-xs">✓</span>}
                          <span className={`font-medium text-sm ${isWinner ? 'text-green-300' : 'text-white'}`}>
                            {item.candidateName}
                          </span>
                        </div>
                        <span className="text-neutral-400 text-sm">{item.voteCount} votes · {pct}%</span>
                      </div>
                      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isWinner ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border border-neutral-800 rounded-xl py-10 text-center text-neutral-500 text-sm">
              No result data for this position.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Audit Tab ─────────────────────────────────────────────────────────────────

function AuditTab({ token }) {
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
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Audit Log</h2>
        <p className="text-neutral-500 text-sm">History of all past elections</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="border border-neutral-800 rounded-xl py-12 text-center text-neutral-500 text-sm">
          No past elections yet.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.values(grouped).map((group) => (
            <div key={group.name + group.date} className="border border-neutral-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between">
                <p className="text-white text-sm font-semibold">{group.name}</p>
                <p className="text-neutral-500 text-xs">{group.date}</p>
              </div>
              <div className="divide-y divide-neutral-800/50">
                {group.entries.map(log => {
                  const resultPart = log.details?.split('| Results: ')[1] ?? 'No votes cast';
                  const totalPart = log.details?.match(/Total votes: (\d+)/)?.[1] ?? '0';
                  return (
                    <div key={log.id} className="px-5 py-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-neutral-300 text-sm font-medium">{positionLabel(log.position ?? '')}</p>
                        <p className="text-neutral-500 text-xs mt-0.5">{resultPart}</p>
                      </div>
                      <span className="text-neutral-500 text-xs flex-shrink-0 pt-0.5">{totalPart} votes</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
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

// ── Sidebar ───────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'overview',   label: 'Overview',   Icon: IconGrid },
  { id: 'elections',  label: 'Elections',  Icon: IconBolt },
  { id: 'candidates', label: 'Candidates', Icon: IconUsers },
  { id: 'results',    label: 'Results',    Icon: IconChart },
  { id: 'audit',      label: 'Audit Log',  Icon: IconClipboard },
];

function Sidebar({ tab, setTab }) {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-neutral-800 flex flex-col">
      <div className="px-5 py-5 border-b border-neutral-800 flex flex-col gap-2">
        <Logo size="sm" />
        <span className="inline-block text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium w-fit">
          Admin
        </span>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-colors ${
              tab === id
                ? 'bg-blue-500/15 text-blue-400'
                : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
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
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: '100vh' }}>
        <Sidebar tab={tab} setTab={setTab} />

        <div className="flex-1 flex flex-col overflow-auto">
          {/* Top bar */}
          <header className="flex items-center justify-between px-8 py-4 border-b border-neutral-800 flex-shrink-0">
            <StatusBadge status={status ?? 'NOT_CREATED'} />
            <div className="flex items-center gap-4">
              <span className="text-neutral-500 text-sm">{admin?.username}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors border border-neutral-800 px-3 py-1.5 rounded-lg"
              >
                Sign out
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 px-8 py-8 max-w-3xl w-full">
            {tab === 'overview' && (
              <OverviewTab
                status={status}
                stats={stats}
                positions={positions}
                token={admin?.token}
                onRefresh={loadStatus}
                setToast={setToast}
                setTab={setTab}
              />
            )}
            {tab === 'elections' && (
              <ElectionsTab
                status={status}
                token={admin?.token}
                onRefresh={loadStatus}
                setToast={setToast}
              />
            )}
            {tab === 'candidates' && (
              <CandidatesTab
                token={admin?.token}
                positions={positions}
                status={status}
              />
            )}
            {tab === 'results' && (
              <ResultsTab positions={positions} status={status} />
            )}
            {tab === 'audit' && (
              <AuditTab token={admin?.token} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
