import{SQSClient, ReceiveMessageCommand, DeleteMessageCommand} from "@aws-sdk/client-sqs";

const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/576607007622/gpsInfoQueue"
const REGION = "us-east-1"
const POLL = 5 //polls every 5 seconds

//Create sqs client
const sqs = new SQSClient({region:REGION})
async function pollMessages() {
    console.log("Listening for messages from SQS...");
    while(true){
        try{
            //Receive 10 messages (at once)
            const response = await sqs.send(new ReceiveMessageCommand({QueueUrl:QUEUE_URL, MaxNumberOfMessages:10, WaitTimeSeconds:10,}));
            const messages = response.Messages || [];

            if(messages.length == 0){
                console.log("No messages. Waiting...");
            } else{
                for(const msg of messages){
                    const body = msg.Body;
                    const receiptHandle = msg.ReceiptHandle;
                    console.log('Received: ${body}'); //processing

                    //Delete messages from queue after processing
                    await sqs.send(new DeleteMessageCommand({QueueUrl:QUEUE_URL, ReceiptHandle:receiptHandle,}));
                    console.log("Messages deleted.");
                }
            }
        } catch(err){
            console.log("Error: ", err)
        }

        //Add a pause before polling again
        await new Promise(resolve=>setTimeout(resolve, POLL));
    }
}

pollMessages();