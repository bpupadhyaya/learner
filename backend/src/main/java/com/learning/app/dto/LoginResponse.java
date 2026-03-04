package com.learning.app.dto;

public record LoginResponse(
    boolean success,
    String message,
    UserResponse user,
    String accessToken,
    String refreshToken,
    String tokenType,
    String role
) {
    public LoginResponse(boolean success, String message, UserResponse user) {
        this(success, message, user, null, null, null, null);
    }
}
