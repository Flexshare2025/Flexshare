import logging
import redis
import os
import time
import json

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Load Redis configuration from environment variables
REDIS_HOST = os.environ["REDIS_HOST"]
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_PASSWORD = os.environ["REDIS_PASSWORD"]
CACHE_TTL = 3600  # Time-to-live for Redis keys in seconds

# Function to connect to Redis
def connect_redis():
    try:
        logger.info("Connecting to Redis at %s:%s", REDIS_HOST, REDIS_PORT)
        r = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            password=REDIS_PASSWORD,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5
        )
        r.ping()  # Test connection
        logger.info("Redis connection successful.")
        return r
    except Exception as e:
        logger.error("Redis connection failed: %s", str(e))
        raise

# Main Lambda handler function
def lambda_handler(event, context):
    records = event.get("Records", [])
    logger.info("Lambda triggered; number of records: %s", len(records))

    try:
        r = connect_redis()
    except Exception:
        logger.error("Aborting due to Redis connection failure.")
        return {"status": "error", "message": "Redis connection failed"}

    # Process each record from the event
    for rec in records:
        try:
            body = rec.get("body")
            logger.info("Raw message body: %s", body)

            # Parse the JSON message
            data = json.loads(body)
            logger.info("Parsed JSON: %s", json.dumps(data))

            # Extract fields from the message
            user_id = data.get("userID")
            auth = data.get("auth")
            role = data.get("role")
            schedule_id = data.get("scheduleId")
            lat = data.get("lat")
            lon = data.get("lon")

            logger.info(
                "Extracted fields - userID: %s, auth: %s, role: %s, scheduleId: %s, lat: %s, lon: %s",
                user_id, auth, role, schedule_id, lat, lon
            )

            # Construct Redis key using schedule ID and role
            redis_key = f"{schedule_id}:{role}"
            logger.info("Redis key to use: %s", redis_key)

            # Create the value to store in Redis (as JSON string)
            redis_value = json.dumps({
                "userId": user_id,
                "auth": auth,
                "lat": lat,
                "lon": lon,
                "timestamp": int(time.time())
            })
            logger.info("Redis value to store: %s", redis_value)

            # Push the value to the Redis list
            r.rpush(redis_key, redis_value)
            logger.info("Value pushed to Redis list.")

            # Set expiration time for the key
            r.expire(redis_key, CACHE_TTL)
            logger.info("Expiration set for key %s: %s seconds", redis_key, CACHE_TTL)

            # Confirm list length after push
            list_length = r.llen(redis_key)
            logger.info("Redis list length after push: %s", list_length)

        except Exception as e:
            logger.error("Failed to process record: %s", str(e))

    return {"status": "ok", "message": "Messages stored in Redis list"}
