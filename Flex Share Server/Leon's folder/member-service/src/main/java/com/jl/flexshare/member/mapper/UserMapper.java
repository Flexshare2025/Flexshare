package com.jl.flexshare.member.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jl.flexshare.member.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
