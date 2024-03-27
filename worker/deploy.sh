# Build the docker image
docker build -t us-central1-docker.pkg.dev/nextgem-selenium/scraper/selenium-worker:v0.0.2 .

# Push the docker image to the Google Cloud Registry
docker push us-central1-docker.pkg.dev/nextgem-selenium/scraper/selenium-worker:v0.0.2

# Deploy the worker to Cloud Run
kubectl apply -f ./kubernetes/deployment.yaml