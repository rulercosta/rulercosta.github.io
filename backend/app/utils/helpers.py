"""
Helper functions for the application
"""
import re
import uuid
from flask import current_app
import cloudinary
import cloudinary.uploader
import cloudinary.api

def slugify(text):
    """
    Create a URL-friendly slug from the given text
    
    Args:
        text: Text to slugify
        
    Returns:
        str: URL-friendly slug
    """
    text = text.lower().replace(' ', '-')
    text = re.sub(r'[^a-z0-9\-]', '', text)
    text = re.sub(r'\-+', '-', text)
    return text.strip('-')

def generate_excerpt(content, max_length=150):
    """
    Generate an excerpt from content
    
    Args:
        content: Content to generate excerpt from
        max_length: Maximum length of excerpt
        
    Returns:
        str: Generated excerpt
    """
    # Strip HTML tags
    plain_text = re.sub(r'<[^>]*>', '', content)
    
    # Truncate to max_length
    if len(plain_text) > max_length:
        return plain_text[:max_length].rsplit(' ', 1)[0] + '...'
    return plain_text

def allowed_file(filename):
    """
    Check if file has an allowed extension
    
    Args:
        filename: Name of file to check
        
    Returns:
        bool: True if file has allowed extension, False otherwise
    """
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def init_cloudinary():
    """
    Initialize Cloudinary with credentials from config
    
    Returns:
        bool: True if initialization successful, False otherwise
    """
    if (current_app.config['CLOUDINARY_CLOUD_NAME'] and 
        current_app.config['CLOUDINARY_API_KEY'] and 
        current_app.config['CLOUDINARY_API_SECRET']):
        
        cloudinary.config(
            cloud_name=current_app.config['CLOUDINARY_CLOUD_NAME'],
            api_key=current_app.config['CLOUDINARY_API_KEY'],
            api_secret=current_app.config['CLOUDINARY_API_SECRET'],
            secure=True
        )
        return True
    
    current_app.logger.error("Cloudinary credentials not configured properly")
    return False

def save_uploaded_image(file):
    """
    Save uploaded image to Cloudinary
    
    Args:
        file: File object to save
        
    Returns:
        str: URL path to saved file or None if upload failed
    """
    if not file or not allowed_file(file.filename):
        return None
        
    # Initialize Cloudinary
    if not init_cloudinary():
        current_app.logger.error("Cannot upload - Cloudinary not initialized")
        return None
        
    try:
        # Upload to Cloudinary
        # Use unique public_id to avoid collisions
        folder = "blog_uploads"
        public_id = f"{folder}/{uuid.uuid4().hex}"
        
        result = cloudinary.uploader.upload(
            file,
            public_id=public_id,
            folder=folder,
            resource_type="auto"
        )
        
        current_app.logger.info(f"File uploaded to Cloudinary: {result['secure_url']}")
        return result['secure_url']
    except Exception as e:
        current_app.logger.error(f"Cloudinary upload error: {str(e)}")
        return None

def get_uploaded_files():
    """
    List all uploaded files from Cloudinary
    
    Returns:
        list: List of dictionaries containing file information
    """
    files = []
    
    # Initialize Cloudinary
    if not init_cloudinary():
        current_app.logger.error("Cannot list files - Cloudinary not initialized")
        return files
        
    try:
        # Get files from Cloudinary
        result = cloudinary.api.resources(
            type="upload",
            prefix="blog_uploads",
            max_results=500
        )
        
        for resource in result.get('resources', []):
            files.append({
                'filename': resource['public_id'].split('/')[-1],
                'url': resource['secure_url'],
                'size': resource.get('bytes', 0),
                'created': resource.get('created_at'),
                'public_id': resource['public_id']
            })
        
        return files
    except Exception as e:
        current_app.logger.error(f"Cloudinary list error: {str(e)}")
        return files

def delete_uploaded_file(identifier):
    """
    Delete an uploaded file from Cloudinary
    
    Args:
        identifier: URL, public_id or filename of the file to delete
        
    Returns:
        bool: True if deletion was successful, False otherwise
    """
    if not init_cloudinary():
        current_app.logger.error("Cannot delete - Cloudinary not initialized")
        return False
    
    public_id = None
    
    # Handle different identifier formats
    if identifier.startswith('http') and 'cloudinary.com' in identifier:
        # Extract public_id from URL
        path_parts = identifier.split('/')
        try:
            folder_idx = path_parts.index('upload') + 1
            public_id = '/'.join(path_parts[folder_idx:])
            # Remove extension if present
            if '.' in public_id:
                public_id = public_id.split('.')[0]
        except (ValueError, IndexError):
            current_app.logger.error(f"Could not extract public_id from URL: {identifier}")
            return False
    
    elif identifier.startswith('blog_uploads/'):
        # This is already a public_id
        public_id = identifier
    
    elif '/' not in identifier:
        # Just a filename, try to find its public_id
        try:
            # Search for the file in Cloudinary
            result = cloudinary.api.resources(
                type="upload",
                prefix="blog_uploads",
                max_results=500
            )
            
            for resource in result.get('resources', []):
                if resource['public_id'].endswith(identifier):
                    public_id = resource['public_id']
                    break
        except Exception as e:
            current_app.logger.error(f"Error searching for file {identifier}: {str(e)}")
            return False
    
    if not public_id:
        current_app.logger.error(f"Could not determine public_id for: {identifier}")
        return False
    
    try:
        # Delete from Cloudinary
        result = cloudinary.uploader.destroy(public_id)
        success = result.get('result') == 'ok'
        if success:
            current_app.logger.info(f"Successfully deleted {public_id} from Cloudinary")
        else:
            current_app.logger.warning(f"Cloudinary reported non-OK result: {result}")
        return success
    except Exception as e:
        current_app.logger.error(f"Cloudinary delete error: {str(e)}")
        return False

def extract_first_image_url(html_content):
    """
    Extract the first image URL from HTML content
    
    Args:
        html_content: HTML content to extract image from
        
    Returns:
        str: URL of first image or None if no image found
    """
    if not html_content:
        return None
        
    # Use regex to find the first img tag and extract its src attribute
    match = re.search(r'<img[^>]+src=["\'](.*?)["\']', html_content)
    if match:
        return match.group(1)
    return None
