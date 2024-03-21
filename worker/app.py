import time
from flask import Flask, request, jsonify
from threading import Semaphore

app = Flask(__name__)

# Maximum number of concurrent requests
LIMIT_REQUESTS = 5

# Semaphore to limit the number of concurrent requests
semaphore = Semaphore(LIMIT_REQUESTS)

@app.route('/scrape', methods=['POST'])
def scrape():
    with semaphore:
        request_data = request.get_json()
        if 'url' in request_data:
            url = request_data['url']
            # Simulate processing time
            time.sleep(10)  # Dummy sleep function
            text = f"Scraped from {url}:\ndummy text"
            return jsonify({"text": text}), 200
        else:
            return jsonify({"error": "URL not found in request body"}), 400

@app.route('/scrape_soup', methods=['POST'])
def scrape_soup():
    with semaphore:
        request_data = request.get_json()
        if 'url' in request_data:
            url = request_data['url']
            # Simulate processing time
            time.sleep(10)  # Dummy sleep function
            soup = f"Scraped from {url} dummy bs4 soup converted to string"
            return jsonify({"text": soup}), 200
        else:
            return jsonify({"error": "URL not found in request body"}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
