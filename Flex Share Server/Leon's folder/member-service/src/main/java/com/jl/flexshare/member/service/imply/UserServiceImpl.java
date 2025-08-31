package com.jl.flexshare.member.service.imply;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jl.flexshare.member.entity.User;
import com.jl.flexshare.member.mapper.UserMapper;
import com.jl.flexshare.member.service.UserService;
import org.springframework.stereotype.Service;


@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Override
    public boolean registerMember(User user) {
        return save(user);
    }

    @Override
    public boolean loginMember(User user) {
        return lambdaQuery()
                .eq(User::getEmail,user.getEmail())
                .eq(User::getPassword,user.getPassword())
                .count()>0;
    }
}
