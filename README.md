Before deploying make sure that you are logged in to google cloud

To login to Google Cloud, you can use the Google Cloud SDK. Follow the steps below:

1. Download and install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)

2. After installation, initialize the SDK. In your terminal, type:
  ```
  gcloud init
  ```
3. Follow the prompts to authorize the SDK to use your Google account, and select your project.

4. To confirm that you are logged in, you can use the command:
  ```
  gcloud auth list
  ```
This should list your email address and the project you are currently set to.

5. To set your project, use the command:
  ```
  gcloud config set project PROJECT_ID
  ```
Replace `PROJECT_ID` with your actual project ID.

6. Authenticate docker to gcloud to enable pushing of new images
  ```
  gcloud auth configure-docker
  ```

6. Then run the deploy.sh script inside the app's folder respectively
  ```
  ./deploy.sh
  ```