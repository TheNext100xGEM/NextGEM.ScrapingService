import uuid
from flask import Flask, request, jsonify
from threading import Semaphore
from logging.config import dictConfig
from scraper import get_text, get_soup

dictConfig({
    'version': 1,
    'formatters': {'default': {
        'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
    }},
    'handlers': {'wsgi': {
        'class': 'logging.StreamHandler',
        'stream': 'ext://flask.logging.wsgi_errors_stream',
        'formatter': 'default'
    }},
    'root': {
        'level': 'INFO',
        'handlers': ['wsgi']
    }
})

app = Flask(__name__)

# Maximum number of concurrent requests
LIMIT_REQUESTS = 2

# Semaphore to limit the number of concurrent requests
semaphore = Semaphore(LIMIT_REQUESTS)

@app.route('/scrape', methods=['POST'])
def scrape():
    with semaphore:
        taskid = str(uuid.uuid1())
        request_data = request.get_json()
        app.logger.info(f'[{taskid}] Request: {request_data}')

        if 'url' in request_data:
            url = request_data['url']
            text = get_text(url, taskid, app.logger)

            app.logger.info(f'[{taskid}] Processing done')
            return jsonify({"text": text}), 200
        else:
            app.logger.info(f'[{taskid}] Error: URL not found in request body')
            return jsonify({"error": "URL not found in request body"}), 400

@app.route('/scrape_soup', methods=['POST'])
def scrape_soup():
    with semaphore:
        taskid = str(uuid.uuid1())
        request_data = request.get_json()
        app.logger.info(f'[{taskid}] Request: {request_data}')

        if 'url' in request_data:
            url = request_data['url']
            soup = get_soup(url, taskid, app.logger)

            app.logger.info(f'[{taskid}] Processing done')
            return jsonify({"text": soup}), 200
        else:
            app.logger.info(f'[{taskid}] Error: URL not found in request body')
            return jsonify({"error": "URL not found in request body"}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')