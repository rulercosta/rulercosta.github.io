import { Link } from 'react-router-dom'
import { formatDate } from '../lib/utils'

const PostCard = ({ post, featured = false, hideFeaturedBadge = false }) => {
  // Determine the correct URL path based on content type
  const contentPath = post.is_blog === 1 ? `/post/${post.slug}` : `/${post.slug}`;
  
  return (
    <div className={`group flex flex-col overflow-hidden border-card-border bg-background shadow-sm ${featured ? 'h-full' : ''}`}>
      {/* Image section - display the first image if available */}
      {post.first_image && (
        <div className="relative aspect-video w-full overflow-hidden">
          <img 
            src={post.first_image} 
            alt={post.title} 
            className="h-full w-full object-cover"
            onError={(e) => {
              // Hide broken images
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex flex-wrap gap-2 items-center mb-2">
          {post.featured === 1 && !hideFeaturedBadge && (
            <span className="inline-flex items-center bg-secondary px-2 py-0.5 text-xs font-medium text-foreground w-fit">
              Featured
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold">
          <Link to={contentPath} state={{ from: 'home' }}>{post.title}</Link>
        </h3>
        {post.published_date && post.is_blog === 1 && (
          <time className="text-sm text-muted-foreground mt-1">
            {formatDate(post.published_date)}
          </time>
        )}
        {post.excerpt && (
          <p className="mt-3 text-muted-foreground text-sm line-clamp-3 flex-grow">
            {post.excerpt}
          </p>
        )}
        <Link 
          to={contentPath}
          state={{ from: 'home' }}
          className="mt-4 inline-flex items-center text-sm font-medium text-primary"
        >
          Read more
          <svg
            className="ml-1 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
}

export default PostCard
