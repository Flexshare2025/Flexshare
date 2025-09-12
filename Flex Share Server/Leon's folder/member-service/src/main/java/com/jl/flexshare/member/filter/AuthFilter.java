package com.jl.flexshare.member.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jl.flexshare.member.result.ErrorType;
import com.jl.flexshare.member.result.Result;
import com.jl.flexshare.member.result.ResultError;
import com.jl.flexshare.member.service.RedisService;
import com.jl.flexshare.member.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Order(2)
@Component
public class AuthFilter implements Filter{

    @Autowired
    private RedisService redisService;

    @Autowired
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;


    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain filterChain) throws IOException, ServletException {
        HttpServletResponse resp = (HttpServletResponse) response;
        HttpServletRequest req = (HttpServletRequest) request;

        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            resp.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        if (req.getRequestURI().equals("/users/login")
        || req.getRequestURI().equals("/users/register")
        || req.getRequestURI().equals("/users/mail-verification")
        || req.getRequestURI().equals("/users/reset-password"))
            filterChain.doFilter(request, response);
        else
        {
            String authorization = req.getHeader("Authorization");
            Object auth=null;
            if (null!=authorization){
                auth = redisService.get(authorization);
            }
            if (null == authorization||auth==null)
            {

                Result error = Result.error(ResultError.info(ErrorType.Authentication_invalid));
                interceptRequest(resp,error);
            }
            else{
                String userValue = redisService.get(authorization).toString();
                String[] split = userValue.split(":");
                String userId=split[0];
                String role=split[1];

                String userLoginValue =userId+":"+role;
                //check if auth equals current auth
                if (redisService.get(userLoginValue).toString().equals(authorization)) {
                    req.setAttribute("userId", userId);
                    req.setAttribute("role", role);
                    redisService.set_temp(authorization, userLoginValue, 1, TimeUnit.DAYS);
                    filterChain.doFilter(request, response);
                }
                else{
                    //auth is no newest, duplicated login
                    Result error = Result.error(ResultError.info(ErrorType.Duplicate_login));
                    interceptRequest(resp,error);
                }
            }
        }

    }

    private void interceptRequest(HttpServletResponse resp,Result error) throws IOException {
        ResponseEntity<Result> entity = ResponseEntity.ok(error);
        resp.setContentType("application/json;charset=UTF-8");
        resp.setStatus(entity.getStatusCodeValue());
        resp.getWriter().write(objectMapper.writeValueAsString(entity.getBody()));
    }
}
