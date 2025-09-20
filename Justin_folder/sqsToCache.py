import json
import redis
import os
import logging
import time

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Redis configuration
redis_host = os.environ['REDIS_HOST']
redis_port = int(os.environ.get('REDIS_PORT', 6379))
redis_password = os.environ.get('REDIS_PASSWORD')

# Attempt to connect to Redis
try:
    logger.info("Attempting to connect to Redis at %s:%s", redis_host, redis_port)
    redis_client = redis.Redis(
        host=redis_host,
        port=redis_port,
        password=redis_password,
        decode_responses=True,
        socket_connect_timeout=5
    )
    redis_client.ping()
    logger.info("Successfully connected to Redis")
except Exception as e:
    logger.error("Failed to connect to Redis: %s", str(e))
    raise

def lambda_handler(event, context):
    records = event.get("Records", [])
    logger.info("Lambda triggered with %d record(s)", len(records))
    results = []

    for idx, record in enumerate(records):
        try:
            logger.info("Processing record #%d", idx + 1)
            body_raw = record.get("body", "{}")
            logger.info("Raw message body: %s", body_raw)

            # Parse JSON body
            body = json.loads(body_raw)
            userId = body['userID']
            scheduleId = body['scheduleId']
            role = body['role']  # "driver" or "passenger"
            # gps = body['gps']
            lat = body['lat']
            lon = body['lon']

            logger.info("Extracted fields - userId: %s, scheduleId: %s, role: %s, lat: %s, lon: %s",
                        userId, scheduleId, role, lat, lon)

            # Construct Redis keys
            redis_key_driver = f"{scheduleId}:driver"
            redis_key_passenger = f"{scheduleId}:passenger:{userId}"

            # Prepare Redis value
            redis_value = json.dumps({
                "userId": userId,
                "lat": lat,
                "lon": lon,
                "timestamp": int(time.time())
            })

            # Store data in Redis
            if role == 'driver':
                redis_client.setex(redis_key_driver, 3600, redis_value)
                logger.info("Driver data stored in Redis: key=%s, value=%s", redis_key_driver, redis_value)
            elif role == 'passenger':
                redis_client.setex(redis_key_passenger, 3600, redis_value)
                logger.info("Passenger data stored in Redis: key=%s, value=%s", redis_key_passenger, redis_value)

            # Fetch opposite role's data
            if role == 'driver':
                passenger_pattern = f"{scheduleId}:passenger:*"
                passenger_keys = redis_client.keys(passenger_pattern)
                logger.info("Found passenger keys: %s", passenger_keys)

                passenger_gps_list = []
                for key in passenger_keys:
                    val = redis_client.get(key)
                    if val:
                        passenger_gps_list.append(json.loads(val))
                        logger.info("Retrieved passenger data: %s", val)

                result = {
                    "role": role,
                    "userId": userId,
                    "lat": lat,
                    "lon": lon,
                    "passengers": passenger_gps_list
                }

            else:
                driver_gps = redis_client.get(redis_key_driver)
                driver_data = json.loads(driver_gps) if driver_gps else None
                logger.info("Retrieved driver data: %s", driver_data)

                result = {
                    "role": role,
                    "userId": userId,
                    "lat": lat,
                    "lon": lon,
                    "driver": driver_data
                }

            results.append(result)

        except Exception as e:
            logger.error("Failed to process record #%d: %s", idx + 1, str(e))
            results.append({"error": str(e)})

    logger.info("All records processed. Final result: %s", json.dumps(results))
    return {
        "statusCode": 200,
        "body": json.dumps(results)
    }