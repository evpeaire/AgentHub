import { HashRouter, Routes, Route } from 'react-router-dom';
import { GitHubAuthProvider } from './auth/GitHubAuth';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AgentDetail from './pages/AgentDetail';
import SubmitAgent from './pages/SubmitAgent';

export default function App() {
  return (
    <GitHubAuthProvider>
      <HashRouter>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/agent/:id" element={<AgentDetail />} />
              <Route path="/submit" element={<SubmitAgent />} />
            </Routes>
          </main>
          <footer className="site-footer">
            <p>Microsoft Agent Hub &middot; Internal use only</p>
          </footer>
        </div>
      </HashRouter>
    </GitHubAuthProvider>
  );
}
