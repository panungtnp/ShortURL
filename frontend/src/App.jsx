import { NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import History from './pages/History.jsx';
import Stats from './pages/Stats.jsx';

function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink to="/" className="brand" aria-label="Short URL home">
          <span className="brand-mark">↗</span>
          <span>Short<span>URL</span></span>
        </NavLink>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>สร้างลิงก์</NavLink>
          <NavLink to="/history">ประวัติ</NavLink>
          <NavLink to="/stats">สถิติ</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>
      <footer>Short URL service · Node.js + React + PostgreSQL</footer>
    </div>
  );
}

export default App;
