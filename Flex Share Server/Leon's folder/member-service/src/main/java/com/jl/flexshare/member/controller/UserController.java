package com.jl.flexshare.member.controller;

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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.mail.MessagingException;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.io.UnsupportedEncodingException;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

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
        logger.info("Received registration request for email: {}", user.getEmail());

        boolean ifValid = redisService.checkVerification(user.getEmail(), user.getMail_verification());
        if (!ifValid) {
            logger.warn("Email verification failed for: {}", user.getEmail());
            return ResponseEntity.ok(Result.error(ResultError.info(ErrorType.Not_valid_verification)));
        }

        QueryWrapper<User> query = new QueryWrapper<>();
        query.eq("email", user.getEmail());
        User existingUser = userService.getOne(query);
        if (existingUser != null) {
            logger.warn("User already exists with email: {}", user.getEmail());
            return ResponseEntity.ok(Result.error(ResultError.info(ErrorType.User_exist)));
        }

        user.setPassword(encoder.encode(user.getPassword()));
        logger.debug("Encoded password for user: {}", user.getEmail());

        boolean saved = userService.save(user);
        if (saved) {
            logger.info("User registered successfully: {}", user.getEmail());
        } else {
            logger.error("User registration failed: {}", user.getEmail());
        }

        Result result = saved ? Result.success() : Result.error(ResultError.info(ErrorType.Sign_up_failed));
        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    public ResponseEntity<Result> login(@Validated({LoginGroup.class}) @RequestBody User user, HttpServletRequest request, ServletResponse response) {
        logger.info("Login attempt for email: {}", user.getEmail());

        boolean success = userService.loginMember(user);
        user.setPassword(encoder.encode(user.getPassword()));
        logger.debug("Encoded password for login: {}", user.getEmail());

        Result result = success ? Result.success() : Result.error(ResultError.info(ErrorType.Login_failed));
        if (!success) {
            logger.warn("Login failed for email: {}", user.getEmail());
        }

        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(user.getEmail(), user.getPassword());

        SecurityContextHolder.getContext().setAuthentication(authToken);
        request.getSession(true).setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                SecurityContextHolder.getContext());

        HttpSession session = request.getSession(true);
        result.setData(session.getId());
        Long userId1 = userService.getUserId(user);
        if (userId1==null)
            return ResponseEntity.ok(Result.error(ResultError.info(ErrorType.Login_failed)));
        String userId =userId1.toString();
        String sessionId = session.getId();

        logger.info("Login successful. Session ID: {}, User ID: {}", sessionId, userId);
        singleLogin(sessionId, userId, user.getRole());

        return ResponseEntity.ok(result);
    }

    private void singleLogin(String sessionId, String userId, User.Role role) {
        String userLoginValue = userId + ":" + role;
        logger.debug("Setting single login token for user: {}", userLoginValue);
        setLoginToken(sessionId, userLoginValue);
    }

    private void setLoginToken(String sessionId, String userLoginValue) {
        logger.debug("Storing login tokens in Redis for session: {}", sessionId);
        redisService.set_temp(sessionId, userLoginValue, 1, TimeUnit.DAYS);
        redisService.set_temp(userLoginValue, sessionId, 1, TimeUnit.DAYS);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Result> resetPassword(@RequestBody User user) {
        logger.info("Password reset requested for email: {}", user.getEmail());

        boolean ifValid = redisService.checkVerification(user.getEmail(), user.getMail_verification());
        if (!ifValid) {
            logger.warn("Email verification failed during password reset for: {}", user.getEmail());
            return ResponseEntity.ok(Result.error(ResultError.info(ErrorType.Not_valid_verification)));
        }

        user.setPassword(encoder.encode(user.getPassword()));
        userService.resetPassword(user);
        logger.info("Password reset successful for email: {}", user.getEmail());

        return ResponseEntity.ok(Result.success());
    }

    @PostMapping("/mail-verification")
    public ResponseEntity<Result> getMailVerification(@Validated({EmailVerificationGroup.class}) @RequestBody User user, HttpServletRequest request) throws MessagingException, UnsupportedEncodingException {
        String email = user.getEmail();
        logger.info("Sending email verification code to: {}", email);

        String code = redisService.setEmailVerification(email);
        mailService.send(email, "Verification-Code", code);

        logger.info("Verification code sent successfully to: {}", email);
        return ResponseEntity.ok(Result.success());
    }

    @PostMapping("/test")
    public ResponseEntity<Result> test() {
        logger.info("Test endpoint called");
        return ResponseEntity.ok(Result.success(Result.success("test")));
    }
}
