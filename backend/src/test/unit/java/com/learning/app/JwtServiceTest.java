package com.learning.app;

import com.learning.app.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private JwtService configuredJwtService(long accessMs, long refreshMs) {
        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", "learning-super-secret-signing-key-32chars-minimum");
        ReflectionTestUtils.setField(jwtService, "accessTokenExpirationMs", accessMs);
        ReflectionTestUtils.setField(jwtService, "refreshTokenExpirationMs", refreshMs);
        return jwtService;
    }

    @Test
    void shouldGenerateAndValidateAccessToken() {
        JwtService jwtService = configuredJwtService(60000L, 60000L);
        String token = jwtService.generateAccessToken("admin", "ADMIN");

        assertTrue(jwtService.isAccessTokenValid(token));
        assertFalse(jwtService.isRefreshTokenValid(token));
        assertEquals("admin", jwtService.extractUsername(token));
        assertEquals("ADMIN", jwtService.extractRole(token));
    }

    @Test
    void shouldGenerateAndValidateRefreshToken() {
        JwtService jwtService = configuredJwtService(60000L, 60000L);
        String token = jwtService.generateRefreshToken("admin", "ADMIN");

        assertTrue(jwtService.isRefreshTokenValid(token));
        assertFalse(jwtService.isAccessTokenValid(token));
    }

    @Test
    void shouldRejectInvalidToken() {
        JwtService jwtService = configuredJwtService(60000L, 60000L);
        assertFalse(jwtService.isAccessTokenValid("not-a-jwt"));
        assertFalse(jwtService.isRefreshTokenValid("not-a-jwt"));
    }
}
