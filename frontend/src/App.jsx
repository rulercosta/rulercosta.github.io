import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useToast } from './components/ui/use-toast'
import { apiGet } from './lib/api'

// Layouts
import MainLayout from './layouts/MainLayout'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ManagePages from './pages/ManagePages'
import EditPage from './pages/EditPage'
import PostPage from './pages/PostPage'
import NotFoundPage from './pages/NotFoundPage'
import SiteSettingsPage from './pages/SiteSettingsPage'

// Auth context
import { AuthProvider, useAuth } from './contexts/AuthContext'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  // Check authentication status when app loads
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true)
        const response = await apiGet('/api/auth/status')
        if (!response.ok) throw new Error('Failed to check authentication status')
        
        const data = await response.json()
        // Authentication status is handled by the AuthProvider
        setIsLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check authentication status. Please try again.",
        })
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [toast])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="post/:slug" element={<PostPage type="blog" />} />
          <Route path=":slug" element={<PostPage type="page" />} />
          <Route path="manage" element={
            <ProtectedRoute>
              <ManagePages />
            </ProtectedRoute>
          } />
          <Route path="site-settings" element={
            <ProtectedRoute>
              <SiteSettingsPage />
            </ProtectedRoute>
          } />
          <Route path="edit/:slug" element={
            <ProtectedRoute>
              <EditPage />
            </ProtectedRoute>
          } />
          <Route path="new" element={
            <ProtectedRoute>
              <EditPage isNew={true} />
            </ProtectedRoute>
          } />
          {/* Explicitly define the not-found route */}
          <Route path="not-found" element={<NotFoundPage />} />
          {/* Catch all other routes and render the NotFoundPage */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

// Protected route component
function ProtectedRoute({ children }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login to access this page.",
      });
      navigate('/login', { replace: true });
    }
    
    setCheckingAuth(false);
    
  }, [isAuthenticated, navigate, toast]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <span className="ml-2">Checking authentication...</span>
      </div>
    )
  }

  return isAuthenticated ? children : null;
}

export default App
