package com.jl.flexshare.member.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.jl.flexshare.member.entity.GeoPoint;
import com.jl.flexshare.member.entity.GeoPointInfo;
import com.jl.flexshare.member.entity.Schedule;
import com.jl.flexshare.member.utils.Utils;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.concurrent.TimeUnit;
import lombok.Getter;
import org.springframework.data.geo.Circle;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.GeoResult;
import org.springframework.data.geo.GeoResults;
import org.springframework.data.geo.Metrics;
import org.springframework.data.geo.Point;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RedisService {

    private static final String GEO_ROUTE_POINT_KEY = "GEO_ROUTE_POINT_DRIVER";
    private static final int VERIFICATION_CODE_LENGTH = 6;
    private static final long VERIFICATION_TTL_MINUTES = 1L;

    @Getter
    private final RedisTemplate<String, Object> redisTemplate;

    public RedisService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public String setEmailVerification(String email) {
        String code = Utils.generateMailVerificationCode(VERIFICATION_CODE_LENGTH);
        set_temp(email, code, VERIFICATION_TTL_MINUTES, TimeUnit.MINUTES);
        return code;
    }

    public void set(String key, Object value) {
        redisTemplate.opsForValue().set(key, value);
    }

    public void set_temp(String key, Object value, long time, TimeUnit timeUnit) {
        redisTemplate.opsForValue().set(key, value, time, timeUnit);
    }

    public Object get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void save(String key, Object value) {
        redisTemplate.opsForValue().set(key, value);
    }

    public void remove(String key) {
        redisTemplate.delete(key);
    }

    public void pushToList(String key, Object value) {
        redisTemplate.opsForList().leftPush(key, value);
    }

    public Object popFromList(String key) {
        return redisTemplate.opsForList().leftPop(key);
    }

    public void addRoutePoint(String pointId, double longitude, double latitude) {
        redisTemplate.opsForGeo().add(GEO_ROUTE_POINT_KEY, new Point(longitude, latitude), pointId);
    }

    public void removeRoutePoint(Schedule schedule) throws JsonProcessingException {
        if (schedule == null || schedule.getRoute_points() == null) {
            return;
        }

        Long scheduleId = schedule.getSchedule_id();
        List<GeoPoint> routePoints = schedule.getRoute_points();
        List<Object> geoKeys = new ArrayList<>();
        for (int i = 0; i < routePoints.size(); i++) {
            geoKeys.add(scheduleId + ":" + i);
        }
        redisTemplate.opsForGeo().remove(GEO_ROUTE_POINT_KEY, geoKeys.toArray());
    }

    public LinkedHashSet<String> findNearestPoints(double range, Metrics metrics, GeoPointInfo point) {
        Point center = new Point(point.getLng(), point.getLat());
        Distance radius = new Distance(range, metrics);
        RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs()
                .includeCoordinates()
                .includeDistance()
                .sortAscending()
                .limit(1000);

        GeoResults<RedisGeoCommands.GeoLocation<Object>> results =
                redisTemplate.opsForGeo().radius(GEO_ROUTE_POINT_KEY, new Circle(center, radius), args);

        if (results == null || results.getContent().isEmpty()) {
            return new LinkedHashSet<>();
        }

        List<String> scheduleIds = new ArrayList<>();
        for (GeoResult<RedisGeoCommands.GeoLocation<Object>> result : results.getContent()) {
            String geoMember = String.valueOf(result.getContent().getName());
            scheduleIds.add(geoMember.split(":", 2)[0]);
        }

        return new LinkedHashSet<>(scheduleIds);
    }

    public void setTimeOut(String key, long time, TimeUnit unit) {
        redisTemplate.expire(key, time, unit);
    }

    public boolean checkVerification(String email, String mailVerification) {
        Object cachedCode = get(email);
        return cachedCode != null && String.valueOf(cachedCode).equals(mailVerification);
    }

    public void addList(String key, String value) {
        redisTemplate.opsForList().rightPush(key, value);
    }

    public Long removeList(String key, String value) {
        return redisTemplate.opsForList().remove(key, 0, value);
    }

    public boolean tryLockWithWait(String key, String uuid, long expireSeconds, long waitMillis) {
        long deadline = System.currentTimeMillis() + waitMillis;
        while (System.currentTimeMillis() < deadline) {
            Boolean success = redisTemplate.opsForValue().setIfAbsent(key, uuid, Duration.ofSeconds(expireSeconds));
            if (Boolean.TRUE.equals(success)) {
                return true;
            }

            try {
                Thread.sleep(50);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return false;
    }

    public void unlock(String key, String uuid) {
        Object value = redisTemplate.opsForValue().get(key);
        if (uuid.equals(value)) {
            redisTemplate.delete(key);
        }
    }
}
