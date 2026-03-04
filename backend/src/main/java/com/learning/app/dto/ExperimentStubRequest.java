package com.learning.app.dto;

public record ExperimentStubRequest(
    String experimentKey,
    String hypothesis,
    String notes
) {
}
