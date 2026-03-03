package com.learning.app;

import com.learning.app.dto.LoginRequest;
import com.learning.app.dto.LoginResponse;
import com.learning.app.entity.AppUser;
import com.learning.app.repository.UserRepository;
import com.learning.app.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(userRepository, passwordEncoder);
    }

    @Test
    void shouldAuthenticateValidUser() {
        AppUser user = new AppUser("admin", passwordEncoder.encode("admin123"), "Administrator");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        LoginResponse response = authService.authenticate(new LoginRequest("admin", "admin123"));

        assertTrue(response.success());
        assertEquals("Login successful.", response.message());
        assertEquals("admin", response.user().username());
        assertEquals("Administrator", response.user().displayName());
    }

    @Test
    void shouldRejectMissingUser() {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.empty());

        LoginResponse response = authService.authenticate(new LoginRequest("admin", "admin123"));

        assertFalse(response.success());
        assertEquals("Invalid username or password.", response.message());
        assertNull(response.user());
    }

    @Test
    void shouldRejectInvalidPassword() {
        AppUser user = new AppUser("admin", passwordEncoder.encode("admin123"), "Administrator");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        LoginResponse response = authService.authenticate(new LoginRequest("admin", "wrong"));

        assertFalse(response.success());
        assertEquals("Invalid username or password.", response.message());
        assertNull(response.user());
    }
}
