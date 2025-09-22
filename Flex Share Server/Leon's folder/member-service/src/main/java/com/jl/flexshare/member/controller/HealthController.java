package com.jl.flexshare.member.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.jl.flexshare.member.entity.Schedule;
import com.jl.flexshare.member.result.Result;
import jakarta.servlet.ServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/health")
public class HealthController {
    @PostMapping("check")
    public ResponseEntity<Result> check(){
        return ResponseEntity.ok(Result.success());
    }
}
