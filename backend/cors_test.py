"""
Simple debug script to test CORS headers.
Run with: python cors_test.py
"""
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

# Configure CORS
CORS(app, 
     resources={r"/*": {"origins": "http://localhost:5173"}},
     supports_credentials=True)

@app.route('/status')
def status():
    return jsonify({
        'status': 'ok',
        'headers': dict(request.headers),
        'cookies': dict(request.cookies),
    })

if __name__ == '__main__':
    app.run(port=5001, debug=True)
