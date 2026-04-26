import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Header({ showBack, backLabel = 'Elections', backTo = '/elections' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
      <div className="flex items-center gap-3">
        <Link to="/elections" className="flex items-center gap-2 font-bold text-white text-lg">
          <span className="text-blue-500 text-xl">◆</span>
          Election App
        </Link>
        {showBack && (
          <>
            <span className="text-neutral-600">/</span>
            <Link to={backTo} className="flex items-center gap-1 text-neutral-400 hover:text-white text-sm transition-colors">
              <span className="text-xs">‹</span>
              {backLabel}
            </Link>
          </>
        )}
      </div>

      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-neutral-300">
            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-semibold text-white">
              {initials}
            </div>
            {user.firstName} {user.lastName?.charAt(0)}.
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-2 py-1 rounded"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
