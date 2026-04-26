import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCandidates, castVote, getElectionStatus, getResults, verifyVote, positionLabel } from '../api/elections';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { Toast } from '../components/Toast';

function CandidateRow({ candidate, selected, onSelect, disabled }) {
  return (
    <button
      onClick={() => !disabled && onSelect(candidate.id)}
      disabled={disabled}
      className={`w-full flex items-center gap-4 px-5 py-4 border-b border-neutral-800 last:border-0 text-left transition-colors ${
        disabled ? 'cursor-default' : 'hover:bg-neutral-800/40 cursor-pointer'
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          selected ? 'border-blue-500 bg-blue-500' : 'border-neutral-600'
        }`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-white" />}
      </span>
      <span className={`font-medium text-sm ${selected ? 'text-white' : 'text-neutral-300'}`}>
        {candidate.fullName}
      </span>
    </button>
  );
}

function ResultsView({ results }) {
  if (!results) return <p className="text-neutral-500 text-sm py-8 text-center">No results available.</p>;

  const { breakdown = [], winnerName, totalVotesCast, tied } = results;

  return (
    <div className="flex flex-col gap-4">
      {tied && (
        <div className="text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl">
          Tie between {winnerName}
        </div>
      )}
      {!tied && winnerName && totalVotesCast > 0 && (
        <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 px-4 py-2.5 rounded-xl">
          Winner: {winnerName}
        </div>
      )}
      <div className="border border-neutral-800 rounded-xl overflow-hidden">
        {breakdown.map((item, i) => {
          const pct = totalVotesCast > 0 ? Math.round((item.voteCount / totalVotesCast) * 100) : 0;
          return (
            <div key={i} className="px-5 py-4 border-b border-neutral-800 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium text-sm">{item.candidateName}</span>
                <span className="text-neutral-400 text-sm">{item.voteCount} votes · {pct}%</span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-neutral-500 text-xs text-right">{totalVotesCast} total votes cast</p>
    </div>
  );
}

function ReceiptCard({ receipt }) {
  const [status, setStatus] = useState(null); // null | 'loading' | 'valid' | 'invalid'
  const [info, setInfo] = useState(null);

  const handleVerify = async () => {
    setStatus('loading');
    try {
      const data = await verifyVote(receipt);
      setInfo(data);
      setStatus('valid');
    } catch {
      setStatus('invalid');
    }
  };

  return (
    <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-4 flex flex-col gap-3">
      <div>
        <p className="text-green-400 font-semibold text-sm">Vote recorded!</p>
        <p className="text-neutral-400 text-xs mt-1">
          Receipt: <code className="text-green-300 break-all">{receipt}</code>
        </p>
      </div>

      {status === null && (
        <button
          onClick={handleVerify}
          className="self-start text-xs font-semibold text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg hover:bg-green-500/10 transition-colors"
        >
          Verify this vote
        </button>
      )}

      {status === 'loading' && (
        <p className="text-xs text-neutral-500">Verifying…</p>
      )}

      {status === 'valid' && info && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-sm">✓</span>
            <p className="text-green-400 text-sm font-semibold">Vote verified — this receipt is legitimate</p>
          </div>
          <p className="text-neutral-400 text-xs">Position: {info.position?.replace(/_/g, ' ')}</p>
          {info.timestamp && (
            <p className="text-neutral-500 text-xs">Cast at: {new Date(info.timestamp).toLocaleString()}</p>
          )}
        </div>
      )}

      {status === 'invalid' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <p className="text-red-400 text-sm font-semibold">Receipt not found</p>
          <p className="text-neutral-500 text-xs mt-0.5">This receipt could not be verified.</p>
        </div>
      )}
    </div>
  );
}

export default function ElectionDetailPage() {
  const { position: positionParam } = useParams();
  const position = positionParam?.toUpperCase();
  const { user, login } = useAuth();

  const [electionStatus, setElectionStatus] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [casting, setCasting] = useState(false);
  const [toast, setToast] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const hasVoted = user?.votedPositions?.includes(position);

  useEffect(() => {
    const load = async () => {
      try {
        const [status, cands] = await Promise.all([
          getElectionStatus(),
          getCandidates(position),
        ]);
        setElectionStatus(status);
        setCandidates(cands);
        if (status === 'ENDED') {
          const res = await getResults(position);
          setResults(res);
        }
      } catch (err) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [position]);

  const handleCastVote = async () => {
    if (!selected || !user) return;
    setCasting(true);
    try {
      const result = await castVote({
        voterId: user.id,
        candidateId: selected,
        position,
        token: user.token,
      });
      setReceipt(result.receipt);
      login({ ...user, votedPositions: [...(user.votedPositions ?? []), position] });
      setToast({ message: 'Vote cast successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setCasting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isVotingOpen = electionStatus === 'ONGOING';
  const isClosed = electionStatus === 'ENDED';
  const isNotStarted = electionStatus === 'NOT_STARTED';
  const canVote = isVotingOpen && !hasVoted && !receipt;

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Header showBack backLabel="Elections" backTo="/elections" />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-6">
          {electionStatus && <StatusBadge status={electionStatus} />}
          <h1 className="text-3xl font-bold text-white mt-3">{positionLabel(position)}</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="border-t border-neutral-800 mb-6" />

        {isClosed ? (
          <ResultsView results={results} />
        ) : (
          <>
            {isNotStarted && (
              <div className="mb-6 bg-neutral-900/60 border border-neutral-800 rounded-xl px-5 py-4">
                <p className="text-neutral-400 text-sm font-medium">Nominations are open</p>
                <p className="text-neutral-600 text-xs mt-1">Voting has not started yet. Check back when the election is opened by the admin.</p>
              </div>
            )}

            {receipt && <ReceiptCard receipt={receipt} />}

            {hasVoted && !receipt && (
              <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl px-5 py-4">
                <p className="text-blue-400 font-semibold text-sm">You have already voted for this position.</p>
              </div>
            )}

            {canVote && (
              <p className="text-neutral-500 text-sm mb-6">Choose one candidate. You cannot change your vote.</p>
            )}

            <div className="border border-neutral-800 rounded-xl overflow-hidden mb-6">
              {candidates.length === 0 ? (
                <p className="text-neutral-500 text-sm text-center py-8">No candidates yet.</p>
              ) : (
                candidates.map((c) => (
                  <CandidateRow
                    key={c.id}
                    candidate={c}
                    selected={selected === c.id}
                    onSelect={setSelected}
                    disabled={!canVote}
                  />
                ))
              )}
            </div>

            {isVotingOpen && (
              <button
                onClick={handleCastVote}
                disabled={!selected || casting || !canVote}
                className={`w-full py-4 rounded-xl font-semibold text-base transition-colors ${
                  selected && canVote
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {casting ? 'Casting vote…' : hasVoted ? 'Already voted' : 'Cast vote'}
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
