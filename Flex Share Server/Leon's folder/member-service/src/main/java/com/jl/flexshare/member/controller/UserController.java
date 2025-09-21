package com.jl.flexshare.member.controller;
import com.alibaba.druid.sql.visitor.functions.If;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.jl.flexshare.member.result.ErrorType;
import com.jl.flexshare.member.result.Result;
import com.jl.flexshare.member.entity.User;
import com.jl.flexshare.member.result.ResultError;
import com.jl.flexshare.member.service.MailService;
import com.jl.flexshare.member.service.RedisService;
import com.jl.flexshare.member.service.UserService;
import com.jl.flexshare.member.validation.EmailVerificationGroup;
import com.jl.flexshare.member.validation.LoginGroup;
import com.jl.flexshare.member.validation.SignUpGroup;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.mail.MessagingException;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.io.UnsupportedEncodingException;
import java.util.concurrent.TimeUnit;


@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private BCryptPasswordEncoder encoder;

    @Autowired
    private RedisService redisService;

    @Autowired
    private MailService mailService;

    @PostMapping("/register")
    public ResponseEntity<Result> register(@Validated({SignUpGroup.class}) @RequestBody User user) {


        boolean ifValid = redisService.checkVerification(user.getEmail(), user.getMail_verification());
        if(!ifValid){
            return ResponseEntity.ok(
                    Result.error(
                            ResultError.info(
                                    ErrorType.Not_valid_verification)));
        }

        QueryWrapper<User> query = new QueryWrapper<>();
        query.eq("email",user.getEmail());
        User qy = userService.getOne(query);
        if(qy != null) {
            return
                    ResponseEntity.ok(Result.error(ResultError.info(ErrorType.User_exist)));
        }

        //encoding password
        user.setPassword(encoder.encode(user.getPassword()));
        System.out.println(user.getPassword());
        boolean res = userService.save(user);
        Result result =res?
                Result.success()
                :Result.error(ResultError.info(ErrorType.Sign_up_failed));
        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    public ResponseEntity login(@Validated({LoginGroup.class}) @RequestBody User user, HttpServletRequest request, ServletResponse response) {
        boolean res = userService.loginMember(user);
        user.setPassword(encoder.encode(user.getPassword()));
        System.out.println(user.getPassword());
        Result result =res?
                Result.success()
                :Result.error(ResultError.info(ErrorType.Login_failed));

        //generate unique authToken
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(user.getEmail(),user.getPassword());

        //set token into current context;
        SecurityContextHolder.getContext().setAuthentication(authToken);
        request.getSession(true).setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY
                , SecurityContextHolder.getContext());

        HttpSession session = request.getSession(true);
        result.setData(session.getId());
        String userId = userService.getUserId(user).toString();
        String sessionId = session.getId();

        singleLogin(sessionId,userId,user.getRole());
        return ResponseEntity.ok(result);
    }

    private void singleLogin(String sessionId, String userId, User.Role role){
        String userLoginValue =userId+":"+role;
        setLoginToken(sessionId, userLoginValue);
    }

    private void setLoginToken(String sessionId, String userLoginValue){
        redisService.set_temp(sessionId,userLoginValue,1, TimeUnit.DAYS);
        redisService.set_temp(userLoginValue,sessionId,1, TimeUnit.DAYS);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Result> resetPassword(@RequestBody User user){
        boolean ifValid = redisService.checkVerification(user.getEmail(), user.getMail_verification());
        if(!ifValid) {
            return ResponseEntity.ok(
                    Result.error(
                            ResultError.info(
                                    ErrorType.Not_valid_verification)));
        }
        user.setPassword(encoder.encode(user.getPassword()));
        userService.resetPassword(user);
        return ResponseEntity.ok(Result.success());
    }


    @PostMapping("/mail-verification")
    public ResponseEntity getMailVerification(@Validated({EmailVerificationGroup.class})@RequestBody User user, HttpServletRequest request ) throws MessagingException, UnsupportedEncodingException {
        String email = user.getEmail();
        String code = redisService.setEmailVerification(email);
        mailService.send(email,"Verification-Code",code);
        return ResponseEntity.ok(Result.success());
    }

    @PostMapping("/test")
    public ResponseEntity test() {
        System.out.println("test");
        return ResponseEntity.ok(Result.success(Result.success("test")));
    }
}

