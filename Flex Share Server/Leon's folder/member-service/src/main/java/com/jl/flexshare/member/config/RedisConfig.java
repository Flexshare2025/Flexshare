package com.jl.flexshare.member.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.jl.flexshare.member.listener.RedisKeyExpirationListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.KeyExpirationEventMessageListener;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    // Load Redis properties from application.yaml or Secret Manager
    @Value("${spring.redis.host}")
    private String redisHost;

    @Value("${spring.redis.port}")
    private int redisPort;

    @Value("${spring.redis.password}")
    private String redisPassword;

    @Value("${spring.redis.database:0}")
    private int redisDatabase;

    /**
     * Create LettuceConnectionFactory using Redis host/port/password
     * This ensures RedisMessageListenerContainer uses the correct connection
     */
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(redisHost);
        config.setPort(redisPort);
        config.setPassword(RedisPassword.of(redisPassword));
        config.setDatabase(redisDatabase);
        return new LettuceConnectionFactory(config);
    }

    /**
     * Configure RedisTemplate with custom ObjectMapper to handle LocalDateTime serialization
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(redisConnectionFactory);

        // Configure ObjectMapper
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);

        // Handle LocalDateTime serialization/deserialization
        objectMapper.registerModule(new JavaTimeModule());

        // Initialize serializer with custom ObjectMapper
        GenericJackson2JsonRedisSerializer jacksonSerializer = new GenericJackson2JsonRedisSerializer(objectMapper);

        // Set key & value serializers
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        redisTemplate.setValueSerializer(jacksonSerializer);
        redisTemplate.setHashKeySerializer(new StringRedisSerializer());
        redisTemplate.setHashValueSerializer(jacksonSerializer);

        redisTemplate.afterPropertiesSet();
        return redisTemplate;
    }

    /**
     * Redis key expiration listener container
     * Listens to key expiration events in Redis
     */
    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            RedisKeyExpirationListener redisKeyExpirationListener) {

        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);

        // Add listener for key expiration events
        container.addMessageListener(
                new KeyExpirationEventMessageListener(container) {
                    @Override
                    public void onMessage(org.springframework.data.redis.connection.Message message, byte[] pattern) {
                        redisKeyExpirationListener.onMessage(message, pattern);
                    }
                },
                new PatternTopic("__keyevent@" + redisDatabase + "__:expired")
        );

        return container;
    }
}
