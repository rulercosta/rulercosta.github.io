"""
Pages API routes
"""
from flask import jsonify, request, current_app
from sqlalchemy import desc
from sqlalchemy.exc import SQLAlchemyError
from app.models.database import db, Page
from app.api.auth.routes import login_required
from app.utils.helpers import slugify, generate_excerpt, extract_first_image_url
from . import bp
import datetime

def get_all_pages():
    """Get all non-blog pages"""
    pages = Page.query.filter(~Page.is_blog).order_by(Page.title).all()
    return [page.to_dict() for page in pages]

def get_blog_posts(limit=None, featured=False):
    """Get blog posts with optional limit and featured filter"""
    query = Page.query.filter(Page.is_blog)
    
    if featured:
        query = query.filter(Page.featured)
    
    # Apply order_by BEFORE limit
    query = query.order_by(desc(Page.published_date))
    
    if limit:
        query = query.limit(limit)
        
    posts = query.all()
    result = [post.to_dict() for post in posts]
    
    # Extract first image URL for each post
    for post in result:
        post['first_image'] = extract_first_image_url(post['content']) if 'content' in post else None
    
    return result

def get_page_by_slug(slug):
    """Get a page by its slug"""
    page = Page.query.filter_by(slug=slug).first()
    
    if page:
        result = page.to_dict()
        if result.get('is_blog') == 1 and 'content' in result:
            result['first_image'] = extract_first_image_url(result['content'])
        return result
    return None

def create_page(title, content, is_blog=False, featured=False, excerpt=None):
    """Create a new page"""
    slug = slugify(title)
    
    # Ensure slug is unique
    base_slug = slug
    counter = 1
    while Page.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # Generate excerpt if not provided
    if not excerpt and is_blog:
        excerpt = generate_excerpt(content)
        
    now = datetime.datetime.now().isoformat()
    
    page = Page(
        title=title,
        slug=slug,
        content=content,
        is_blog=is_blog,
        excerpt=excerpt,
        featured=featured,
        created_at=now,
        updated_at=now,
        published_date=now
    )
    
    db.session.add(page)
    db.session.commit()
    
    return page.to_dict()

def update_page(slug, title=None, content=None, is_blog=None, featured=None, excerpt=None):
    """Update an existing page"""
    page = Page.query.filter_by(slug=slug).first()
    
    if not page:
        return None
        
    if title is not None:
        page.title = title
        new_slug = slugify(title)
        
        if new_slug != slug:
            # Check if new slug exists (other than this page)
            existing = Page.query.filter(Page.slug == new_slug, Page.id != page.id).first()
            if existing:
                base_slug = new_slug
                counter = 1
                while Page.query.filter(
                    Page.slug == f"{new_slug}-{counter}",
                    Page.id != page.id
                ).first():
                    counter += 1
                new_slug = f"{base_slug}-{counter}"
            page.slug = new_slug
    
    if content is not None:
        page.content = content
        if page.is_blog and excerpt is None:
            page.excerpt = generate_excerpt(content)
    
    if is_blog is not None:
        page.is_blog = is_blog
        
    if featured is not None:
        page.featured = featured
        
    if excerpt is not None:
        page.excerpt = excerpt
        
    page.updated_at = datetime.datetime.now().isoformat()
    
    db.session.commit()
    return page.to_dict()

def delete_page(slug):
    """Delete a page"""
    page = Page.query.filter_by(slug=slug).first()
    
    if not page:
        return False
        
    db.session.delete(page)
    db.session.commit()
    return True

# API Routes
@bp.route('', methods=['GET'])
def api_get_pages():
    """
    Get all pages or blog posts
    
    Returns:
        JSON response with pages or posts
    """
    is_blog = request.args.get('type') == 'blog'
    featured = request.args.get('featured') == 'true'
    limit = request.args.get('limit')
    
    if limit:
        try:
            limit = int(limit)
        except ValueError:
            limit = None
    
    if is_blog:
        posts = get_blog_posts(limit=limit, featured=featured)
        return jsonify(posts)
    else:
        pages = get_all_pages()
        return jsonify(pages)

@bp.route('/<slug>', methods=['GET'])
def api_get_page(slug):
    """Get a specific page by slug"""
    try:
        page = Page.query.filter_by(slug=slug).first()
        
        if not page:
            return jsonify({"error": "Page not found"}), 404
            
        result = page.to_dict()
        if result.get('is_blog') == 1 and 'content' in result:
            result['first_image'] = extract_first_image_url(result['content'])
        return jsonify(result)
        
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"error": "Database error occurred"}), 500
    except Exception as e:
        current_app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@bp.route('', methods=['POST'])
@login_required
def api_create_page():
    """
    Create a new page
    
    Returns:
        JSON response with created page data
    """
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400
        
    data = request.get_json()
    
    if not data or 'title' not in data or 'content' not in data:
        return jsonify({"error": "Missing required fields"}), 400
        
    title = data['title']
    content = data['content']
    is_blog = bool(data.get('is_blog', False))
    featured = bool(data.get('featured', False))
    excerpt = data.get('excerpt')
    
    try:
        page = create_page(title, content, is_blog, featured, excerpt)
        return jsonify(page), 201
    except Exception as e:
        current_app.logger.error(f"Error creating page: {str(e)}")
        return jsonify({"error": "Failed to create page"}), 500

@bp.route('/<slug>', methods=['PUT', 'PATCH'])
@login_required
def api_update_page(slug):
    """
    Update an existing page
    
    Args:
        slug: Page slug to update
        
    Returns:
        JSON response with updated page data
    """
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400
        
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No update data provided"}), 400
    
    title = data.get('title')
    content = data.get('content')
    is_blog = data.get('is_blog')
    featured = data.get('featured')
    excerpt = data.get('excerpt')
    
    try:
        page = update_page(slug, title, content, is_blog, featured, excerpt)
        if page:
            return jsonify(page)
        else:
            return jsonify({"error": "Page not found"}), 404
    except Exception as e:
        current_app.logger.error(f"Error updating page: {str(e)}")
        return jsonify({"error": "Failed to update page"}), 500

@bp.route('/<slug>', methods=['DELETE'])
@login_required
def api_delete_page(slug):
    """
    Delete a page
    
    Args:
        slug: Page slug to delete
        
    Returns:
        JSON response with deletion status
    """
    try:
        success = delete_page(slug)
        if success:
            return jsonify({"success": True, "message": "Page deleted successfully"}), 200
        else:
            return jsonify({"error": "Page not found"}), 404
    except Exception as e:
        current_app.logger.error(f"Error deleting page: {str(e)}")
        return jsonify({"error": "Failed to delete page"}), 500
