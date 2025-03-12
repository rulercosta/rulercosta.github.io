import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../components/ui/use-toast'
import { Button } from '../components/ui/button'
import PostCard from '../components/PostCard'
import { ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext' // Import useAuth hook
import { apiGet } from '../lib/api'

const HomePage = () => {
  const [settings, setSettings] = useState({})
  const [featuredPosts, setFeaturedPosts] = useState([])
  const [recentPosts, setRecentPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { isAuthenticated } = useAuth() // Get authentication status

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch site settings
        const settingsResponse = await apiGet('/api/settings')
        if (!settingsResponse.ok) throw new Error('Failed to fetch settings')
        const settingsData = await settingsResponse.json()
        setSettings(settingsData)
        
        // Fetch featured posts
        const featuredResponse = await apiGet('/api/pages?type=blog&featured=true')
        if (!featuredResponse.ok) throw new Error('Failed to fetch featured posts')
        const featuredData = await featuredResponse.json()
        setFeaturedPosts(featuredData)
        
        // Fetch recent posts
        const recentResponse = await apiGet('/api/pages?type=blog&limit=5')
        if (!recentResponse.ok) throw new Error('Failed to fetch recent posts')
        const recentData = await recentResponse.json()
        setRecentPosts(recentData)
        
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load content. Please try again.",
        })
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [toast])

  // Process HTML content for introduction
  const processContent = (content) => {
    // Make sure all links open in a new tab for security
    let processedContent = content;
    if (typeof content === 'string') {
      // Add target="_blank" to links that don't have it
      processedContent = content.replace(
        /<a\s+(?:[^>]*?\s+)?href=(['"])(.*?)\1([^>]*?)>/gi,
        '<a href=$1$2$1 target="_blank" rel="noopener noreferrer" $3>'
      );
    }
    
    // Return the processed HTML content
    return { __html: processedContent };
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Introduction */}
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          {settings.site_title || 'Blogger'}
        </h1>
        {settings.introduction ? (
          <div 
            className="prose max-w-none dark:prose-invert blog-content overflow-x-hidden"
            dangerouslySetInnerHTML={processContent(settings.introduction)}
          />
        ) : (
          <div className="prose max-w-none dark:prose-invert">
            <p className="text-lg text-muted-foreground">Welcome to my blog</p>
          </div>
        )}
      </section>

      {/* Featured */}
      {featuredPosts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Featured</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                featured={true} 
                hideFeaturedBadge={true} 
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Recent</h2>
          {isAuthenticated && ( // Only show when authenticated
            <Link to="/manage" className="text-sm font-medium text-muted-foreground">
              View all
              <ChevronRight className="ml-1 h-4 w-4 inline" />
            </Link>
          )}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recentPosts.length > 0 ? (
            recentPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              <p>No posts found. Create your first blog post!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage
