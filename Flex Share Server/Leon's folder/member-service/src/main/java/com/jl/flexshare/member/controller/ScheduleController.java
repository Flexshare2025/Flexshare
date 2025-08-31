package com.jl.flexshare.member.controller;

import com.jl.flexshare.member.result.Result;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/schedule")
public class ScheduleController {

    @PostMapping("/create")
    public ResponseEntity<Result> createSchedule(){
        return null;
    }

    @PostMapping("/get")
    public ResponseEntity<Result> getSchedule(){
        return null;
    }

    @PostMapping("/getMap")
    public ResponseEntity<Result> getMapSchedule(){
        return null;
    }
}
