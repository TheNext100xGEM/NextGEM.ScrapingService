# Use a Python base image
FROM python:3.11

# Set the working directory inside the container
WORKDIR /app

# Hack to install chromium dependencies
RUN apt-get update && apt-get install -y \
    unzip \
    wget \
    && rm -rf /var/lib/apt/lists/*
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Install Chromium
COPY install-browser.sh .
RUN /usr/bin/bash install-browser.sh

# Copy the requirements.txt file into the container
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the config file with secret keys into the container
COPY config.json .

# Copy the Flask app code into the container
COPY app.py .

# Copy the scraper code into the container
COPY scraper.py .

# Expose the Flask app's port
EXPOSE 5000

# Command to run the Flask app
CMD ["python", "app.py"]