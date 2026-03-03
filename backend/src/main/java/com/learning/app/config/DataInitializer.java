package com.learning.app.config;

import com.learning.app.entity.AppUser;
import com.learning.app.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedInitialUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> userRepository.findByUsername("admin")
            .or(() -> {
                AppUser adminUser = new AppUser(
                    "admin",
                    passwordEncoder.encode("admin123"),
                    "Administrator"
                );
                return java.util.Optional.of(userRepository.save(adminUser));
            });
    }
}
