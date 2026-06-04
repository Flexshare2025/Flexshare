package com.jl.flexshare.member.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.jl.flexshare.member.entity.User;

public interface UserService extends IService<User> {
    boolean registerMember(User user);

    boolean loginMember(User user);

    Long getUserId(User user);

    boolean resetPassword(User user);

    User getUserById(Long userId);

    boolean existsByEmail(String email);
}
