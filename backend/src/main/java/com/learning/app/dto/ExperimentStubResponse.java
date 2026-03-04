package com.learning.app.dto;

public record ExperimentStubResponse(
    long id,
    String experimentKey,
    String hypothesis,
    String notes,
    String status,
    String createdAt
) {
}
