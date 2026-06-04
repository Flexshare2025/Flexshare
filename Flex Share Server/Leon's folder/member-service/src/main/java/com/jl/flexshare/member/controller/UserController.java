package com.jl.flexshare.member.controller;

import com.jl.flexshare.member.entity.User;
import com.jl.flexshare.member.result.ErrorType;
import com.jl.flexshare.member.result.Result;
import com.jl.flexshare.member.result.ResultError;
import com.jl.flexshare.member.service.MailService;
import com.jl.flexshare.member.service.RedisService;
import com.jl.flexshare.member.service.UserService;
import com.jl.flexshare.member.validation.EmailVerificationGroup;
import com.jl.flexshare.member.validation.LoginGroup;
import com.jl.flexshare.member.validation.SignUpGroup;
import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.io.UnsupportedEncodingException;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

@RestController
@RequestMapping("/users")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    private static final long LOGIN_SESSION_TTL_DAYS = 1L;

    private final UserService userService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final RedisService redisService;
    private final MailService mailService;

    public UserController(
            UserService userService,
            BCryptPasswordEncoder passwordEncoder,
            RedisService redisService,
            MailService mailService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.redisService = redisService;
        this.mailService = mailService;
    }

    /**
     * Registers a user after the email verification code has been validated.
     */
    @PostMapping("/register")
    public ResponseEntity<Result> register(@Validated(SignUpGroup.class) @RequestBody User user) {
        log.info("Registration requested for email={}", user.getEmail());

        if (!redisService.checkVerification(user.getEmail(), user.getMail_verification())) {
            return ok(ErrorType.Not_valid_verification);
        }

        if (userService.existsByEmail(user.getEmail())) {
            return ok(ErrorType.User_exist);
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        boolean created = userService.registerMember(user);

        if (!created) {
            log.warn("Registration failed for email={}", user.getEmail());
            return ok(ErrorType.Sign_up_failed);
        }

        log.info("User registered successfully email={}", user.getEmail());
        return ResponseEntity.ok(Result.success());
    }

    /**
     * Authenticates the user and records the active session in Redis for single-login enforcement.
     */
    @PostMapping("/login")
    public ResponseEntity<Result> login(
            @Validated(LoginGroup.class) @RequestBody User user,
            HttpServletRequest request) {
        log.info("Login requested for email={}", user.getEmail());

        if (!userService.loginMember(user)) {
            log.warn("Login failed for email={}", user.getEmail());
            return ok(ErrorType.Login_failed);
        }

        Long userId = userService.getUserId(user);
        if (userId == null) {
            log.warn("Login succeeded but user id was not found for email={}", user.getEmail());
            return ok(ErrorType.Login_failed);
        }

        HttpSession session = request.getSession(true);
        bindSecurityContext(user.getEmail(), session, request);
        storeSingleLoginToken(session.getId(), userId, user.getRole());

        log.info("Login succeeded for userId={}", userId);
        return ResponseEntity.ok(Result.success(session.getId()));
    }

    /**
     * Resets a password only after the user proves control of the email address.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Result> resetPassword(@RequestBody User user) {
        log.info("Password reset requested for email={}", user.getEmail());

        if (!redisService.checkVerification(user.getEmail(), user.getMail_verification())) {
            return ok(ErrorType.Not_valid_verification);
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (!userService.resetPassword(user)) {
            return ok(ErrorType.Login_failed);
        }

        return ResponseEntity.ok(Result.success());
    }

    /**
     * Sends a short-lived verification code to the requested email address.
     */
    @PostMapping("/mail-verification")
    public ResponseEntity<Result> getMailVerification(
            @Validated(EmailVerificationGroup.class) @RequestBody User user)
            throws MessagingException, UnsupportedEncodingException {
        String email = user.getEmail();
        String code = redisService.setEmailVerification(email);

        mailService.send(email, "FlexShare verification code", code);
        log.info("Verification email sent to email={}", email);

        return ResponseEntity.ok(Result.success());
    }

    private void bindSecurityContext(String email, HttpSession session, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(email, null);

        SecurityContextHolder.getContext().setAuthentication(authentication);
        request.getSession(true).setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                SecurityContextHolder.getContext());
    }

    private void storeSingleLoginToken(String sessionId, Long userId, User.Role role) {
        String userLoginKey = userId + ":" + role;
        redisService.set_temp(sessionId, userLoginKey, LOGIN_SESSION_TTL_DAYS, TimeUnit.DAYS);
        redisService.set_temp(userLoginKey, sessionId, LOGIN_SESSION_TTL_DAYS, TimeUnit.DAYS);
    }

    private ResponseEntity<Result> ok(ErrorType errorType) {
        return ResponseEntity.ok(Result.error(ResultError.info(errorType)));
    }
}
