package com.jl.flexshare.member.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.jl.flexshare.member.entity.User;
import org.springframework.stereotype.Service;

@Service
public interface UserService extends IService<User> {
    public boolean registerMember(User user);
    public boolean loginMember(User user);
    public Long getUserId(User user);
    public boolean resetPassword(User user) ;
    public User getUserById(Long userId) ;
}
