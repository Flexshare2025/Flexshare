package com.jl.flexshare.member.controller;

import com.jl.flexshare.member.result.Result;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/health")
public class HealthController {
    @GetMapping("/check")
    public ResponseEntity<Result> check(){
        return ResponseEntity.ok(Result.success());
    }
}
