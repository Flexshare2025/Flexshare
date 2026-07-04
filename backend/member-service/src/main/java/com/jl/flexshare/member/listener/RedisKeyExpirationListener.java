package com.jl.flexshare.member.listener;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.jl.flexshare.member.controller.ScheduleController;
import com.jl.flexshare.member.entity.Schedule;
import com.jl.flexshare.member.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.listener.KeyExpirationEventMessageListener;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;
import com.jl.flexshare.member.service.RedisService;

import jakarta.annotation.PostConstruct;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class RedisKeyExpirationListener {

    @Autowired
    private RedisService redisService;

    @Autowired
    private ScheduleController scheduleController;

    public void onMessage(Message message, byte[] pattern) {
        try {
            String expiredKey = message.toString();
            log.info("[RedisKeyExpirationListener] Key expired: {}", expiredKey);

            if (expiredKey.startsWith("schedule_start_flag")) {
                handleScheduleStarted(expiredKey);
            } else if(expiredKey.startsWith("schedule_timeout_flag")){
                handleScheduleTimeout(expiredKey);
            }
        } catch (Exception e) {
            log.error("[RedisKeyExpirationListener] Error handling expired key", e);
        }
    }

    private void handleScheduleStarted(String expiredKey) throws JsonProcessingException {
        String[] split = expiredKey.split(":");
        String scheduleId = split[1];
        Schedule schedule = scheduleController.getGlobalSchedule(scheduleId);
        if (schedule != null) {
            redisService.set_temp("schedule_timeout_flag:"+scheduleId,null,1, TimeUnit.DAYS);
            scheduleController.setScheduleStatus(ScheduleController.ScheduleStatus.started, schedule);
        }
    }
    private void handleScheduleTimeout(String expiredKey) throws JsonProcessingException {
        String[] split = expiredKey.split(":");
        String scheduleId = split[1];
        Schedule schedule = scheduleController.getGlobalSchedule(scheduleId);
        if (schedule != null) {
            scheduleController.setScheduleStatus(ScheduleController.ScheduleStatus.timeout, schedule);
        }
    }
}
