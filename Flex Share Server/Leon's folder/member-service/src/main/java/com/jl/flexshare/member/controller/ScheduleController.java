package com.jl.flexshare.member.controller;
import java.time.ZonedDateTime;
import java.time.ZoneId;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jl.flexshare.member.entity.GeoPoint;
import com.jl.flexshare.member.entity.GeoPointInfo;
import com.jl.flexshare.member.entity.Schedule;
import com.jl.flexshare.member.entity.User;
import com.jl.flexshare.member.lock.RedisLock;
import com.jl.flexshare.member.result.ErrorType;
import com.jl.flexshare.member.result.Result;
import com.jl.flexshare.member.result.ResultError;
import com.jl.flexshare.member.service.MailService;
import com.jl.flexshare.member.service.RedisService;
import com.jl.flexshare.member.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.geo.Metrics;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.mail.MessagingException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.http.HttpServletRequest;
import java.io.UnsupportedEncodingException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static com.jl.flexshare.member.controller.ScheduleController.ScheduleOperation.Cancel;
import static com.jl.flexshare.member.controller.ScheduleController.ScheduleOperation.Update_Time;

@RestController
@RequestMapping("/schedules")
public class ScheduleController {
    private static final Logger logger = LoggerFactory.getLogger(ScheduleController.class);
    private static final String DRIVER_SCHEDULE_TABLE = "driver_Schedule:";
    private static final String PASSENGER_SCHEDULE_TABLE = "passenger_Schedule:";
    private static final String GLOBAL_SCHEDULE = "global_schedule:";

    @Autowired
    RedisService redisService;
    @Autowired
    private MailService mailService;
    @Autowired
    private UserService userService;


    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Create Schedule from driver.
     * @param schedule
     * @param request
     * @return
     * @throws JsonProcessingException
     */
    @PostMapping("/create")
    public ResponseEntity<Result> createSchedule(@RequestBody Schedule schedule, ServletRequest request) throws JsonProcessingException {
        logger.info("Received schedule creation request");

        Result result = checkSchedule(schedule);
        if (result != null) {
            logger.warn("Schedule validation failed: departure time too close");
            return ResponseEntity.ok(result);
        }

        HttpServletRequest req = (HttpServletRequest) request;
        String driverId = req.getAttribute("userId").toString();
        logger.info("Driver ID extracted: {}", driverId);

        initGlobalSchedule(schedule, driverId);
        logger.debug("Initialized global schedule with ID: {}", schedule.getSchedule_id());

        setScheduleStatus(ScheduleStatus.pending, schedule);
        logger.debug("Set schedule status to pending");

        addScheduleList(UserType.driver, driverId, schedule);
        logger.debug("Added schedule to driver's list");

        setScheduleTimeOutFlag(schedule);
        logger.info("Schedule timeout flag set successfully");

        return ResponseEntity.ok(Result.success());
    }

    private Result checkSchedule(Schedule schedule) {
        LocalDateTime localDepartureTime = schedule.getDeparture_time();
        ZonedDateTime nzDepartureTime = localDepartureTime.atZone(ZoneId.of("Pacific/Auckland"));
        ZonedDateTime departureUtc = nzDepartureTime.withZoneSameInstant(ZoneId.of("UTC"));
        ZonedDateTime nowUtc = ZonedDateTime.now(ZoneId.of("UTC"));

        long seconds = Duration.between(nowUtc, departureUtc).getSeconds();
        logger.debug("Departure time in UTC: {}, current UTC time: {}, seconds until departure: {}",
                departureUtc, nowUtc, seconds);

        if (seconds < 5 * 60) {
            logger.warn("Departure time is less than 5 minutes away");
            return Result.error(ResultError.info(ErrorType.Departure_time_too_late));
        }
        return null;
    }

