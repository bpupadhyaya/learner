package com.learning.app;

import com.learning.app.controller.MlFoundationController;
import com.learning.app.dto.ApiErrorResponse;
import com.learning.app.dto.ExperimentStubRequest;
import com.learning.app.dto.ExperimentStubResponse;
import com.learning.app.dto.ModelRegistryRequest;
import com.learning.app.dto.ModelRegistryResponse;
import com.learning.app.dto.TrainingJobRequest;
import com.learning.app.dto.TrainingJobResponse;
import com.learning.app.service.MlFoundationService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MlFoundationControllerTest {

    @Test
    void shouldListModels() {
        MlFoundationService service = mock(MlFoundationService.class);
        MlFoundationController controller = new MlFoundationController(service);
        List<ModelRegistryResponse> expected = List.of(
            new ModelRegistryResponse(1, "model-a", "Model A", "1.0.0", "PyTorch", "REGISTERED", "time")
        );
        when(service.listModels()).thenReturn(expected);

        List<ModelRegistryResponse> result = controller.listModels();

        assertEquals(expected, result);
    }

    @Test
    void shouldCreateModelWhenRequestIsValid() {
        MlFoundationService service = mock(MlFoundationService.class);
        MlFoundationController controller = new MlFoundationController(service);
        ModelRegistryRequest request = new ModelRegistryRequest("model-a", "Model A", "1.0.0", "PyTorch");
        ModelRegistryResponse expected =
            new ModelRegistryResponse(1, "model-a", "Model A", "1.0.0", "PyTorch", "REGISTERED", "time");
        when(service.registerModel(request)).thenReturn(expected);

        ResponseEntity<?> result = controller.registerModel(request);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertEquals(expected, result.getBody());
    }

    @Test
    void shouldReturnBadRequestWhenModelCreateFails() {
        MlFoundationService service = mock(MlFoundationService.class);
        MlFoundationController controller = new MlFoundationController(service);
        ModelRegistryRequest request = new ModelRegistryRequest("", "Model A", "1.0.0", "PyTorch");
        when(service.registerModel(request)).thenThrow(new IllegalArgumentException("Model key is required."));

        ResponseEntity<?> result = controller.registerModel(request);

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        assertEquals(new ApiErrorResponse(false, "Model key is required."), result.getBody());
    }

    @Test
    void shouldListTrainingJobs() {
        MlFoundationService service = mock(MlFoundationService.class);
        MlFoundationController controller = new MlFoundationController(service);
        List<TrainingJobResponse> expected = List.of(
            new TrainingJobResponse(1, "train-job-1", "model-a", "dataset", "note", "QUEUED", "time")
        );
        when(service.listTrainingJobs()).thenReturn(expected);

        List<TrainingJobResponse> result = controller.listTrainingJobs();

        assertEquals(expected, result);
    }

    @Test
    void shouldCreateTrainingJobWhenRequestIsValid() {
        MlFoundationService service = mock(MlFoundationService.class);
        MlFoundationController controller = new MlFoundationController(service);
        TrainingJobRequest request = new TrainingJobRequest("model-a", "dataset", "note");
        TrainingJobResponse expected =
            new TrainingJobResponse(1, "train-job-1", "model-a", "dataset", "note", "QUEUED", "time");
        when(service.createTrainingJob(request)).thenReturn(expected);

        ResponseEntity<?> result = controller.createTrainingJob(request);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertEquals(expected, result.getBody());
    }

    @Test
    void shouldReturnBadRequestWhenTrainingJobCreateFails() {
        MlFoundationService service = mock(MlFoundationService.class);
        MlFoundationController controller = new MlFoundationController(service);
        TrainingJobRequest request = new TrainingJobRequest("unknown", "dataset", "note");
        when(service.createTrainingJob(request)).thenThrow(new IllegalArgumentException("Unknown model key."));

        ResponseEntity<?> result = controller.createTrainingJob(request);

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        assertEquals(new ApiErrorResponse(false, "Unknown model key."), result.getBody());
    }

    @Test
    void shouldListExperiments() {
        MlFoundationService service = mock(MlFoundationService.class);
        MlFoundationController controller = new MlFoundationController(service);
        List<ExperimentStubResponse> expected = List.of(
            new ExperimentStubResponse(1, "exp-1", "hypothesis", "note", "DRAFT", "time")
        );
        when(service.listExperiments()).thenReturn(expected);

        List<ExperimentStubResponse> result = controller.listExperiments();

        assertEquals(expected, result);
    }

    @Test
    void shouldCreateExperimentWhenRequestIsValid() {
        MlFoundationService service = mock(MlFoundationService.class);
        MlFoundationController controller = new MlFoundationController(service);
        ExperimentStubRequest request = new ExperimentStubRequest("exp-1", "hypothesis", "note");
        ExperimentStubResponse expected = new ExperimentStubResponse(1, "exp-1", "hypothesis", "note", "DRAFT", "time");
        when(service.createExperiment(request)).thenReturn(expected);

        ResponseEntity<?> result = controller.createExperiment(request);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertEquals(expected, result.getBody());
    }

    @Test
    void shouldReturnBadRequestWhenExperimentCreateFails() {
        MlFoundationService service = mock(MlFoundationService.class);
        MlFoundationController controller = new MlFoundationController(service);
        ExperimentStubRequest request = new ExperimentStubRequest("", "hypothesis", "note");
        when(service.createExperiment(request)).thenThrow(new IllegalArgumentException("Experiment key is required."));

        ResponseEntity<?> result = controller.createExperiment(request);

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        assertEquals(new ApiErrorResponse(false, "Experiment key is required."), result.getBody());
    }
}
