import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { useToast } from '../components/ui/use-toast'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { formatDate } from '../lib/utils'
import { Edit, ArrowLeft } from 'lucide-react'
import { apiGet } from '../lib/api'

const PostPage = ({ type = 'blog' }) => {
  const [post, setPost] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [prevPath, setPrevPath] = useState('/')
  const [prevLabel, setPrevLabel] = useState('Back to Home')
  const [activeTab, setActiveTab] = useState(null)
  const { slug } = useParams()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  // Check location state for the previous path and active tab
  useEffect(() => {
    if (location.state?.from === 'manage') {
      setPrevPath('/manage')
      setPrevLabel('Back to Manage')
      if (location.state?.activeTab) {
        setActiveTab(location.state.activeTab)
      }
    } else {
      setPrevPath('/')
      setPrevLabel('Back to Home')
    }
  }, [location])

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true)
        const response = await apiGet(`/api/pages/${slug}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            navigate('/not-found', { replace: true })
            return
          }
          throw new Error('Failed to fetch post data')
        }
        
        const data = await response.json()
        
        // Handle type mismatch redirection in a useEffect-safe way
        if ((type === 'blog' && data.is_blog !== 1) || 
            (type === 'page' && data.is_blog === 1)) {
          const correctPath = data.is_blog === 1 ? 
            `/post/${data.slug}` : `/${data.slug}`
          navigate(correctPath, { replace: true })
          return
        }
        
        setPost(data)
      } catch (error) {
        console.error('Error fetching post:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load content. Please try again.",
        })
        navigate('/not-found', { replace: true })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPost()
  }, [slug, navigate, toast, type])

  // Function to ensure alignment styles are properly applied
  // Updated to handle TipTap content classes and image sizing
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

  // Early return for loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  // Early return for missing post - don't navigate here
  if (!post) {
    return null
  }

  return (
    <article className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {/* Only show back button for blog posts, not for pages */}
          {type === 'blog' && (
            <Link 
              to={prevPath} 
              state={activeTab ? { activeTab } : undefined} 
              className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {prevLabel}
            </Link>
          )}
          
          {/* If it's a page with no back button, push the Edit button to the left */}
          {type !== 'blog' && !isAuthenticated && <div></div>}
          
          {isAuthenticated && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/edit/${post.slug}`)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
          {post.published_date && post.is_blog === 1 && (
            <time className="text-muted-foreground">
              {formatDate(post.published_date)}
            </time>
          )}
          {post.is_blog === 1 && post.featured === 1 && (
            <div className="mt-2">
              <span className="inline-flex items-center bg-secondary px-2 py-1 text-xs font-medium text-foreground w-fit">
                Featured
              </span>
            </div>
          )}
        </div>
        
        <div 
          className="prose dark:prose-invert max-w-none mt-6 blog-content overflow-x-hidden"
          dangerouslySetInnerHTML={processContent(post.content)}
        />
      </div>
    </article>
  )
}

export default PostPage
