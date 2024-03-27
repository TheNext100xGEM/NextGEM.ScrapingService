# Build the docker image
docker build -t us-central1-docker.pkg.dev/nextgem-selenium/request-queue/middleman:v0.0.1 .

# Push the docker image to the Google Cloud Registry
docker push us-central1-docker.pkg.dev/nextgem-selenium/request-queue/middleman:v0.0.1

# Deploy the worker to Cloud Run
kubectl apply -f ./kubernetes/deployment.yaml