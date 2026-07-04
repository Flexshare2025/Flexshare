package com.jl.flexshare.member.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jl.flexshare.member.result.ErrorType;
import com.jl.flexshare.member.result.Result;
import com.jl.flexshare.member.result.ResultError;
import com.jl.flexshare.member.service.RedisService;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

@Order(2)
@Component
public class AuthFilter implements Filter {

    private static final long SESSION_TTL_DAYS = 1L;
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/users/login",
            "/users/register",
            "/users/mail-verification",
            "/users/reset-password",
            "/health/check"
    );

    private final RedisService redisService;
    private final ObjectMapper objectMapper;

    public AuthFilter(RedisService redisService, ObjectMapper objectMapper) {
        this.redisService = redisService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain filterChain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        if (isPreflight(httpRequest) || isPublicPath(httpRequest)) {
            filterChain.doFilter(request, response);
            return;
        }

        String sessionId = httpRequest.getHeader(AUTHORIZATION_HEADER);
        Object loginValue = sessionId == null ? null : redisService.get(sessionId);
        if (loginValue == null) {
            writeError(httpResponse, ErrorType.Authentication_invalid);
            return;
        }

        String[] loginParts = loginValue.toString().split(":", 2);
        if (loginParts.length != 2) {
            writeError(httpResponse, ErrorType.Authentication_invalid);
            return;
        }

        String userId = loginParts[0];
        String role = loginParts[1];
        String singleLoginKey = userId + ":" + role;
        Object latestSession = redisService.get(singleLoginKey);

        if (!sessionId.equals(String.valueOf(latestSession))) {
            writeError(httpResponse, ErrorType.Duplicate_login);
            return;
        }

        httpRequest.setAttribute("userId", userId);
        httpRequest.setAttribute("role", role);
        redisService.set_temp(sessionId, singleLoginKey, SESSION_TTL_DAYS, TimeUnit.DAYS);
        filterChain.doFilter(request, response);
    }

    private boolean isPreflight(HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    private boolean isPublicPath(HttpServletRequest request) {
        return PUBLIC_PATHS.contains(request.getRequestURI());
    }

    private void writeError(HttpServletResponse response, ErrorType errorType) throws IOException {
        Result error = Result.error(ResultError.info(errorType));
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(error));
    }
}
