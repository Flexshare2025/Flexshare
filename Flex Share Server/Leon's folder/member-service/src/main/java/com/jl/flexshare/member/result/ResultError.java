package com.jl.flexshare.member.result;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class ResultError {

    String errorCode;
    String errorMsg;

    public static ResultError info(ErrorType errorType){
        switch (errorType){
            case Sign_up_failed:
                return new ResultError("4001","Signup failed");
            case Login_failed:
                return new ResultError("4002","Login failed");
            case Validation_failed:
                return new ResultError("4003","Validation failed");
            case User_exist:
                return new ResultError("4004", "User already exist");
            case Authentication_invalid:
                return new ResultError("4005", "Authentication invalid");
            case Not_valid_verification:
                return new ResultError("4006", "Verification invalid");
            case Departure_time_too_late:
                return new ResultError("4007", "Please select a departure time at least 10 minutes from now.");
            case Seat_not_enough:
                return new ResultError("4101", "Not enough seats");
            case Duplicate_login:
                return new ResultError("4102"," Duplicate login detected. Please log in again. If this issue occurs frequently, please check your account security.");
            case Duplicate_schedule:
                return new ResultError("4103","Can't book same schedule again.");
            case Invalid_schedule:
                return new ResultError("4105","Failed: schedule is invalid.");
            case Modify_due_schedule:
                return new ResultError("4104","Can only modify pending schedule");
            case Schedule_too_hot:
                return new ResultError("4201", "Schedule is too hot, please try again later");
                default:
                return new ResultError("5000","Unknown error");
        }
    }
}
