import boto3
import requests
import os
from config import AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_BUCKET_NAME, AWS_REGION
# AWS S3 configuration


# Express backend URL
EXPRESS_BACKEND_URL = 'http://your-express-backend-url.com/upload'



def upload_to_s3(file_obj, bucket_name, object_name=None):
    if object_name is None:
        object_name = os.path.basename(file_obj.name)

    s3_client = boto3.client('s3', region_name=AWS_REGION,
                             aws_access_key_id=AWS_ACCESS_KEY,
                             aws_secret_access_key=AWS_SECRET_KEY)
    try:
        s3_client.upload_fileobj(file_obj, bucket_name, object_name)
        url = f"https://{bucket_name}.s3.{AWS_REGION}.amazonaws.com/{object_name}"
        return url
    except Exception as e:
        print(f"Error uploading {file_obj.name} to S3: {e}")
        return None

