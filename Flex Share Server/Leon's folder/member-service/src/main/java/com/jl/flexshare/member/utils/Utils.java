package com.jl.flexshare.member.utils;


public class Utils {

    public static String generateMailVerificationCode(int len){
        StringBuilder code= new StringBuilder();
        for (int i = 0; i < len; i++) {
            code.append((int) (Math.random() * 10));
        }
        return code.toString();
    }
}
