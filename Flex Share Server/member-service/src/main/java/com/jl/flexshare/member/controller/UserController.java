package com.jl.flexshare.member.controller;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.jl.flexshare.member.result.ErrorType;
import com.jl.flexshare.member.result.Result;
import com.jl.flexshare.member.entity.User;
import com.jl.flexshare.member.result.ResultError;
import com.jl.flexshare.member.service.UserService;
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
import javax.servlet.http.HttpServletRequest;


@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private BCryptPasswordEncoder encoder;

    @PostMapping("/register")
    public ResponseEntity<Result> register(@Validated({SignUpGroup.class}) @RequestBody User user) {
        
        QueryWrapper<User> query = new QueryWrapper<>();
        query.eq("email",user.getEmail());
        User qy = userService.getOne(query);
        if(qy != null) {
            return
                    ResponseEntity.ok(Result.error(ResultError.error(ErrorType.User_exist)));
        }

        //encoding password
        user.setPassword(encoder.encode(user.getPassword()));
        boolean res = userService.save(user);
        Result result =res?
                Result.success()
                :Result.error(ResultError.error(ErrorType.Sign_up_failed));
        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    public ResponseEntity login(@Validated({LoginGroup.class}) @RequestBody User user, HttpServletRequest request ) {
        boolean res = userService.loginMember(user);

        Result result =res?
                Result.success()
                :Result.error(ResultError.error(ErrorType.Login_failed));

        //generate unique authToken
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(user.getEmail(),user.getPassword());

        //set token into current context;
        SecurityContextHolder.getContext().setAuthentication(authToken);
        request.getSession(true).setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY
                , SecurityContextHolder.getContext() );

        return ResponseEntity.ok(result);
    }
}

