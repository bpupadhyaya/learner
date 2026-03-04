package com.learning.app.dto;

public record ApiErrorResponse(
    boolean success,
    String message
) {
}
