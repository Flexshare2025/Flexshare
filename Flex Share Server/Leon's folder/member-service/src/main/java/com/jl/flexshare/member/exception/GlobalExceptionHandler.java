package com.jl.flexshare.member.exception;

import com.jl.flexshare.member.result.ErrorType;
import com.jl.flexshare.member.result.Result;
import com.jl.flexshare.member.result.ResultError;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
@ResponseBody
public class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Result> validExceptionHandler(MethodArgumentNotValidException ex){
        List<Map<String,String>> exceptionMsg = ex.getBindingResult()
                .getFieldErrors()
                .stream().map(
                        (fieldError) -> {
                            HashMap<String, String> map = new HashMap<>();
                            map.put(fieldError.getField() , fieldError.getDefaultMessage());
                            return map;
                        }
                ).collect(Collectors.toList());
        Result<ExceptionWrapper> result = Result.error(ResultError.error(ErrorType.Validation_failed), new ExceptionWrapper(exceptionMsg));
        return ResponseEntity.badRequest().body(result);
    }

}
