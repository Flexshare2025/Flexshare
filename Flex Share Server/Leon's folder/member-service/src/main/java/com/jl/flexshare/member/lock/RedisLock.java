package com.jl.flexshare.member.lock;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RedisLock {
    String key();              // Redis lock key name.
    long expire() default 60;  // Redis lock key expire time.
    long waitTime() default 3000; //  Duration of waiting time.
}


