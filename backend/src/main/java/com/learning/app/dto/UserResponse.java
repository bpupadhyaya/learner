package com.learning.app.dto;

public record UserResponse(String username, String displayName, String role) {
    public UserResponse(String username, String displayName) {
        this(username, displayName, null);
    }
}
