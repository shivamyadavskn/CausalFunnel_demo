import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import SessionsPage from './pages/SessionsPage';
import HeatmapPage from './pages/HeatmapPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/sessions" replace />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/heatmap" element={<HeatmapPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