    private void setScheduleTimeOutFlag(Schedule schedule) {
        String key = "schedule_start_flag:" + schedule.getSchedule_id();
        LocalDateTime localDepartureTime = schedule.getDeparture_time();
        ZonedDateTime nzDepartureTime = localDepartureTime.atZone(ZoneId.of("Pacific/Auckland"));
        ZonedDateTime departureUtc = nzDepartureTime.withZoneSameInstant(ZoneId.of("UTC"));
        ZonedDateTime nowUtc = ZonedDateTime.now(ZoneId.of("UTC"));
        long secondsUntilExpire = Duration.between(nowUtc, departureUtc).getSeconds();

        logger.debug("Setting timeout flag for schedule ID: {}. Expires in {} seconds at NZ time: {}",
                schedule.getSchedule_id(), secondsUntilExpire, nzDepartureTime);

        if (secondsUntilExpire > 60) {
            redisService.set_temp(key, null, secondsUntilExpire, TimeUnit.SECONDS);
            logger.info("Timeout flag stored in Redis with key: {}", key);
        } else {
            logger.warn("Schedule timeout too short to set Redis flag ({} seconds)", secondsUntilExpire);
        }
    }

    /**
     * Cancel schedule from diver.
     * @param schedule
     * @param request
     * @return
     * @throws JsonProcessingException
     */
    @PostMapping("/terminate")
    public ResponseEntity<Result> terminateSchedule(@RequestBody Schedule schedule, ServletRequest request) throws JsonProcessingException, MessagingException, UnsupportedEncodingException {
        String scheduleID = String.valueOf(schedule.getSchedule_id());
        Schedule dbSchedule = getGlobalSchedule(scheduleID);

        if (!dbSchedule.getStatus().equals("pending"))
            return ResponseEntity.ok(Result.error(ResultError.info(ErrorType.Modify_due_schedule)));

        setScheduleStatus(ScheduleStatus.cancel,dbSchedule);
        updateSchedule(dbSchedule,false);
        broadCastScheduleUpdate(Cancel,dbSchedule);
        return ResponseEntity.ok(Result.success());
    }

    /**
     * Get schedule list containing all schedules that owns by user.
     * Can be call both from passenger and driver.
     * Request must include a role filed.
     * @param request
     * @param user
     * @return
     * @throws JsonProcessingException
     */
    @PostMapping("/list")
    public ResponseEntity<Result> getSchedule(ServletRequest request, @RequestBody User user) throws JsonProcessingException {
        HttpServletRequest req = (HttpServletRequest) request;
        String userId = req.getAttribute("userId").toString();
        User.Role role = user.getRole();
        List<Schedule> allSchedules=new ArrayList<>();
        switch (role) {
            case driver: allSchedules = getAllSchedules(DRIVER_SCHEDULE_TABLE+userId,userId,false);break;
            case passenger: allSchedules =getAllSchedules(PASSENGER_SCHEDULE_TABLE+userId,userId,true);break;
        }
        return ResponseEntity.ok(Result.success(allSchedules));
    }
    @PostMapping("/match")
    public ResponseEntity<Result> matchSchedule(@RequestBody Schedule schedule, ServletRequest request) throws JsonProcessingException {
        logger.info("Passenger requested schedule match for start point: {}", schedule.getStart_point());

        ArrayList<Schedule> matchSchedules = getMatchSchedules(1000, Metrics.KILOMETERS, schedule.getStart_point());
        logger.debug("Found {} matching schedules", matchSchedules.size());

        return ResponseEntity.ok(Result.success(matchSchedules));
    }

    @PostMapping("/book")
    public ResponseEntity<Result> bookSchedule(@RequestBody Schedule passengerSchedule, ServletRequest request) throws JsonProcessingException, MessagingException, UnsupportedEncodingException {
        String scheduleId = passengerSchedule.getSchedule_id().toString();
        logger.info("Passenger attempting to book schedule ID: {}", scheduleId);

        return this.doBookSchedule(scheduleId, passengerSchedule, request);
    }

    @PostMapping("/cancel")
    public ResponseEntity<Result> cancelSchedule(@RequestBody Schedule schedule, ServletRequest request) throws JsonProcessingException, MessagingException, UnsupportedEncodingException {
        String scheduleId = schedule.getSchedule_id().toString();
        logger.info("Passenger attempting to cancel schedule ID: {}", scheduleId);

        return this.doCancelSchedule(scheduleId, schedule, request);
    }

