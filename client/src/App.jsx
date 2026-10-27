import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Spinner from './components/Spinner.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import CreateStory from './pages/CreateStory.jsx';
import StoryRoom from './pages/StoryRoom.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';

// React Flow is heavy, so the tree page loads only when someone opens it.
const TreeView = lazy(() => import('./pages/TreeView.jsx'));

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/new"
            element={
              <RequireAuth>
                <CreateStory />
              </RequireAuth>
            }
          />
          <Route path="/stories/:id" element={<StoryRoom />} />
          <Route
            path="/stories/:id/tree"
            element={
              <Suspense fallback={<Spinner />}>
                <TreeView />
              </Suspense>
            }
          />
          <Route path="/users/:id" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
