package com.learning.app.dto;

public record ModelRegistryRequest(
    String modelKey,
    String displayName,
    String version,
    String framework
) {
}
