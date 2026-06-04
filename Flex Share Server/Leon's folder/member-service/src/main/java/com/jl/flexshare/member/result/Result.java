package com.jl.flexshare.member.result;


import lombok.Data;

@Data
public class Result<T> {
    private String code;
    private String msg;
    private T data;


    public Result() {

    }

    public Result(T data) {
        this.data = data;
    }

    public static Result success() {
        Result<Object> result = new Result<>();
        result.setCode("200");
        result.setMsg("success");
        return result;
    }


    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>(data);
        result.setCode("200");
        result.setMsg("success");
        return result;
    }

    public static Result error(String code, String msg) {
        Result<Object> result = new Result<>();
        result.setCode(code);
        result.setMsg(msg);
        return result;
    }
    public static Result error(ResultError error) {
        Result<Object> result = new Result<>();
        result.setCode(error.getErrorCode());
        result.setMsg(error.getErrorMsg());
        return result;
    }
    public static <T> Result<T> error(ResultError error,T data) {
        Result<T> result = new Result<>();
        result.setCode(error.getErrorCode());
        result.setMsg(error.getErrorMsg());
        result.setData(data);
        return result;
    }


    public static <T> Result<T> error(String code, String msg, T data) {
        Result<T> result = new Result<>(data);
        result.setCode(code);
        result.setMsg(msg);
        return result;
    }
}
