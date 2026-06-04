package com.jl.flexshare.member.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.jl.flexshare.member.validation.EmailVerificationGroup;
import com.jl.flexshare.member.validation.LoginGroup;
import com.jl.flexshare.member.validation.SignUpGroup;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

@Data
@TableName("users")
public class User {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    @NotBlank(message = "Email is required", groups = {SignUpGroup.class, LoginGroup.class, EmailVerificationGroup.class})
    @Email(message = "Email format is invalid", groups = {SignUpGroup.class, LoginGroup.class, EmailVerificationGroup.class})
    private String email;

    @NotBlank(message = "Name is required", groups = SignUpGroup.class)
    private String name;

    @NotBlank(message = "Password is required", groups = {SignUpGroup.class, LoginGroup.class})
    private String password;

    @NotBlank(message = "Verification code is required", groups = SignUpGroup.class)
    @Length(min = 6, max = 6, message = "Verification code must be 6 digits", groups = SignUpGroup.class)
    private transient String mail_verification;

    private Role role;

    public enum Role {
        passenger,
        driver,
        admin
    }
}