    @RedisLock(key = "'schedule_lock'+#scheduleId", expire = 3000)
    public ResponseEntity<Result> doCancelSchedule(String scheduleId, Schedule schedule, ServletRequest request) throws JsonProcessingException, MessagingException, UnsupportedEncodingException {
        HttpServletRequest req = (HttpServletRequest) request;
        String userId = req.getAttribute("userId").toString();
        logger.info("Processing cancellation for schedule ID: {} by user ID: {}", scheduleId, userId);

        Schedule globalSchedule = getGlobalSchedule(scheduleId);
        logger.debug("Fetched global schedule with status: {}", globalSchedule.getStatus());

        if (!globalSchedule.getStatus().equals("pending")) {
            logger.warn("Cannot cancel schedule ID: {} because status is '{}'", scheduleId, globalSchedule.getStatus());
            return ResponseEntity.ok(Result.error(ResultError.info(ErrorType.Modify_due_schedule)));
        }

        Schedule newSchedule = removePassenger(globalSchedule, userId);
        logger.debug("Passenger ID: {} removed from schedule ID: {}", userId, scheduleId);

        updateSchedule(newSchedule, false);
        logger.info("Schedule ID: {} updated successfully after cancellation", scheduleId);

        return ResponseEntity.ok(Result.success());
    }





    public enum ScheduleOperation {
        Update_Time,
        Cancel
    }

    public enum ScheduleStatus {
        pending,
        cancel,
        started,
        timeout
    }

    public void setScheduleStatus(ScheduleStatus status, Schedule schedule) throws JsonProcessingException {
        logger.info("Setting schedule status to: {} for schedule ID: {}", status, schedule.getSchedule_id());

        switch (status) {
            case pending:
                logger.debug("Initializing timeout and route points for pending schedule");
                setScheduleTimeOut(schedule);
                redisService.save(schedule.getSchedule_id() + ":timeout", schedule.getDeparture_time());
                schedule.setStatus("pending");
                addDriverRoutePoints(schedule);
                break;

            case cancel:
                logger.warn("Schedule marked as cancelled: {}", schedule.getSchedule_id());
                schedule.setStatus("cancel");
                redisService.removeRoutePoint(schedule);
                break;

            case started:
                logger.info("Schedule started: {}", schedule.getSchedule_id());
                schedule.setStatus("started");
                redisService.removeRoutePoint(schedule);
                break;

            case timeout:
                logger.info("Schedule timed out: {}", schedule.getSchedule_id());
                schedule.setStatus("timeout");
                break;

            default:
                logger.warn("Unknown schedule status: {}", status);
                break;
        }

        updateSchedule(schedule, false);
        logger.debug("Schedule updated in Redis: {}", schedule.getSchedule_id());
    }

    private void setScheduleTimeOut(Schedule schedule) {
        ZonedDateTime departureUtc = schedule.getDeparture_time()
                .atZone(ZoneId.of("Pacific/Auckland"))
                .withZoneSameInstant(ZoneId.of("UTC"));
        ZonedDateTime nowUtc = ZonedDateTime.now(ZoneId.of("UTC"));
        long secondsUntilExpire = Duration.between(nowUtc, departureUtc).getSeconds();

        logger.debug("Setting timeout for schedule ID: {} in {} seconds", schedule.getSchedule_id(), secondsUntilExpire);

        if (secondsUntilExpire > 0) {
            String formattedTime = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                    .withZone(ZoneId.of("UTC"))
                    .format(departureUtc);

            redisService.set_temp(schedule.getSchedule_id() + ":timeout", formattedTime, secondsUntilExpire, TimeUnit.SECONDS);
            logger.info("Timeout set in Redis for schedule ID: {}", schedule.getSchedule_id());
        } else {
            logger.warn("Timeout not set: departure time already passed for schedule ID: {}", schedule.getSchedule_id());
        }
    }

