package com.jl.flexshare.member.lock;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RedisLock {
    String key();              // 锁的唯一标识
    long expire() default 60;  // 锁过期时间（秒）
    long waitTime() default 3000; // 最多等待时间（毫秒）
}


