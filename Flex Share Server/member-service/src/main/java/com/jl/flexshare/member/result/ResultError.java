package com.jl.flexshare.member.result;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class ResultError {

    String errorCode;
    String errorMsg;



    public static ResultError error(ErrorType errorType){
        switch (errorType){
            case Sign_up_failed:
                return new ResultError("4001","Signup failed");
            case Login_failed:
                return new ResultError("4002","Login failed");
            case Validation_failed:
                return new ResultError("4003","Validation failed");
            default:
                return new ResultError("4000","Unknown error");
        }
    }
}