    @RedisLock(key = "'schedule_lock'+#scheduleId", expire = 2000)
    public ResponseEntity<Result> doBookSchedule(String scheduleId, Schedule passengerSchedule, ServletRequest request) throws JsonProcessingException, MessagingException, UnsupportedEncodingException {
        String userId = ((HttpServletRequest) request).getAttribute("userId").toString();
        logger.info("User {} attempting to book schedule {}", userId, scheduleId);

        Schedule driverSchedule = getGlobalSchedule(scheduleId);
        driverSchedule = filterInvalidSchedule(driverSchedule);

        if (!"pending".equals(driverSchedule.getStatus())) {
            logger.warn("Schedule {} is not pending. Booking denied.", scheduleId);
            return ResponseEntity.ok(Result.error(ResultError.info(ErrorType.Duplicate_schedule)));
        }

        if (driverSchedule.getPassengerIDs() != null && driverSchedule.getPassengerIDs().contains(userId)) {
            logger.warn("User {} already booked schedule {}", userId, scheduleId);
            return ResponseEntity.ok(Result.error(ResultError.info(ErrorType.Duplicate_schedule)));
        }

        passengerSchedule.setPassengerIDs(Collections.singletonList(userId));

        if (!checkSeat(driverSchedule, passengerSchedule)) {
            logger.warn("Not enough seats for user {} on schedule {}", userId, scheduleId);
            return ResponseEntity.ok(Result.error(ResultError.info(ErrorType.Seat_not_enough)));
        }

        Schedule updatedSchedule = addPassenger(driverSchedule, passengerSchedule);
        updateSchedule(updatedSchedule, false);
        redisService.addList(userId, scheduleId);
        addScheduleList(UserType.passenger, userId, updatedSchedule);

        User driver = userService.getUserById(driverSchedule.getUser_id());
        mailService.send(driver.getEmail(), "Your schedule has been booked!",
                "Passenger amount: " + passengerSchedule.getNum_passenger() + ", details please see on app.");

        logger.info("Booking successful for user {} on schedule {}", userId, scheduleId);
        return ResponseEntity.ok(Result.success(updatedSchedule));
    }

    public Schedule getGlobalSchedule(String scheduleId) throws JsonProcessingException {
        logger.debug("Fetching global schedule from Redis: {}", scheduleId);
        Object o = redisService.get(GLOBAL_SCHEDULE + scheduleId);
        if (o != null) {
            logger.debug("Schedule found in Redis: {}", scheduleId);
            return objectMapper.convertValue(o, Schedule.class);
        }
        logger.warn("No schedule found in Redis for ID: {}", scheduleId);
        return null;
    }

    private boolean checkSeat(Schedule driverSchedule, Schedule passengerSchedule) {
        boolean enough = driverSchedule.getAvailable_seats() >= passengerSchedule.getNum_passenger();
        logger.debug("Checking seat availability: required={}, available={}, result={}",
                passengerSchedule.getNum_passenger(), driverSchedule.getAvailable_seats(), enough);
        return enough;
    }

    private Schedule addPassenger(Schedule driverSchedule, Schedule passengerSchedule) {
        String passengerId = passengerSchedule.getPassengerIDs().get(0);
        logger.info("Adding passenger {} to schedule {}", passengerId, driverSchedule.getSchedule_id());

        driverSchedule.setAvailable_seats(driverSchedule.getAvailable_seats() - passengerSchedule.getNum_passenger());
        driverSchedule.getPassengerIDs().add(passengerId);
        driverSchedule.setNum_passenger(driverSchedule.getNum_passenger() + passengerSchedule.getNum_passenger());
        driverSchedule.getStops().addAll(passengerSchedule.getStops());

        driverSchedule.getPassengerSchedules().put(passengerId, passengerSchedule);
        logger.debug("Passenger {} added successfully", passengerId);
        return driverSchedule;
    }

