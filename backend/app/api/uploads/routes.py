"""
Routes for upload API
"""
import os
from flask import jsonify, request, current_app, send_from_directory
from werkzeug.utils import secure_filename
from app.api.auth.routes import login_required
import cloudinary
import cloudinary.uploader
from app.utils.helpers import get_uploaded_files, delete_uploaded_file
from . import bp

@bp.route('', methods=['POST'])
@login_required
def upload_file():
    """Handle file upload"""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    try:
        if current_app.config['CLOUDINARY_CLOUD_NAME']:
            # Use Cloudinary
            result = cloudinary.uploader.upload(file)
            return jsonify({
                "url": result['secure_url'],
                "success": True
            })
        else:
            # Use local storage
            filename = secure_filename(file.filename)
            uploads_dir = os.path.join(current_app.instance_path, 'uploads')
            os.makedirs(uploads_dir, exist_ok=True)
            file.save(os.path.join(uploads_dir, filename))
            return jsonify({
                "url": f"/api/uploads/{filename}",
                "success": True
            })
    except Exception as e:
        current_app.logger.error(f"Upload error: {str(e)}")
        return jsonify({"error": "Failed to upload file"}), 500

@bp.route('/list', methods=['GET'])
def list_files():
    """
    List all uploaded files from Cloudinary
    
    Returns:
        JSON response with file list
    """
    # Check if Cloudinary is configured
    if not current_app.config.get('CLOUDINARY_CLOUD_NAME') or not current_app.config.get('CLOUDINARY_API_KEY'):
        return jsonify([]), 200  # Return empty array if not configured
    
    files = get_uploaded_files()
    return jsonify(files), 200

@bp.route('/<path:identifier>', methods=['DELETE'])
@login_required
def delete_file(identifier):
    """
    Delete an uploaded file from Cloudinary
    
    Args:
        identifier: URL, public_id or filename to delete
        
    Returns:
        JSON response with deletion status
    """
    # Check if Cloudinary is configured
    if not current_app.config.get('CLOUDINARY_CLOUD_NAME') or not current_app.config.get('CLOUDINARY_API_KEY'):
        return jsonify({'error': 'Image uploads are not configured properly'}), 500
    
    if delete_uploaded_file(identifier):
        return jsonify({
            'success': True,
            'message': 'File deleted successfully from Cloudinary'
        }), 200
    else:
        return jsonify({'error': 'File not found or could not be deleted'}), 404

@bp.route('/<filename>')
def serve_file(filename):
    """Serve uploaded files"""
    if current_app.config['CLOUDINARY_CLOUD_NAME']:
        return jsonify({"error": "File not found"}), 404
    return send_from_directory(
        os.path.join(current_app.instance_path, 'uploads'),
        filename
    )
