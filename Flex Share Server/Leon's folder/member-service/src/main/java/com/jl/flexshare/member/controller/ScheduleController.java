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

import static com.jl.flexshare.member.controller.ScheduleController.ScheduleOperation.Cancel;
import static com.jl.flexshare.member.controller.ScheduleController.ScheduleOperation.Update_Time;

@RestController
@RequestMapping("/schedules")
public class ScheduleController {

    public static final String DRIVER_SCHEDULE_TABLE = "driver_Schedule:";
    public static final String PASSENGER_SCHEDULE_TABLE = "passenger_Schedule:";
    public static final String GLOBAL_SCHEDULE = "global_schedule:";

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

        //Validate schedule
        Result result = checkSchedule(schedule);
        if(null!=result)
            return ResponseEntity.ok(result);

        HttpServletRequest req = (HttpServletRequest) request;
        String driverId = req.getAttribute("userId").toString();
        initGlobalSchedule(schedule,driverId);
        setScheduleStatus(ScheduleStatus.pending,schedule);
        addScheduleList(UserType.driver,driverId,schedule);
        setScheduleTimeOutFlag(schedule);
        return ResponseEntity.ok(Result.success());
    }

    private Result checkSchedule(Schedule schedule) {
        LocalDateTime localDepartureTime = schedule.getDeparture_time();
        ZonedDateTime nzDepartureTime = localDepartureTime.atZone(ZoneId.of("Pacific/Auckland"));

        ZonedDateTime departureUtc = nzDepartureTime.withZoneSameInstant(ZoneId.of("UTC"));
        ZonedDateTime nowUtc = ZonedDateTime.now(ZoneId.of("UTC"));

        Duration duration = Duration.between(nowUtc, departureUtc);
        long seconds = duration.getSeconds();

        if (seconds < 5*60) {
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
        System.out.println(secondsUntilExpire+":"+nzDepartureTime);
        if (secondsUntilExpire > 60) {
            redisService.set_temp(key, null, secondsUntilExpire, TimeUnit.SECONDS);
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

    /**
     * Match available schedules.
     * This is call by passenger.
     * @param schedule
     * @param request
     * @return
     * @throws JsonProcessingException
     */
    @PostMapping("/match")
    public ResponseEntity<Result> matchSchedule(@RequestBody Schedule schedule, ServletRequest request) throws JsonProcessingException {

        ArrayList<Schedule> matchSchedules = getMatchSchedules(1000, Metrics.KILOMETERS, schedule.getStart_point());
        return ResponseEntity.ok(Result.success(matchSchedules));
    }

    /**
     * Book a schedule.
     * Call by passenger.
     * @param passengerSchedule
     * @param request
     * @return
     * @throws JsonProcessingException
     * @throws MessagingException
     * @throws UnsupportedEncodingException
     */
    @PostMapping("/book")
    public ResponseEntity<Result> bookSchedule(@RequestBody Schedule passengerSchedule, ServletRequest request) throws JsonProcessingException, MessagingException, UnsupportedEncodingException {
        String scheduleId = passengerSchedule.getSchedule_id().toString();
        return this.doBookSchedule(scheduleId, passengerSchedule, request);    }

    /**
     * This is call to cancel from passenger.
     * @param schedule
     * @param request
     * @return
     * @throws JsonProcessingException
     * @throws MessagingException
     * @throws UnsupportedEncodingException
     */
    @PostMapping("/cancel")
    public ResponseEntity<Result> cancelSchedule(@RequestBody Schedule schedule, ServletRequest request) throws JsonProcessingException, MessagingException, UnsupportedEncodingException {
        String scheduleId = schedule.getSchedule_id().toString();
        return this.doCancelSchedule(scheduleId, schedule, request);
    }

    @RedisLock(key = "'schedule_lock'+#scheduleId", expire = 3000)
    public ResponseEntity<Result> doCancelSchedule(String scheduleId,Schedule schedule, ServletRequest request) throws JsonProcessingException, MessagingException, UnsupportedEncodingException {
        HttpServletRequest req = (HttpServletRequest) request;
        String userId = req.getAttribute("userId").toString();
        Schedule globalSchedule = getGlobalSchedule(scheduleId);
        if (!globalSchedule.getStatus().equals("pending"))
            return ResponseEntity.ok(Result.error(ResultError.info(ErrorType.Modify_due_schedule)));
        Schedule newSchedule = removePassenger(globalSchedule, userId);
        updateSchedule(newSchedule,false);
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

    public void setScheduleStatus(ScheduleStatus status,Schedule schedule) throws JsonProcessingException {
        if (status==ScheduleStatus.pending)
        {
            //set time out key
            setScheduleTimeOut(schedule);
            redisService.save(schedule.getSchedule_id()+":timeout",schedule.getDeparture_time());
            schedule.setStatus("pending");
            addDriverRoutePoints(schedule);
        }
        else if (status==ScheduleStatus.cancel){
            schedule.setStatus("cancel");
            redisService.removeRoutePoint(schedule);
        }
        else if (status==ScheduleStatus.started){
            schedule.setStatus("started");
            redisService.removeRoutePoint(schedule);
        }
        else if (status==ScheduleStatus.timeout){
            schedule.setStatus("timeout");
        }
        updateSchedule(schedule,false);
    }


    /**
     * Set a redis time-out param for the new schedule.
     * @param schedule
     */
    private void setScheduleTimeOut(Schedule schedule) {
        LocalDateTime localDepartureTime = schedule.getDeparture_time();
        ZonedDateTime nzDepartureTime = localDepartureTime.atZone(ZoneId.of("Pacific/Auckland"));
        ZonedDateTime departureUtc = nzDepartureTime.withZoneSameInstant(ZoneId.of("UTC"));
        ZonedDateTime nowUtc = ZonedDateTime.now(ZoneId.of("UTC"));
        long secondsUntilExpire = Duration.between(nowUtc, departureUtc).getSeconds();

        if (secondsUntilExpire > 0) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of("UTC"));
            String formattedTime = formatter.format(departureUtc);

            redisService.set_temp(
                    schedule.getSchedule_id() + ":timeout",
                    formattedTime,
                    secondsUntilExpire,
                    TimeUnit.SECONDS
            );
        }
    }



    @RedisLock(key = "'schedule_lock'+#scheduleId", expire = 2000)
    public ResponseEntity<Result> doBookSchedule(String scheduleId,Schedule passengerSchedule, ServletRequest request) throws JsonProcessingException, MessagingException, UnsupportedEncodingException {
        HttpServletRequest req = (HttpServletRequest) request;
        String userId = req.getAttribute("userId").toString();

        Schedule driverSchedule = getGlobalSchedule(String.valueOf(passengerSchedule.getSchedule_id()));

        driverSchedule=filterInvalidSchedule(driverSchedule);
        if (!driverSchedule.getStatus().equals("pending"))
            return ResponseEntity.ok(Result.error(ResultError.info(ErrorType.Duplicate_schedule)));


        List<String> passengers = driverSchedule.getPassengerIDs();
        if (passengers!=null&&passengers.contains(userId))
            return ResponseEntity.ok(Result.error(ResultError.info(ErrorType.Duplicate_schedule)));

        List<String> passengerIDs=new ArrayList<>();
        passengerIDs.add(userId);
        passengerSchedule.setPassengerIDs(passengerIDs);
        if (!checkSeat(driverSchedule,passengerSchedule)){
            return ResponseEntity.ok(Result.error(ResultError.info(ErrorType.Seat_not_enough)));
        }

        Schedule updateSchedule = addPassenger(driverSchedule, passengerSchedule);
        updateSchedule(updateSchedule,false);
        redisService.addList(userId, String.valueOf(driverSchedule.getSchedule_id()));

        addScheduleList(UserType.passenger,userId,updateSchedule);

        //book success
        User driver = userService.getUserById(driverSchedule.getUser_id());
        mailService.send(driver.getEmail(),"Your schedule has been book!",
                "passenger amount:"+passengerSchedule.getNum_passenger()+","
                        +"details please see on app."
        );
        return ResponseEntity.ok(Result.success(updateSchedule));
    }


    public Schedule getGlobalSchedule(String scheduleId) throws JsonProcessingException {
        Object o = redisService.get(GLOBAL_SCHEDULE+scheduleId);
        if (null != o) {
            return objectMapper.convertValue(o, Schedule.class);
        }
        return null;
    }



    private boolean checkSeat(Schedule driverSchedule, Schedule passengerSchedule) {
        if (driverSchedule.getAvailable_seats()<passengerSchedule.getNum_passenger()) {
            return false;
        }
        return true;
    }

    private Schedule addPassenger(Schedule driverSchedule, Schedule passengerSchedule) {
        List<String> passengerIDs = driverSchedule.getPassengerIDs();
        if (passengerIDs==null)
            passengerIDs=new ArrayList<>();
        String passengerId = passengerSchedule.getPassengerIDs().get(0);
        driverSchedule.setAvailable_seats(driverSchedule.getAvailable_seats()-passengerSchedule.getNum_passenger());
        passengerIDs.add(passengerId);
        driverSchedule.setPassengerIDs(passengerIDs);
        driverSchedule.setNum_passenger(driverSchedule.getNum_passenger() + passengerSchedule.getNum_passenger());
        List<GeoPoint> stops = driverSchedule.getStops();
        stops.addAll(passengerSchedule.getStops());
        driverSchedule.setStops(stops);
        HashMap<String, Schedule> passengerSchedules = driverSchedule.getPassengerSchedules();
        if (passengerSchedules==null)
            passengerSchedules=new HashMap<>();
        passengerSchedules.put(passengerId,passengerSchedule);
        driverSchedule.setPassengerSchedules(passengerSchedules);
        return driverSchedule;
    }

    private Schedule removePassenger(Schedule driverSchedule, String passengerId) {
        List<String> passengerIDs = driverSchedule.getPassengerIDs();
        if (passengerIDs != null && passengerIDs.contains(passengerId)) {
            passengerIDs.remove(passengerId);
            driverSchedule.setPassengerIDs(passengerIDs);

            Schedule passengerSchedule = driverSchedule.getPassengerSchedules().remove(passengerId);
            if (passengerSchedule != null) {
                int numToRemove = passengerSchedule.getNum_passenger();
                driverSchedule.setAvailable_seats(driverSchedule.getAvailable_seats() + numToRemove);
                driverSchedule.setNum_passenger(driverSchedule.getNum_passenger() - numToRemove);

                List<GeoPoint> driverStops = driverSchedule.getStops();
                List<GeoPoint> passengerStops = passengerSchedule.getStops();

                for (GeoPoint stop : passengerStops) {
                    boolean usedByOthers = false;
                    for (String otherPassengerId : driverSchedule.getPassengerIDs()) {
                        Schedule otherSchedule = driverSchedule.getPassengerSchedules().get(otherPassengerId);
                        if (otherSchedule != null && otherSchedule.getStops().contains(stop)) {
                            usedByOthers = true;
                            break;
                        }
                    }
                    if (!usedByOthers) {
                        driverStops.remove(stop);
                    }
                }

                driverSchedule.setStops(driverStops);
            }
        }
        return driverSchedule;
    }



    public ArrayList<Schedule> getMatchSchedules(double range, Metrics metrics, GeoPointInfo point) throws JsonProcessingException {
        LinkedHashSet<String> nearestPoints = redisService.findNearestPoints(range, metrics, point);
        if (nearestPoints==null)
            return null;
        ArrayList<Schedule> schedules = new ArrayList<>();
        for (String scheduleId : nearestPoints) {
            Schedule schedule = getGlobalSchedule(scheduleId);
            schedule=filterInvalidSchedule(schedule);
            if (null != schedule && schedule.getStatus().equals("pending")) {
                if (schedule.getAvailable_seats()>0)
                    schedules.add(schedule);

            }
        }

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
