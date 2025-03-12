import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../components/ui/use-toast'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { formatDate } from '../lib/utils'
import { PlusCircle, Edit, Trash2 } from 'lucide-react'
import { apiGet, apiDelete } from '../lib/api'

const ManagePages = () => {
  const [blogPosts, setBlogPosts] = useState([])
  const [pages, setPages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pageToDelete, setPageToDelete] = useState(null)
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from localStorage or default to "blogs"
    return localStorage.getItem("managePagesActiveTab") || "blogs"
  })
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Handle tab change and save to localStorage
  const handleTabChange = (value) => {
    setActiveTab(value);
    localStorage.setItem("managePagesActiveTab", value);
  }

  useEffect(() => {
    // Check if we're returning from a post with tab info
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch blog posts
        const blogResponse = await apiGet('/api/pages?type=blog')
        if (!blogResponse.ok) throw new Error('Failed to fetch blog posts')
        const blogData = await blogResponse.json()
        setBlogPosts(blogData)
        
        // Fetch regular pages (non-blog posts)
        const pagesResponse = await apiGet('/api/pages?type=page')
        if (!pagesResponse.ok) throw new Error('Failed to fetch pages')
        const pagesData = await pagesResponse.json()
        setPages(pagesData)
        
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching content:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load content. Please try again.",
        })
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [toast, location.state])

  const handleDelete = async () => {
    if (!pageToDelete) return
    
    try {
      const response = await apiDelete(`/api/pages/${pageToDelete.slug}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete')
      }
      
      toast({
        title: "Deleted Successfully",
        description: `"${pageToDelete.title}" has been deleted.`,
      })
      
      // Update the local state to remove the deleted item
      if (pageToDelete.is_blog === 1) {
        setBlogPosts(blogPosts.filter(post => post.id !== pageToDelete.id))
      } else {
        setPages(pages.filter(page => page.id !== pageToDelete.id))
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete the content.",
      })
    } finally {
      setPageToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const confirmDelete = (item) => {
    setPageToDelete(item)
    setDeleteDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  const renderContentList = (contentItems, contentType) => {
    if (contentItems.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          <p>No {contentType} found.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/new')}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New {contentType === 'blog posts' ? 'Blog Post' : 'Page'}
          </Button>
        </div>
      );
    }

    return contentItems.map((item) => (
      <div key={item.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h3 className="font-medium">
              <Link 
                to={item.is_blog === 1 ? `/post/${item.slug}` : `/${item.slug}`} 
                state={{ from: 'manage', activeTab: activeTab }}
                className="hover:underline hover:text-primary"
              >
                {item.title}
              </Link>
            </h3>
            {item.is_blog === 1 && item.featured === 1 && (
              <span className="inline-flex items-center bg-secondary px-2 py-0.5 text-xs font-medium text-foreground w-fit">
                Featured
              </span>
            )}
          </div>
          {item.published_date && (
            <div className="text-sm text-muted-foreground">
              Published: {formatDate(item.published_date)}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/edit/${item.slug}`)}
            className="flex-1 sm:flex-none"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => confirmDelete(item)}
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header section with create button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Manage Content</h1>
        <div className="flex justify-start sm:justify-end">
          <Button 
            onClick={() => navigate('/new')} 
            className="w-auto"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>
      </div>
      
      {/* Tabs for Blog Posts and Pages */}
      <Tabs 
        defaultValue="blogs" 
        value={activeTab} 
        onValueChange={handleTabChange} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="blogs">Blogs</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="blogs">
          <div className="divide-y manage-card">
            {renderContentList(blogPosts, 'blog posts')}
          </div>
        </TabsContent>
        
        <TabsContent value="pages">
          <div className="divide-y manage-card">
            {renderContentList(pages, 'pages')}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{pageToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ManagePages
