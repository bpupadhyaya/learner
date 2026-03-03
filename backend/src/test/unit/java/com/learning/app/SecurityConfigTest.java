package com.learning.app;

import com.learning.app.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertTrue;

class SecurityConfigTest {

    @Test
    void shouldEncodeAndMatchPassword() {
        SecurityConfig securityConfig = new SecurityConfig();
        PasswordEncoder encoder = securityConfig.passwordEncoder();

        String encoded = encoder.encode("admin123");
        assertTrue(encoder.matches("admin123", encoded));
    }

    boolean passwordMatches() {
        SecurityConfig securityConfig = new SecurityConfig();
        PasswordEncoder encoder = securityConfig.passwordEncoder();
        return encoder.matches("admin123", encoder.encode("admin123"));
    }
}
