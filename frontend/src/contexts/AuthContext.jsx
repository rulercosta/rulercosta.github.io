import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui/use-toast'
import { apiGet, apiPost } from '../lib/api'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { toast } = useToast()

  // Check if user is already logged in
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const response = await apiGet('/api/auth/status')
        
        const data = await response.json()
        
        if (data.authenticated) {
          setUser({ username: data.user })
        } else {
          setUser(null)
        }
      } catch (error) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  // Login function
  const login = async (username, password) => {
    try {
      const response = await apiPost('/api/auth/login', { username, password })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      const data = await response.json()
      setUser({ username })
      
      toast({
        title: "Login Successful",
        description: "You've been successfully logged in.",
      })
      
      return { success: true }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials",
      })
      return { success: false, error: error.message }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await apiPost('/api/auth/logout', {})
      
      setUser(null)
      
      toast({
        title: "Logged Out",
        description: "You've been successfully logged out.",
      })
      
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      setUser(null) // Still clear the user state on error
      
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "There was a problem logging out.",
      })
      
      navigate('/')
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
