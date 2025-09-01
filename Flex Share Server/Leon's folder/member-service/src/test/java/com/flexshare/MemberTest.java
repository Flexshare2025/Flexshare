package com.flexshare;

import com.jl.flexshare.FlexShareApplication;
import com.jl.flexshare.member.entity.User;
import com.jl.flexshare.member.mapper.UserMapper;
import com.jl.flexshare.member.service.MailService;
import com.jl.flexshare.member.service.UserService;
import org.junit.Test;
import org.junit.jupiter.api.Assertions;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.junit4.SpringRunner;

import javax.mail.MessagingException;
import java.io.UnsupportedEncodingException;
import java.util.List;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = FlexShareApplication.class)
@ComponentScan(basePackages = "com.jl.flexshare.member")
public class MemberTest {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private MailService mailService;


    @Test
    public void testSelectAll() {
        List<User> users = userMapper.selectList(null);
        Assertions.assertFalse(users.isEmpty());
        users.forEach((user -> System.out.println(user)));
    }
    @Test
    public void  testSendEmail() throws MessagingException, UnsupportedEncodingException {
        mailService.send("qik236899@gmail.com","Test","Hello World");
        System.out.println("11111");
    }

}
