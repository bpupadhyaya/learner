package com.learning.app;

import com.learning.app.dto.LoginRequest;
import com.learning.app.dto.LoginResponse;
import com.learning.app.entity.AppUser;
import com.learning.app.repository.UserRepository;
import com.learning.app.service.AuthService;
import com.learning.app.service.JwtService;
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
    private JwtService jwtService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = new BCryptPasswordEncoder();
        jwtService = mock(JwtService.class);
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    void shouldAuthenticateValidUser() {
        AppUser user = new AppUser("admin", passwordEncoder.encode("admin123"), "Administrator", "ADMIN");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken("admin", "ADMIN")).thenReturn("access");
        when(jwtService.generateRefreshToken("admin", "ADMIN")).thenReturn("refresh");

        LoginResponse response = authService.authenticate(new LoginRequest("admin", "admin123"));

        assertTrue(response.success());
        assertEquals("Login successful.", response.message());
        assertEquals("admin", response.user().username());
        assertEquals("Administrator", response.user().displayName());
        assertEquals("ADMIN", response.user().role());
        assertEquals("access", response.accessToken());
        assertEquals("refresh", response.refreshToken());
        assertEquals("Bearer", response.tokenType());
        assertEquals("ADMIN", response.role());
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
        AppUser user = new AppUser("admin", passwordEncoder.encode("admin123"), "Administrator", "ADMIN");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        LoginResponse response = authService.authenticate(new LoginRequest("admin", "wrong"));

        assertFalse(response.success());
        assertEquals("Invalid username or password.", response.message());
        assertNull(response.user());
    }

    @Test
    void shouldRefreshTokenForValidUser() {
        AppUser user = new AppUser("admin", passwordEncoder.encode("admin123"), "Administrator", "ADMIN");
        when(jwtService.isRefreshTokenValid("refresh")).thenReturn(true);
        when(jwtService.extractUsername("refresh")).thenReturn("admin");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken("admin", "ADMIN")).thenReturn("new-access");
        when(jwtService.generateRefreshToken("admin", "ADMIN")).thenReturn("new-refresh");

        LoginResponse response = authService.refresh("refresh");

        assertTrue(response.success());
        assertEquals("Token refresh successful.", response.message());
        assertEquals("new-access", response.accessToken());
        assertEquals("new-refresh", response.refreshToken());
    }

    @Test
    void shouldRejectInvalidRefreshToken() {
        when(jwtService.isRefreshTokenValid("bad")).thenReturn(false);

        LoginResponse response = authService.refresh("bad");

        assertFalse(response.success());
        assertEquals("Invalid or expired refresh token.", response.message());
        assertNull(response.user());
    }

    @Test
    void shouldRejectRefreshWhenUserMissing() {
        when(jwtService.isRefreshTokenValid("refresh")).thenReturn(true);
        when(jwtService.extractUsername("refresh")).thenReturn("ghost");
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        LoginResponse response = authService.refresh("refresh");

        assertFalse(response.success());
        assertEquals("User not found.", response.message());
    }

    @Test
    void shouldLogoutWhenRefreshTokenIsValid() {
        when(jwtService.isRefreshTokenValid("refresh")).thenReturn(true);

        LoginResponse response = authService.logout("refresh");

        assertTrue(response.success());
        assertEquals("Logout successful.", response.message());
    }

    @Test
    void shouldRejectLogoutWhenRefreshTokenIsInvalid() {
        when(jwtService.isRefreshTokenValid("bad")).thenReturn(false);

        LoginResponse response = authService.logout("bad");

        assertFalse(response.success());
        assertEquals("Invalid or expired refresh token.", response.message());
    }

    @Test
    void shouldReturnNullUserProfileWhenMissing() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());
        assertNull(authService.getUserProfile("ghost"));
    }

    @Test
    void shouldReturnUserProfileWhenPresent() {
        AppUser user = new AppUser("admin", "hash", "Administrator", "ADMIN");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        assertEquals("admin", authService.getUserProfile("admin").username());
        assertEquals("Administrator", authService.getUserProfile("admin").displayName());
        assertEquals("ADMIN", authService.getUserProfile("admin").role());
    }
}
