package com.jl.flexshare.member.lock;

import com.jl.flexshare.member.result.ErrorType;
import com.jl.flexshare.member.result.Result;
import com.jl.flexshare.member.result.ResultError;
import com.jl.flexshare.member.service.RedisService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Aspect
@Component
public class RedisLockAspect {

    @Autowired
    private RedisService redisService;

    @Around("@annotation(redisLock)")
    public Object around(ProceedingJoinPoint pjp, RedisLock redisLock) throws Throwable {
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        String[] paramNames = signature.getParameterNames();
        Object[] args = pjp.getArgs();

        StandardEvaluationContext context = new StandardEvaluationContext();
        for (int i = 0; i < paramNames.length; i++) {
            context.setVariable(paramNames[i], args[i]);
        }

        ExpressionParser parser = new SpelExpressionParser();
        String rawKey = redisLock.key(); // 例如 "'schedule_lock' + #scheduleId"
        String key = parser.parseExpression(rawKey).getValue(context, String.class);

        long expire = redisLock.expire();
        long waitTime = redisLock.waitTime();
        String uuid = UUID.randomUUID().toString();

        boolean locked = redisService.tryLockWithWait(key, uuid, expire, waitTime);

        if (!locked) {
            Thread.sleep(3000);
            uuid = UUID.randomUUID().toString();
            locked = redisService.tryLockWithWait(key, uuid, expire, waitTime);
        }

        if (!locked) {
            Class<?> returnType = signature.getMethod().getReturnType();
            if (ResponseEntity.class.isAssignableFrom(returnType)) {
                return ResponseEntity.ok(Result.error(ResultError.info(ErrorType.Schedule_too_hot)));
            }
            throw new RuntimeException("Can't get lock after retry: " + key);
        }

        try {
            return pjp.proceed();
        } finally {
            redisService.unlock(key, uuid);
        }
    }



}
