package com.learning.app.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    @Value("${security.jwt.secret}")
    private String jwtSecret;

    @Value("${security.jwt.access-token-expiration-ms:900000}")
    private long accessTokenExpirationMs;

    @Value("${security.jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    public String generateAccessToken(String username, String role) {
        return buildToken(username, role, "access", accessTokenExpirationMs);
    }

    public String generateRefreshToken(String username, String role) {
        return buildToken(username, role, "refresh", refreshTokenExpirationMs);
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    public boolean isAccessTokenValid(String token) {
        return isTokenValid(token, "access");
    }

    public boolean isRefreshTokenValid(String token) {
        return isTokenValid(token, "refresh");
    }

    private String buildToken(String username, String role, String tokenType, long expiresInMs) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(expiresInMs);

        return Jwts.builder()
            .subject(username)
            .claim("role", role)
            .claim("type", tokenType)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(signingKey())
            .compact();
    }

    private boolean isTokenValid(String token, String expectedType) {
        try {
            Claims claims = parseClaims(token);
            String actualType = claims.get("type", String.class);
            return expectedType.equals(actualType);
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
}
