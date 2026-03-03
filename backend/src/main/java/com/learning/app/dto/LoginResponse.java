package com.learning.app.dto;

public record LoginResponse(boolean success, String message, UserResponse user) {
}
