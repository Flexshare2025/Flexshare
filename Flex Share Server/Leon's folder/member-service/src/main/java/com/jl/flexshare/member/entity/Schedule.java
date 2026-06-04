package com.jl.flexshare.member.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.jl.flexshare.member.validation.CreateScheduleGroup;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import lombok.Data;

@Data
public class Schedule {

    private Long schedule_id;
    private Long user_id;

    @NotNull(message = "Start point is required", groups = CreateScheduleGroup.class)
    private GeoPointInfo start_point;

    @NotNull(message = "End point is required", groups = CreateScheduleGroup.class)
    private GeoPointInfo end_point;

    @Size(min = 5, message = "Route must include at least 5 points", groups = CreateScheduleGroup.class)
    private List<GeoPoint> route_points;

    private List<GeoPoint> stops;

    @NotNull(message = "Departure time is required", groups = CreateScheduleGroup.class)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime departure_time;

    @Min(value = 1, message = "Available seats must be greater than 0", groups = CreateScheduleGroup.class)
    private int available_seats;

    private int num_passenger;

    @Min(value = 1, message = "Price per kilometer must be greater than 0", groups = CreateScheduleGroup.class)
    private float price_per_km;

    private List<String> passengerIDs;
    private HashMap<String, Schedule> passengerSchedules;
    private String status;
}
