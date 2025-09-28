package com.jl.flexshare.member.filter;

import jakarta.servlet.*;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.*;
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

            String rawJson = new BufferedReader(httpRequest.getReader())
                    .lines().collect(Collectors.joining(System.lineSeparator()));

            if (hasXssRisk(rawJson)) {
                String ip = httpRequest.getRemoteAddr();
                System.err.println("XSS risk detected from IP: " + ip);
                throw new SecurityException("Potential XSS attack blocked");
            }

            String cleanedJson = cleanXss(rawJson);
            CachedBodyRequestWrapper wrappedRequest = new CachedBodyRequestWrapper(httpRequest, cleanedJson);
            chain.doFilter(wrappedRequest, response);
        } else {
            chain.doFilter(request, response);
        }
    }

    private boolean hasXssRisk(String input) {
        if (input == null) return false;
        String lower = input.toLowerCase();
        return lower.contains("<script") || lower.contains("onerror") || lower.contains("javascript:");
    }

    private String cleanXss(String input) {
        return Jsoup.clean(input, Safelist.relaxed());
    }

    private static class CachedBodyRequestWrapper extends HttpServletRequestWrapper {
        private final byte[] cachedBody;

        public CachedBodyRequestWrapper(HttpServletRequest request, String cleanedJson) throws IOException {
            super(request);
            this.cachedBody = cleanedJson.getBytes(request.getCharacterEncoding());
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(cachedBody);
            return new ServletInputStream() {
                @Override public boolean isFinished() { return byteArrayInputStream.available() == 0; }
                @Override public boolean isReady() { return true; }
                @Override public void setReadListener(ReadListener listener) {}
                @Override public int read() { return byteArrayInputStream.read(); }
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(getInputStream()));
        }
    }
}
