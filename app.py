from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/scrape', methods=['POST'])
def scrape():
    request_data = request.get_json()
    if 'url' in request_data:
        url = request_data['url']
        # TODO implement
        text = f"Scraped from {url}:\ndummy text"
        return jsonify({"text": text}), 200
    else:
        return jsonify({"error": "URL not found in request body"}), 400

@app.route('/scrape_soup', methods=['POST'])
def scrape_soup():
    request_data = request.get_json()
    if 'url' in request_data:
        url = request_data['url']
        # TODO implement
        soup = f"dummy bs4 soup converted to string"
        return jsonify({"text": soup}), 200
    else:
        return jsonify({"error": "URL not found in request body"}), 400


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