    private Schedule removePassenger(Schedule driverSchedule, String passengerId) {
        logger.info("Removing passenger {} from schedule {}", passengerId, driverSchedule.getSchedule_id());

        if (driverSchedule.getPassengerIDs().remove(passengerId)) {
            Schedule passengerSchedule = driverSchedule.getPassengerSchedules().remove(passengerId);
            if (passengerSchedule != null) {
                int numToRemove = passengerSchedule.getNum_passenger();
                driverSchedule.setAvailable_seats(driverSchedule.getAvailable_seats() + numToRemove);
                driverSchedule.setNum_passenger(driverSchedule.getNum_passenger() - numToRemove);

                List<GeoPoint> passengerStops = passengerSchedule.getStops();
                driverSchedule.getStops().removeIf(stop ->
                        passengerStops.contains(stop) &&
                                driverSchedule.getPassengerSchedules().values().stream()
                                        .noneMatch(s -> s.getStops().contains(stop))
                );

                logger.debug("Passenger {} removed and stops updated", passengerId);
            }
        } else {
            logger.warn("Passenger {} not found in schedule {}", passengerId, driverSchedule.getSchedule_id());
        }

        return driverSchedule;
    }

    public ArrayList<Schedule> getMatchSchedules(double range, Metrics metrics, GeoPointInfo point) throws JsonProcessingException {
        logger.info("Searching for schedules near point: {}", point);

        LinkedHashSet<String> nearestPoints = redisService.findNearestPoints(range, metrics, point);
        if (nearestPoints == null || nearestPoints.isEmpty()) {
            logger.warn("No nearby schedules found for point: {}", point);
            return new ArrayList<>();
        }

        ArrayList<Schedule> schedules = new ArrayList<>();
        for (String scheduleId : nearestPoints) {
            Schedule schedule = getGlobalSchedule(scheduleId);
            schedule = filterInvalidSchedule(schedule);
            if (schedule != null && "pending".equals(schedule.getStatus())) {
                schedules.add(schedule);
            }
        }

        logger.debug("Matched {} schedules near point: {}", schedules.size(), point);
        return schedules;
    }


    /**
     *
     * @param userId
     * @param checkUserValid check if the schedule contains valid user.
     * @return
     * @throws JsonProcessingException
     */
    public List<Schedule> getAllSchedules(String scheduleId,String userId,boolean checkUserValid) throws JsonProcessingException {

        List<Schedule> schedules=new ArrayList<>();
        List<Object> result = redisService.getRedisTemplate().opsForList().range(scheduleId, 0, -1);
        LinkedHashSet<Object> records = new LinkedHashSet<>(result);
        for (Object o : records) {
            Schedule schedule = getGlobalSchedule(o.toString());
            schedule=filterInvalidSchedule(schedule);
            if (!checkUserValid)
                schedules.add(schedule);
            else {

                List<String> passengerIDs = schedule.getPassengerIDs();
                if (passengerIDs!=null && passengerIDs.contains(userId)) {
                    schedules.add(getGlobalSchedule(o.toString()));
                }
                else {
                    Schedule filterSchedule = new Schedule();
                    filterSchedule.setSchedule_id(schedule.getSchedule_id());
                    filterSchedule.setDeparture_time(schedule.getDeparture_time());
                    filterSchedule.setStart_point(schedule.getStart_point());
                    filterSchedule.setEnd_point(schedule.getEnd_point());
                    filterSchedule.setStatus("invalid");
                    schedules.add(filterSchedule);
                }
            }
        }
        schedules.sort(Comparator.comparing(Schedule::getDeparture_time).reversed());
        return schedules;
    }


    public void updateSchedule(Schedule newSchedule,boolean setNewTimeoutFlag) throws JsonProcessingException {
        String key =GLOBAL_SCHEDULE+newSchedule.getSchedule_id();
        if(setNewTimeoutFlag)
            setScheduleTimeOutFlag(newSchedule);
        redisService.save(key,newSchedule);
    }

