"""
WSGI entry point for the application
"""
import os
from dotenv import load_dotenv

if not os.environ.get("DATABASE_URL"): 
    load_dotenv()

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run()
