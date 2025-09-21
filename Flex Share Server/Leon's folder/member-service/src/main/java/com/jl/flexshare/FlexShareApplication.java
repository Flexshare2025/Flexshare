package com.jl.flexshare;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
@MapperScan("com.jl.flexshare.member.mapper")
public class FlexShareApplication {
    public static void main(String[] args) {
        SpringApplication.run(FlexShareApplication.class, args);
    }
}
