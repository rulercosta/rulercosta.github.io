"""
Debug script to test API endpoints and identify issues
"""
import os
import sys
import logging
import requests
from urllib.parse import urljoin

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Test configuration
API_BASE_URL = "http://localhost:8000"  # Adjust if your server runs on a different port
ENDPOINTS = [
    "/health",
    "/api/auth/status",
    "/api/settings",
    "/api/pages"
]

def test_endpoint(endpoint):
    """Test a specific endpoint and report results"""
    url = urljoin(API_BASE_URL, endpoint)
    logger.info(f"Testing endpoint: {url}")
    
    try:
        response = requests.get(url)
        logger.info(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            logger.info("Response OK!")
            try:
                data = response.json()
                logger.info(f"Response data: {data}")
            except requests.exceptions.JSONDecodeError:
                logger.info(f"Response text: {response.text}")
        else:
            logger.error(f"Error response: {response.text}")
        
        return response.status_code == 200
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        return False

def check_environment():
    """Check environment variables"""
    logger.info("Checking environment variables...")
    required_vars = [
        "SECRET_KEY",
        "DATABASE_URL",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET"
    ]
    
    for var in required_vars:
        value = os.environ.get(var)
        if value:
            logger.info(f"✓ {var} is set")
        else:
            logger.warning(f"✗ {var} is NOT set")

def check_database():
    """Check database connection"""
    logger.info("Checking database connection...")
    
    try:
        # Import database modules
        from app.models.database import get_db
        from app import create_app
        
        # Create a minimal app context
        app = create_app('testing')
        with app.app_context():
            db = get_db()
            # Try a simple query
            result = db.execute('SELECT 1').fetchone()
            if result:
                logger.info("✓ Database connection successful")
            else:
                logger.error("✗ Database query returned no results")
    except Exception as e:
        logger.error(f"✗ Database connection failed: {str(e)}")

if __name__ == "__main__":
    print("\n===== API ENDPOINT DEBUGGING TOOL =====\n")
    
    # Check environment and database first
    check_environment()
    check_database()
    
    print("\n===== TESTING API ENDPOINTS =====\n")
    
    # Test each endpoint
    success = 0
    for endpoint in ENDPOINTS:
        if test_endpoint(endpoint):
            success += 1
        print()  # Add spacing between tests
    
    # Summary
    logger.info(f"Tests completed: {success}/{len(ENDPOINTS)} endpoints working correctly")
    
    if success < len(ENDPOINTS):
        logger.info("\nTroubleshooting tips:")
        logger.info("1. Check your application logs for specific error messages")
        logger.info("2. Ensure database migrations have been applied")
        logger.info("3. Verify all environment variables are set correctly")
        logger.info("4. Ensure required tables exist in the database")
        sys.exit(1)
    else:
        logger.info("All endpoints are working correctly!")
