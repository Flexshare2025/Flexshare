package com.jl.flexshare.member.filter;

import com.jl.flexshare.member.utils.Utils;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.stream.Collectors;

@Order(3)
@Component
public class XssWashingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;

        if ("POST".equalsIgnoreCase(httpRequest.getMethod()) &&
                httpRequest.getContentType() != null &&
                httpRequest.getContentType().contains("application/json")) {

            BufferedReader reader = httpRequest.getReader();
            String rawJson = reader.lines().collect(Collectors.joining(System.lineSeparator()));

            if (Utils.hasXssRisk(rawJson)) {
                String ip = httpRequest.getRemoteAddr();
                System.err.println("XSS risk detected from IP: " + ip);
                // userService.lockUser(userId);
                throw new SecurityException("Potential XSS attack blocked");
            }

            String cleanedJson = Utils.WashXssData(rawJson);

            HttpServletRequestWrapper wrappedRequest = new HttpServletRequestWrapper(httpRequest) {
                @Override
                public BufferedReader getReader() throws IOException {
                    return new BufferedReader(new java.io.StringReader(cleanedJson));
                }
            };

            chain.doFilter(wrappedRequest, response);
        } else {
            chain.doFilter(request, response);
        }
    }
}
