package com.flexshare;

import com.jl.flexshare.MemberApplication;
import com.jl.flexshare.member.entity.User;
import com.jl.flexshare.member.mapper.UserMapper;
import org.junit.Test;
import org.junit.jupiter.api.Assertions;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.List;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = MemberApplication.class)
@ComponentScan(basePackages = "com.jl.flexshare.member")
public class MemberTest {

    @Autowired
    private UserMapper userMapper;


    @Test
    public void testSelectAll() {
        List<User> users = userMapper.selectList(null);
        Assertions.assertFalse(users.isEmpty());
        users.forEach((user -> System.out.println(user)));
    }

}
