package com.jl.flexshare.member.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jl.flexshare.member.entity.GeoPoint;
import com.jl.flexshare.member.entity.GeoPointInfo;
import com.jl.flexshare.member.entity.Schedule;
import com.jl.flexshare.member.utils.Utils;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class RedisService {
    @Getter
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private Environment env;



    public String setEmailVerification(String email){
        String code = Utils.generateMailVerificationCode(6);
        set_temp(email,code,1,TimeUnit.MINUTES);
        return code;
    }
    @Async
    public void set(String key, Object value) {
        redisTemplate.opsForValue().set(key, value);
    }

    @Async
    public void set_temp(String key, Object value, long time, TimeUnit timeUnit) {
        redisTemplate.opsForValue().set(key, value,time,timeUnit);
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

    static final String GEO_ROUTE_POINT="GEO_ROUTE_POINT_DRIVER";
    public void addRoutePoint(String pointId, double longitude, double latitude) {
        redisTemplate.opsForGeo().add(GEO_ROUTE_POINT,new Point(longitude,latitude),pointId);
    }
    public void removeRoutePoint(Schedule schedule) throws JsonProcessingException {

        Long scheduleId = schedule.getSchedule_id();


        if (schedule == null || schedule.getRoute_points() == null) {
            return; 
        }
        List<GeoPoint> routePoints = schedule.getRoute_points();
        List<Object> geoKeys = new ArrayList<>();
        for (int i = 0; i < routePoints.size(); i++) {
            geoKeys.add(scheduleId + ":" + i);
        }
        redisTemplate.opsForGeo().remove(GEO_ROUTE_POINT, geoKeys.toArray());
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
                redisTemplate.opsForGeo().radius("GEO_ROUTE_POINT_DRIVER", new Circle(center, radius), args);
        ArrayList<String> schedules = new ArrayList<>();
        if (results != null && !results.getContent().isEmpty()) {
            List<GeoResult<RedisGeoCommands.GeoLocation<Object>>> content = results.getContent();
            for (int i = 0; i < content.size(); i++) {
                GeoResult<RedisGeoCommands.GeoLocation<Object>> geoLocationGeoResult = content.get(i);
                String schedule = (String) geoLocationGeoResult.getContent().getName();
                String[] split = schedule.split(":");
                schedules.add(split[0]);
            }
            return new LinkedHashSet<>(schedules);
        }
        return null;
    }

    public void setTimeOut(String key, long time, TimeUnit unit){
        redisTemplate.expire(key,time,unit);
    }

    public boolean checkVerification(String email,String mailVerification){

        Object o = get(email);
        if(null==o || (!String.valueOf(o).equals(mailVerification))){
          return false;
        }
        else
            return true;
    }

    public void addList(String key, String value){
        redisTemplate.opsForList().rightPush(key, value);
    }

    public Long removeList(String key, String value){
        return redisTemplate.opsForList().remove(key, 0, value);
    }


    private static final String LOCK_KEY = "lock:resource";

    public boolean tryLockWithWait(String key, String uuid, long expireSeconds, long waitMillis) {
        long end = System.currentTimeMillis() + waitMillis;
        while (System.currentTimeMillis() < end) {
            Boolean success = redisTemplate.opsForValue()
                    .setIfAbsent(key, uuid, Duration.ofSeconds(expireSeconds));
            if (Boolean.TRUE.equals(success)) return true;
            try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }
        return false;
    }

    public void unlock(String key, String uuid) {
        String value = (String) redisTemplate.opsForValue().get(key);
        if (uuid.equals(value)) redisTemplate.delete(key);
    }

}
