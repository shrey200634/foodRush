package com.foodDelivery.restaurant_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth->auth
                        //anyone can browse restaurant and menu

                        .requestMatchers("/api/v1/restaurants/nearby").permitAll()
                        .requestMatchers("/api/v1/restaurants/search").permitAll()
                        .requestMatchers("/api/v1/restaurants/top-rated").permitAll()
                        .requestMatchers("/api/v1/restaurants/*/menu/**").permitAll()
                        .requestMatchers("/api/v1/restaurants/*/reviews").permitAll()

                        // anything else require Auth

                        .anyRequest().permitAll()
                );

        return http.build();
    }
}