    public void initGlobalSchedule(Schedule schedule, String driverId) {
        Long scheduleId = schedule.getSchedule_id();

        if (scheduleId == null) {
            if (Boolean.FALSE.equals(redisService.getRedisTemplate().hasKey("scheduleId"))) {
                redisService.getRedisTemplate().opsForValue().set("scheduleId", 0L);
            }
            scheduleId = redisService.getRedisTemplate().opsForValue().increment("scheduleId", 1);
            schedule.setSchedule_id(scheduleId);
        }

        schedule.setUser_id(Long.valueOf(driverId));


        redisService.set(GLOBAL_SCHEDULE + scheduleId, schedule);
    }


    public void addDriverRoutePoints(Schedule schedule) {
        List<GeoPoint> routePoints = schedule.getRoute_points();
        Long scheduleId = schedule.getSchedule_id();
        for (int i = 0; i < routePoints.size(); i++) {
            redisService.addRoutePoint(scheduleId+":"+i,
                    routePoints.get(i).getLng(),
                    routePoints.get(i).getLat());
        }
    }

    public void addDriverSchedule(Schedule schedule) throws JsonProcessingException {
        redisService.set(String.valueOf(schedule.getSchedule_id()),objectMapper.writeValueAsString(schedule));
        addDriverRoutePoints(schedule);
    }

    public enum UserType{
        driver,
        passenger
    }


    private void addScheduleList(UserType type,String userId,Schedule schedule) {
        if (type==UserType.driver) {
            redisService.addList(DRIVER_SCHEDULE_TABLE+userId, String.valueOf(schedule.getSchedule_id()));
        }
        else
            redisService.addList(PASSENGER_SCHEDULE_TABLE+userId, String.valueOf(schedule.getSchedule_id()));
    }

    /**
     * Broadcast s
     * @param operation
     * @param schedule
     * @throws MessagingException
     * @throws UnsupportedEncodingException
     */
    public void broadCastScheduleUpdate(ScheduleOperation operation, Schedule schedule) throws MessagingException, UnsupportedEncodingException {
        List<String> passengerIDs = schedule.getPassengerIDs();
        if(passengerIDs==null){
            return;
        }
        if (operation==Cancel)
        {
            for (String passengerID : passengerIDs) {
                User user = userService.getUserById(Long.valueOf(passengerID));
                mailService.send(user.getEmail(),"Schedule cancel by driver.",
                        "We are sorry to inform you that your schedule on"+
                                schedule.getDeparture_time()+" has been cancel.");
            }
        }
        else if(operation==Update_Time){
            for (String passengerID : passengerIDs) {
                User user = userService.getUserById(Long.valueOf(passengerID));
                mailService.send(user.getEmail(),"Schedule Update.",
                        "We are sorry to inform you that your schedule on"+
                                schedule.getSchedule_id()+" has been update, please check in.");
            }
        }
    }

    /**
     * In case redis expire event not work sometimes, check and update schedule in the lazy way.
     * @param schedule
     * @return
     */
    public Schedule filterInvalidSchedule(Schedule schedule) throws JsonProcessingException {
        LocalDateTime now = LocalDateTime.now();
        ZonedDateTime zoneTimeNow = now.atZone(ZoneId.of("Pacific/Auckland"));
        ZonedDateTime departureZoneTime = schedule.getDeparture_time().atZone(ZoneId.of("Pacific/Auckland"));

        String status = schedule.getStatus();

        //check if current schedule out of starttime
        if(departureZoneTime.isAfter(zoneTimeNow)){
           return schedule;
        }

        boolean bOutOfDate=false;

        //check if is started or out of date (1 day after departure is out of date)
        if (departureZoneTime.plusDays(1).isBefore(zoneTimeNow))
            bOutOfDate=true;
        if (bOutOfDate){
            if (status.equals("timeout")||status.equals("cancel"))
                return schedule;
            else{
                schedule.setStatus("timeout");
                updateSchedule(schedule,false);
            }
        }

        if (status.equals("started")||status.equals("cancel"))
            return schedule;
        else{
            schedule.setStatus("started");
            updateSchedule(schedule,true);
            redisService.removeRoutePoint(schedule);
        }
        return schedule;
    }

}
