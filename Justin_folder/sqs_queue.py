import boto3
import time

QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/576607007622/gpsInfoQueue"
REGION = "us-east-1"
POLL = 5 #polls every 5 seconds

def main():
    #Create SQS client
    sqs = boto3.client("sqs", region_name=REGION)
    print("Listening for messages from SQS...")
    while True:
        try:
            #Receive messages (10 at once)
            response = sqs.receive_message(QueueUrl=QUEUE_URL, MaxNumberOfMessages=10, WaitTimeSeconds=10)
            messages = response.get("Messages", [])
            if not messages:
                print("No messages. Waiting...")
            else:
                for msg in messages:
                    body = msg["Body"]
                    receipt_handle = msg["ReceiptHandle"]

                    #Process the message
                    print(f"Received: {body}")
                    #Delete message from queue after processing
                    sqs.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=receipt_handle)
                    print("Message deleted.")
        except Exception as e:
            print(f"Error: {e}")

        #Pause before polling again
        time.sleep(POLL)

if __name__ == "__main__":
    main()