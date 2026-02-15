import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PracticeProvider } from './context/PracticeContext'
import Layout from './components/Layout/Layout'
import LoginPage from './components/Auth/LoginPage'
import RegisterPage from './components/Auth/RegisterPage'
import Dashboard from './components/Dashboard/Dashboard'
import ModuleSelector from './components/Practice/ModuleSelector'
import ModuleA from './components/Practice/ModuleA'
import ModuleB from './components/Practice/ModuleB'
import ModuleC from './components/Practice/ModuleC'
import Simulation from './components/Practice/Simulation'
import AnalysisPage from './components/Analysis/AnalysisPage'
import HistoryPage from './components/History/HistoryPage'
import ProfilePage from './components/Profile/ProfilePage'
import AdminDashboard from './components/Admin/AdminDashboard'
import StatisticsPage from './components/Statistics/StatisticsPage'
import LandingPage from './components/LandingPage/LandingPage'
import ScrollToTop from './components/ScrollToTop'

import PaymentRequiredPage from './components/Payment/PaymentRequiredPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100vh' }}>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" />
}

function PremiumRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100vh' }}>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" />

  // Admin is always premium
  if (user.isAdmin) return children

  return user.isPremium ? children : <Navigate to="/payment" />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100vh' }}>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return user ? <Navigate to="/dashboard" /> : children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100vh' }}>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return user?.isAdmin ? children : <Navigate to="/dashboard" />
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <PracticeProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />

            {/* Private Routes */}
            <Route path="/payment" element={
              <PrivateRoute>
                <PaymentRequiredPage />
              </PrivateRoute>
            } />

            <Route element={
              <PremiumRoute>
                <Layout />
              </PremiumRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="practice" element={<ModuleSelector />} />
              <Route path="practice/module-a" element={<ModuleA />} />
              <Route path="practice/module-b" element={<ModuleB />} />
              <Route path="practice/module-c" element={<ModuleC />} />
              <Route path="practice/simulation" element={<Simulation />} />
              <Route path="analysis/:id" element={<AnalysisPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="statistics" element={<StatisticsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </PracticeProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
