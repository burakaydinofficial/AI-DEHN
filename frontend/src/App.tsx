import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import { DocumentsList } from './pages/DocumentsList'
import { DocumentDetail } from './pages/DocumentDetail'
import { AdminDashboard } from './pages/admin/AdminDashboard'

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
          <h1>DEHN Document Platform</h1>
          <nav>
            <Link to="/" className="nav-link">Documents</Link>
            <Link to="/admin" className="nav-link">Admin Panel</Link>
          </nav>
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
