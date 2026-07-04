package com.jl.flexshare.member.utils;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

public class Utils {

    public static String generateMailVerificationCode(int len){
        StringBuilder code= new StringBuilder();
        for (int i = 0; i < len; i++) {
            code.append((int) (Math.random() * 10));
        }
        return code.toString();
    }

    public static String WashXssData(String input) {
        return Jsoup.clean(input, Safelist.basic());
    }

    public static boolean hasXssRisk(String input) {
        if (input == null) return false;
        String lower = input.toLowerCase();
        return lower.contains("<script") || lower.contains("onerror") || lower.contains("javascript:");
    }
}

