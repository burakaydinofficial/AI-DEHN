import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { FileText, Settings } from 'lucide-react'
import './App.css'
import { DocumentsList } from './pages/DocumentsList'
import { DocumentDetail } from './pages/DocumentDetail'
import { AdminDashboard } from './pages/admin/AdminDashboard'

// Navigation component to access location
const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav>
      <Link 
        to="/" 
        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
      >
        <FileText className="nav-icon" />
        Documents
      </Link>
      <Link 
        to="/admin" 
        className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
      >
        <Settings className="nav-icon" />
        Admin Panel
      </Link>
    </nav>
  );
};

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  // Responsive layout detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <Router>
      <div className={`app ${isMobile ? 'mobile' : 'desktop'}`}>
        <header className="app-header">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo">
                D
              </div>
              <div>
                <h1>DEHN Document Platform</h1>
                <p className="subtitle">Lightning Protection Systems</p>
              </div>
            </div>
            <Navigation />
          </div>
        </header>
        
        <main className="app-main">
          <Routes>
            <Route path="/" element={<DocumentsList />} />
            <Route path="/document/:id" element={<DocumentDetail />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
