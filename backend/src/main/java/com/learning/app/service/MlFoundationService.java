package com.learning.app.service;

import com.learning.app.dto.ExperimentStubRequest;
import com.learning.app.dto.ExperimentStubResponse;
import com.learning.app.dto.ModelRegistryRequest;
import com.learning.app.dto.ModelRegistryResponse;
import com.learning.app.dto.TrainingJobRequest;
import com.learning.app.dto.TrainingJobResponse;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class MlFoundationService {

    private final AtomicLong modelIdSequence = new AtomicLong(1);
    private final AtomicLong trainingJobIdSequence = new AtomicLong(1);
    private final AtomicLong experimentIdSequence = new AtomicLong(1);

    private final CopyOnWriteArrayList<ModelRegistryResponse> models = new CopyOnWriteArrayList<>();
    private final CopyOnWriteArrayList<TrainingJobResponse> trainingJobs = new CopyOnWriteArrayList<>();
    private final CopyOnWriteArrayList<ExperimentStubResponse> experiments = new CopyOnWriteArrayList<>();

    public MlFoundationService() {
        registerModel(new ModelRegistryRequest("baseline-transformer", "Baseline Transformer", "1.0.0", "PyTorch"));
        createExperiment(new ExperimentStubRequest(
            "exp-bootstrap-001",
            "Baseline transformer should converge under initial synthetic dataset.",
            "Starter experiment stub created by system."
        ));
    }

    public List<ModelRegistryResponse> listModels() {
        return List.copyOf(models);
    }

    public ModelRegistryResponse registerModel(ModelRegistryRequest request) {
        validateNotBlank(request.modelKey(), "Model key is required.");
        validateNotBlank(request.displayName(), "Display name is required.");
        validateNotBlank(request.version(), "Version is required.");
        validateNotBlank(request.framework(), "Framework is required.");

        boolean duplicateExists = models.stream()
            .anyMatch(model -> model.modelKey().equalsIgnoreCase(request.modelKey())
                && model.version().equalsIgnoreCase(request.version()));
        if (duplicateExists) {
            throw new IllegalArgumentException("Model already exists for key/version.");
        }

        ModelRegistryResponse response = new ModelRegistryResponse(
            modelIdSequence.getAndIncrement(),
            request.modelKey().trim(),
            request.displayName().trim(),
            request.version().trim(),
            request.framework().trim(),
            "REGISTERED",
            Instant.now().toString()
        );
        models.add(response);
        return response;
    }

    public List<TrainingJobResponse> listTrainingJobs() {
        return List.copyOf(trainingJobs);
    }

    public TrainingJobResponse createTrainingJob(TrainingJobRequest request) {
        validateNotBlank(request.modelKey(), "Model key is required.");
        validateNotBlank(request.datasetRef(), "Dataset reference is required.");

        boolean knownModel = models.stream()
            .anyMatch(model -> model.modelKey().equalsIgnoreCase(request.modelKey()));
        if (!knownModel) {
            throw new IllegalArgumentException("Unknown model key.");
        }

        long jobId = trainingJobIdSequence.getAndIncrement();
        TrainingJobResponse response = new TrainingJobResponse(
            jobId,
            "train-job-" + jobId,
            request.modelKey().trim(),
            request.datasetRef().trim(),
            request.notes() == null ? "" : request.notes().trim(),
            "QUEUED",
            Instant.now().toString()
        );
        trainingJobs.add(response);
        return response;
    }

    public List<ExperimentStubResponse> listExperiments() {
        return List.copyOf(experiments);
    }

    public ExperimentStubResponse createExperiment(ExperimentStubRequest request) {
        validateNotBlank(request.experimentKey(), "Experiment key is required.");
        validateNotBlank(request.hypothesis(), "Hypothesis is required.");

        boolean duplicateExists = experiments.stream()
            .anyMatch(experiment -> experiment.experimentKey().equalsIgnoreCase(request.experimentKey()));
        if (duplicateExists) {
            throw new IllegalArgumentException("Experiment key already exists.");
        }

        ExperimentStubResponse response = new ExperimentStubResponse(
            experimentIdSequence.getAndIncrement(),
            request.experimentKey().trim(),
            request.hypothesis().trim(),
            request.notes() == null ? "" : request.notes().trim(),
            "DRAFT",
            Instant.now().toString()
        );
        experiments.add(response);
        return response;
    }

    private void validateNotBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
}
