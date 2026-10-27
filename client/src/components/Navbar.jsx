import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) => `text-sm transition ${isActive ? 'text-ghost' : 'text-faded hover:text-paper'}`;

  return (
    <header className="sticky top-0 z-20 border-b border-line/60 bg-night/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">👻</span>
          <span className="font-display text-2xl font-semibold tracking-wide">
            Ghost Writer <span className="text-ghost">Room</span>
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <NavLink to="/" end className={linkClass}>
            Explore
          </NavLink>
          {user ? (
            <>
              <Link to="/new" className="btn btn-primary hidden sm:inline-flex">
                + New story
              </Link>
              <Link to={`/users/${user._id}`} title="Your profile">
                <Avatar name={user.username} />
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="text-sm text-faded hover:text-blood"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <Link to="/register" className="btn btn-primary">
                Join
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
