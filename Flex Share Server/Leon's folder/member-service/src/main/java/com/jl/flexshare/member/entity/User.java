package com.jl.flexshare.member.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.jl.flexshare.member.validation.EmailVerificationGroup;
import com.jl.flexshare.member.validation.LoginGroup;
import com.jl.flexshare.member.validation.SignUpGroup;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

import jakarta.validation.constraints.NotBlank;

import jakarta.validation.constraints.Email;

@Data
@TableName("users")
public class User {
    @TableId( type = IdType.ASSIGN_ID)
    private Long id;
    @NotBlank(message = "Must not be blank", groups ={SignUpGroup.class, LoginGroup.class})
    @Email(message = "Must be a valid email", groups = {EmailVerificationGroup.class,SignUpGroup.class, LoginGroup.class})
    private String email;
    @NotBlank(message = "Must not be blank", groups = SignUpGroup.class)
    private String name;
    @NotBlank(message = "Must not be blank", groups ={SignUpGroup.class, LoginGroup.class})
    private String password;
    @NotBlank()
    @Length(message = "Must be 6 digit number",groups ={SignUpGroup.class} )
    private transient String mail_verification;
    private Role role;


    public enum Role
        {
            passenger,
            driver,
            admin
        }
}
