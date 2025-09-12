package com.jl.flexshare.member.service.imply;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jl.flexshare.member.entity.User;
import com.jl.flexshare.member.mapper.UserMapper;
import com.jl.flexshare.member.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;


@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Override
    public boolean registerMember(User user) {
        return save(user);
    }

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    @Override
    public boolean loginMember(User user) {

                User dbUser = getOne(new QueryWrapper<User>().eq("email", user.getEmail()));

                if (dbUser == null) {
                    return false;
                }
                return passwordEncoder.matches(user.getPassword(), dbUser.getPassword());
    }

    @Override
    public Long getUserId(User user){
        User dbUser = getOne(new QueryWrapper<User>().eq("email", user.getEmail()));
        if (dbUser!=null)
            return dbUser.getId();
        else
            return null;
    }

    @Override
    public boolean resetPassword(User user) {

        User sqlUser = getOne(new QueryWrapper<User>().eq("email", user.getEmail()));

        if (sqlUser == null) {
            return false;
        }
        sqlUser.setPassword(user.getPassword());
        int update= baseMapper.updateById(sqlUser);
        return update>0;
    }

    @Override
    public User getUserById(Long userId) {
        User sqlUser = getOne(new QueryWrapper<User>().eq("id",userId));
        return sqlUser;
    }
}
