import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import { Github, Linkedin, Twitter } from 'lucide-react'
import { useToast } from '../components/ui/use-toast'

const MainLayout = () => {
  const [settings, setSettings] = useState({
    github_url: '',
    linkedin_url: '',
    twitter_url: ''
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (!response.ok) throw new Error('Failed to fetch settings')
        const data = await response.json()
        setSettings(data)
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load site settings. Some features may be limited.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8 mb-16">
        <Outlet />
      </main>
      <footer className="py-4 fixed bottom-0 w-full bg-background">
        <div className="container flex justify-center">
          <div className="flex items-center space-x-8 md:space-x-10">
            {settings.github_url && (
              <a 
                href={settings.github_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-muted"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
            )}
            {settings.linkedin_url && (
              <a 
                href={settings.linkedin_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-muted"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
            )}
            {settings.twitter_url && (
              <a 
                href={settings.twitter_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-muted"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout
