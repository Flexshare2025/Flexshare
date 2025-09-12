package com.jl.flexshare.member.entity;
import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;


import java.time.LocalDateTime;
import java.util.Dictionary;
import java.util.HashMap;
import java.util.List;

@Data
public class Schedule {
    private Long schedule_id;
    private Long user_id;
    private GeoPointInfo start_point;
    private GeoPointInfo end_point;
    private List<GeoPoint> route_points;
    private List<GeoPoint> stops;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime departure_time;
    //private LocalDateTime end;
    private int available_seats;
    private int num_passenger;
    private float price_per_km;
    private List<String> passengerIDs;
    private HashMap<String,Schedule> passengerSchedules;
    private String status;
}


