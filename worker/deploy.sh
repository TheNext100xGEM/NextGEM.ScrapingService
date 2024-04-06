# Build the docker image
docker build -t us-central1-docker.pkg.dev/nextgem-selenium/scraper/selenium-worker:v0.0.5 .

# Push the docker image to the Google Cloud Registry
docker push us-central1-docker.pkg.dev/nextgem-selenium/scraper/selenium-worker:v0.0.5

# Deploy the worker to Cloud Run
kubectl delete -f ./kubernetes/deployment.yaml

sleep 5

kubectl create -f ./kubernetes/deployment.yaml

# Restart the deployment
kubectl rollout restart deployment selenium-worker