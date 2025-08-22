package com.jl.flexshare.member.controller;


import com.jl.flexshare.member.result.ErrorType;
import com.jl.flexshare.member.result.Result;
import com.jl.flexshare.member.entity.User;
import com.jl.flexshare.member.result.ResultError;
import com.jl.flexshare.member.service.UserService;
import com.jl.flexshare.member.validation.LoginGroup;
import com.jl.flexshare.member.validation.SignUpGroup;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<Result> register(@Validated({SignUpGroup.class}) @RequestBody User user) {
        System.out.println(user);
        boolean res = userService.save(user);
        Result result =res?
                Result.success()
                :Result.error(ResultError.error(ErrorType.Sign_up_failed));
        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    public ResponseEntity login(@Validated({LoginGroup.class}) @RequestBody User user) {
        boolean res = userService.loginMember(user);
        System.out.println(res);
        Result result =res?
                Result.success()
                :Result.error(ResultError.error(ErrorType.Login_failed));
        return ResponseEntity.ok(result);
    }
}

