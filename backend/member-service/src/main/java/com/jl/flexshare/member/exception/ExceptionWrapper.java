package com.jl.flexshare.member.exception;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
public class ExceptionWrapper {
    List<Map<String,String>> errors;
}
