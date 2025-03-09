import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui/use-toast'

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
        const response = await fetch('/api/auth/status')
        const data = await response.json()
        
        if (data.authenticated) {
          setUser({ username: data.user })
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      })

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
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      setUser(null)
      
      toast({
        title: "Logged Out",
        description: "You've been successfully logged out.",
      })
      
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "There was a problem logging out.",
      })
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
