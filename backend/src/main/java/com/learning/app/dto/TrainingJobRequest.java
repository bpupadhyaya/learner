package com.learning.app.dto;

public record TrainingJobRequest(
    String modelKey,
    String datasetRef,
    String notes
) {
}
