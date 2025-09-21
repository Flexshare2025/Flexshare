package com.jl.flexshare.member.result;

public enum ErrorType {
    /* User  error */
    Sign_up_failed,
    Validation_failed,
    Login_failed,
    User_exist,
    Duplicate_login,

    /* Auth api error */
    Not_valid_verification,
    Verification_code_wrong,
    Authentication_invalid,

    /* Schedule Error */
    Seat_not_enough,
    Departure_time_too_late,
    Duplicate_schedule,
    Invalid_schedule,
    Modify_due_schedule,

    /* Server Busy */
    Schedule_too_hot,



    /**/
    Unknown_error,


}
