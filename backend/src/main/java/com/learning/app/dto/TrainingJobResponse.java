package com.learning.app.dto;

public record TrainingJobResponse(
    long id,
    String jobName,
    String modelKey,
    String datasetRef,
    String notes,
    String status,
    String createdAt
) {
}
