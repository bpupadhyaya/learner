package com.learning.app.dto;

public record ModelRegistryResponse(
    long id,
    String modelKey,
    String displayName,
    String version,
    String framework,
    String status,
    String createdAt
) {
}
