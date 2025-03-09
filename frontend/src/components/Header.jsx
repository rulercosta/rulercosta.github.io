import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from './theme-provider'
import { Button } from './ui/button'
import { Moon, Sun, Settings as SettingsIcon } from 'lucide-react'
import SettingsModal from './SettingsModal'

const Header = () => {
  const { user, isAuthenticated } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link 
          to="/" 
          className="text-xl font-bold tracking-tight hover:text-primary/80 transition"
        >
          neuralwired
        </Link>
        
        {/* Navigation - Responsive Design */}
        <nav className="flex items-center gap-3 sm:gap-4 md:gap-5">
          {/* Theme toggle - icon only on all screen sizes */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="hover:bg-muted"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          
          {/* Only show settings button if authenticated */}
          {isAuthenticated && (
            <>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => setShowSettingsModal(true)}
                title="Settings"
                className="hover:bg-muted"
              >
                <SettingsIcon className="h-5 w-5" />
              </Button>
              
              {/* Settings Modal */}
              <SettingsModal 
                open={showSettingsModal} 
                onOpenChange={setShowSettingsModal} 
              />
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
