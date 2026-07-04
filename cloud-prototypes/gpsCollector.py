import json
import boto3
import os

# Initialize the SQS client
sqs = boto3.client("sqs")

# Retrieve the SQS queue URL from environment variables
QUEUE_URL = os.environ.get("QUEUE_URL")

def lambda_handler(event, context):
    try:
        print("Received event:", json.dumps(event))

        if not QUEUE_URL:
            raise ValueError("QUEUE_URL environment variable is missing")

        # Safely extract and parse the request body
        body_raw = event.get("body")
        if not body_raw:
            raise ValueError("Request body is missing")

        try:
            body = json.loads(body_raw)
        except json.JSONDecodeError:
            raise ValueError("Request body is not valid JSON")

        print("Parsed body:", json.dumps(body))

        # Extract fields from the body
        user_id = body.get("userID")
        auth = body.get("auth")
        role = body.get("role")
        schedule_id = body.get("scheduleId")
        gps_raw = body.get("GPS", "")
        print("GPS raw:", gps_raw)

        lat, lon = gps_raw.split(",") if "," in gps_raw else (None, None)
        print("Parsed GPS:", lat, lon)

        # Construct the message to send to SQS
        message = {
            "userID": user_id,
            "auth": auth,
            "role": role,
            "scheduleId": schedule_id,
            "lat": lat,
            "lon": lon
        }

        print("Message to SQS:", json.dumps(message))

        # Send the message to the SQS queue
        response = sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(message)
        )

        print("Message sent to SQS:", response["MessageId"])

        # Return a success response
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Data sent to SQS!",
                "messageId": response["MessageId"]
            })
        }

    except Exception as e:
        print("Error:", str(e))
        return {
            "statusCode": 400,
            "body": json.dumps({
                "error": "Bad request or internal error",
                "details": str(e)
            })
        }