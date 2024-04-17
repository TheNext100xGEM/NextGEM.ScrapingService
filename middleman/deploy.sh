#!/bin/bash

# Build the docker image
docker build --no-cache -t us-central1-docker.pkg.dev/nextgem-selenium/request-queue/middleman:v0.0.7 .

# Push the docker image to the Google Cloud Registry
docker push us-central1-docker.pkg.dev/nextgem-selenium/request-queue/middleman:v0.0.7

# Deploy the redis server
kubectl apply -f ./kubernetes/redis.yaml

# Restart the deployment
kubectl rollout restart deployment redis

sleep 5

# Get the pod name of the redis server
pod_name=$(kubectl get pods | grep redis | awk '{print $1}')

# check whether redis server is ready or not
while true; do
  pong=$(kubectl exec $pod_name -c redis -- redis-cli ping)
  if [[ "$pong" == *"PONG"* ]]; then
    echo "Redis server is ready."
    break
  else
    echo "Waiting for Redis server to be ready..."
    sleep 5  # Adjust sleep time as needed
  fi
done

kubectl delete -f ./kubernetes/deployment.yaml

# Deploy the worker to Cloud Run
kubectl create -f ./kubernetes/deployment.yaml

# Restart the deployment
kubectl rollout restart deployment node