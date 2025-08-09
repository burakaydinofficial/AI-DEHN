import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import { DocumentsList } from './pages/DocumentsList';
import { DocumentDetail } from './pages/DocumentDetail';

function Header() {
  return (
    <header style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, background: '#2563eb', color: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>D</div>
          <div>
            <div style={{ fontWeight: 700 }}>DEHN Admin</div>
            <div style={{ fontSize: 12, color: '#667085' }}>Manual Lifecycle Platform</div>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/documents" className="nav-link">Documents</Link>
        </nav>
      </div>
    </header>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '16px' }}>{children}</main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<RedirectToDocuments />} />
          <Route path="/documents" element={<DocumentsList />} />
          <Route path="/documents/:id" element={<DocumentDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function RedirectToDocuments() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/documents', { replace: true }); }, [navigate]);
  return null;
}

export default App;
