"""
Development server runner script with proper environment setup
"""
import os
from dotenv import load_dotenv
from app import create_app

# Load the development environment variables
load_dotenv('.env.development')  

# Adjust environment for development
os.environ['FLASK_ENV'] = 'development'
os.environ['FLASK_DEBUG'] = '1'

# Allow HTTP in development mode
os.environ['SESSION_COOKIE_SECURE'] = 'False'

# Import and run the app
app = create_app('development')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
