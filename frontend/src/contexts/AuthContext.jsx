import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui/use-toast'
import { apiGet, apiPost } from '../lib/api'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

// Local storage key for auth state
const AUTH_STORAGE_KEY = 'blogger_auth_state';
// Session timeout in milliseconds (4 hours)
const SESSION_TIMEOUT = 4 * 60 * 60 * 1000;

export function AuthProvider({ children }) {
  // Initialize user state from localStorage if available, with session timeout check
  const [user, setUser] = useState(() => {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth);
        
        // Check if the session has expired
        if (parsedAuth.loginTime) {
          const loginTime = new Date(parsedAuth.loginTime).getTime();
          const currentTime = new Date().getTime();
          
          if (currentTime - loginTime > SESSION_TIMEOUT) {
            console.log("Session expired, logging out");
            localStorage.removeItem(AUTH_STORAGE_KEY);
            return null;
          }
        }
        
        return parsedAuth;
      } catch (e) {
        console.error('Error parsing saved auth state:', e);
        return null;
      }
    }
    return null;
  });
  
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { toast } = useToast()

  // Update localStorage when user state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  // Check if user is already logged in
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        console.log("Checking auth status...");
        const response = await apiGet('/api/auth/status')
        console.log("Auth status response:", response);
        
        // Log response headers for debugging
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        console.log("Response headers:", headers);
        
        const data = await response.json()
        console.log("Auth status data:", data);
        
        if (data.authenticated) {
          console.log("User is authenticated according to server:", data.user);
          setUser({ 
            username: data.user,
            loginTime: new Date().toISOString()
          });
        } else {
          console.log("User is not authenticated according to server");
          // Check if we have a local auth state that needs to be verified
          const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
          if (savedAuth) {
            // Check if the session has expired
            try {
              const parsedAuth = JSON.parse(savedAuth);
              if (parsedAuth.loginTime) {
                const loginTime = new Date(parsedAuth.loginTime).getTime();
                const currentTime = new Date().getTime();
                
                if (currentTime - loginTime > SESSION_TIMEOUT) {
                  console.log("Session expired, logging out");
                  setUser(null);
                } else {
                  console.log("Using saved authentication state");
                  // Session is still valid, keep the user logged in
                }
              }
            } catch (e) {
              console.error('Error parsing saved auth state:', e);
            }
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Keep user state if error - don't log out on network failures
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  // Login function
  const login = async (username, password) => {
    try {
      console.log("Attempting login for:", username);
      const response = await apiPost('/api/auth/login', { username, password })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      const data = await response.json()
      console.log("Login successful, data:", data);
      
      // Set user state with login time to track session age
      const userState = { 
        username,
        loginTime: new Date().toISOString(),
      };
      
      setUser(userState);
      
      // Force re-check auth immediately after login
      setTimeout(async () => {
        try {
          console.log("Re-checking auth after login...");
          const statusResponse = await apiGet('/api/auth/status')
          const statusData = await statusResponse.json()
          console.log("Post-login auth check:", statusData);
          
          // Since we're using local storage, no need to update state here
        } catch (error) {
          console.error("Error in post-login auth check:", error);
        }
      }, 500);
      
      toast({
        title: "Login Successful",
        description: "You've been successfully logged in.",
      })
      
      return { success: true }
    } catch (error) {
      console.error("Login error:", error);
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
      console.log("Attempting logout");
      await apiPost('/api/auth/logout', {})
      
      // Always clear local state, regardless of API response
      setUser(null);
      
      toast({
        title: "Logged Out",
        description: "You've been successfully logged out.",
      })
      
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local state even if API fails
      setUser(null);
      
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
