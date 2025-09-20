import logging
import redis
import os
import json

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Load environment variables
try:
    REDIS_HOST = os.environ["REDIS_HOST"]
    REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
    REDIS_PASSWORD = os.environ["REDIS_PASSWORD"]
    logger.info("Environment variables loaded: REDIS_HOST=%s, REDIS_PORT=%d", REDIS_HOST, REDIS_PORT)
except KeyError as e:
    logger.error("Missing environment variable: %s", str(e))
    raise

def connect_redis():
    try:
        logger.info("Attempting Redis connection to %s:%d", REDIS_HOST, REDIS_PORT)
        r = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            password=REDIS_PASSWORD,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5
        )
        r.ping()
        logger.info("Redis connection established successfully.")
        return r
    except Exception as e:
        logger.exception("Redis connection failed.")
        raise

def lambda_handler(event, context):
    records = event.get("Records", [])
    logger.info("Lambda triggered. Total records received: %d", len(records))

    try:
        r = connect_redis()
    except Exception:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Redis connection failed"})
        }

    for idx, rec in enumerate(records):
        logger.info("Processing record #%d", idx)
        try:
            body = rec.get("body")
            logger.debug("Record body: %s", body)
            data = json.loads(body)

            user_id = data.get("userID")
            role = data.get("role")
            # gps = data.get("gps")
            lat = data.get("lat")
            lon = data.get("lon")
            schedule_id = data.get("scheduleId")

            logger.debug("Extracted fields: userId=%s, role=%s, lat=%s, lon=%s, scheduleId=%s",
                         user_id, role, lat, lon, schedule_id)

            redis_key_driver = f"{schedule_id}:driver"
            redis_key_passenger = f"{schedule_id}:passenger:{user_id}"

            # Determine which key to query based on role
            target_key = redis_key_passenger if role == "driver" else redis_key_driver
            logger.info("Selected Redis key based on role '%s': %s", role, target_key)

            existing_data = r.get(target_key)
            logger.info("Retrieved data from Redis key '%s': %s", target_key, existing_data)

            gps_list = []
            if existing_data:
                try:
                    entry = json.loads(existing_data)
                    gps_list.append({
                        "userId": entry.get("userId"),
                        "lat": entry.get("gps", {}).get("lat"),
                        "lon": entry.get("gps", {}).get("lon"),
                        "timestamp": entry.get("timestamp")  # Optional
                    })
                except json.JSONDecodeError as je:
                    logger.warning("Failed to decode Redis entry: %s", str(je))

            if not gps_list:
                logger.warning("No GPS data found for opposite role.")
                return {
                    "statusCode": 404,
                    "body": json.dumps({
                        "error": "No data found for opposite role",
                        "userId": user_id,
                        "role": role,
                        # "gps": gps,
                        "lat": lat,
                        "lon": lon,
                        "scheduleId": schedule_id
                    })
                }

            logger.info("Returning %d GPS entries for userId=%s", len(gps_list), user_id)
            return {
                "statusCode": 200,
                "body": json.dumps({
                    "status": "success",
                    "userId": user_id,
                    "role": role,
                    # "gps": gps,
                    "lat": lat,
                    "lon": lon,
                    "scheduleId": schedule_id,
                    "othersGPS": gps_list
                })
            }

        except Exception as e:
            logger.exception("Unhandled error while processing record #%d", idx)
            return {
                "statusCode": 500,
                "body": json.dumps({"error": "Internal error", "details": str(e)})
            }

    logger.warning("No valid records processed.")
    return {
        "statusCode": 400,
        "body": json.dumps({"error": "No valid records found"})
    }