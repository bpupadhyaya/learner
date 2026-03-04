package com.learning.app.controller;

import com.learning.app.dto.ApiErrorResponse;
import com.learning.app.dto.ExperimentStubRequest;
import com.learning.app.dto.ExperimentStubResponse;
import com.learning.app.dto.ModelRegistryRequest;
import com.learning.app.dto.ModelRegistryResponse;
import com.learning.app.dto.TrainingJobRequest;
import com.learning.app.dto.TrainingJobResponse;
import com.learning.app.service.MlFoundationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ml")
public class MlFoundationController {

    private final MlFoundationService mlFoundationService;

    public MlFoundationController(MlFoundationService mlFoundationService) {
        this.mlFoundationService = mlFoundationService;
    }

    @GetMapping("/models")
    public List<ModelRegistryResponse> listModels() {
        return mlFoundationService.listModels();
    }

    @PostMapping("/models")
    public ResponseEntity<?> registerModel(@RequestBody ModelRegistryRequest request) {
        try {
            ModelRegistryResponse response = mlFoundationService.registerModel(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiErrorResponse(false, ex.getMessage()));
        }
    }

    @GetMapping("/training-jobs")
    public List<TrainingJobResponse> listTrainingJobs() {
        return mlFoundationService.listTrainingJobs();
    }

    @PostMapping("/training-jobs")
    public ResponseEntity<?> createTrainingJob(@RequestBody TrainingJobRequest request) {
        try {
            TrainingJobResponse response = mlFoundationService.createTrainingJob(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiErrorResponse(false, ex.getMessage()));
        }
    }

    @GetMapping("/experiments")
    public List<ExperimentStubResponse> listExperiments() {
        return mlFoundationService.listExperiments();
    }

    @PostMapping("/experiments")
    public ResponseEntity<?> createExperiment(@RequestBody ExperimentStubRequest request) {
        try {
            ExperimentStubResponse response = mlFoundationService.createExperiment(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiErrorResponse(false, ex.getMessage()));
        }
    }
}
