package com.jl.flexshare.member.service.imply;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jl.flexshare.member.entity.User;
import com.jl.flexshare.member.mapper.UserMapper;
import com.jl.flexshare.member.service.UserService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    private final BCryptPasswordEncoder passwordEncoder;

    public UserServiceImpl(BCryptPasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public boolean registerMember(User user) {
        return save(user);
    }

    @Override
    public boolean loginMember(User user) {
        User savedUser = findByEmail(user.getEmail());
        return savedUser != null && passwordEncoder.matches(user.getPassword(), savedUser.getPassword());
    }

    @Override
    public Long getUserId(User user) {
        User savedUser = findByEmail(user.getEmail());
        return savedUser == null ? null : savedUser.getId();
    }

    @Override
    public boolean resetPassword(User user) {
        User savedUser = findByEmail(user.getEmail());
        if (savedUser == null) {
            return false;
        }

        savedUser.setPassword(user.getPassword());
        return baseMapper.updateById(savedUser) > 0;
    }

    @Override
    public User getUserById(Long userId) {
        return getOne(new QueryWrapper<User>().eq("id", userId));
    }

    @Override
    public boolean existsByEmail(String email) {
        return findByEmail(email) != null;
    }

    private User findByEmail(String email) {
        return getOne(new QueryWrapper<User>().eq("email", email));
    }
}
