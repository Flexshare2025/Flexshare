package com.jl.flexshare.member.entity;
import com.fasterxml.jackson.annotation.JsonFormat;

import com.jl.flexshare.member.validation.CreateScheduleGroup;
import com.jl.flexshare.member.validation.LoginGroup;
import com.jl.flexshare.member.validation.SignUpGroup;
import lombok.Data;
import org.hibernate.validator.constraints.Length;


import org.hibernate.validator.constraints.Length;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Dictionary;
import java.util.HashMap;
import java.util.List;

@Data
public class Schedule {
    private Long schedule_id;
    private Long user_id;
    @NotBlank(message = "Must not be blank", groups ={CreateScheduleGroup.class})
    private GeoPointInfo start_point;
    @NotBlank(message = "Must not be blank", groups ={CreateScheduleGroup.class})
    private GeoPointInfo end_point;
    @Size(min = 5, message = "Route points must more then 5", groups ={CreateScheduleGroup.class})
    private List<GeoPoint> route_points;
    private List<GeoPoint> stops;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime departure_time;
    //private LocalDateTime end;
    @Min(value = 6, message = "Available seats must be more than 1", groups = {CreateScheduleGroup.class})
    private int available_seats;
    private int num_passenger;
    @Min(value = 1, message = "Available seats must be more than 1", groups = {CreateScheduleGroup.class})
    private float price_per_km;
    private List<String> passengerIDs;
    private HashMap<String,Schedule> passengerSchedules;
    private String status;
}


