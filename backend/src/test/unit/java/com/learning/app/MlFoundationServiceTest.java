package com.learning.app;

import com.learning.app.dto.ExperimentStubRequest;
import com.learning.app.dto.ExperimentStubResponse;
import com.learning.app.dto.ModelRegistryRequest;
import com.learning.app.dto.ModelRegistryResponse;
import com.learning.app.dto.TrainingJobRequest;
import com.learning.app.dto.TrainingJobResponse;
import com.learning.app.service.MlFoundationService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MlFoundationServiceTest {

    @Test
    void shouldSeedDefaultModelAndExperiment() {
        MlFoundationService service = new MlFoundationService();

        assertFalse(service.listModels().isEmpty());
        assertFalse(service.listExperiments().isEmpty());
    }

    @Test
    void shouldRegisterModelSuccessfully() {
        MlFoundationService service = new MlFoundationService();

        ModelRegistryResponse result = service.registerModel(
            new ModelRegistryRequest("vision-transformer", "Vision Transformer", "1.0.1", "PyTorch")
        );

        assertEquals("vision-transformer", result.modelKey());
        assertEquals("Vision Transformer", result.displayName());
        assertEquals("1.0.1", result.version());
        assertEquals("PyTorch", result.framework());
        assertEquals("REGISTERED", result.status());
        assertNotNull(result.createdAt());
    }

    @Test
    void shouldRejectDuplicateModelKeyAndVersion() {
        MlFoundationService service = new MlFoundationService();
        service.registerModel(new ModelRegistryRequest("tabular-model", "Tabular", "1.0.0", "XGBoost"));

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () ->
            service.registerModel(new ModelRegistryRequest("tabular-model", "Tabular v2", "1.0.0", "XGBoost"))
        );

        assertEquals("Model already exists for key/version.", error.getMessage());
    }

    @Test
    void shouldAllowSameModelKeyWithDifferentVersion() {
        MlFoundationService service = new MlFoundationService();
        service.registerModel(new ModelRegistryRequest("tabular-model", "Tabular", "1.0.0", "XGBoost"));

        ModelRegistryResponse result = service.registerModel(
            new ModelRegistryRequest("tabular-model", "Tabular v2", "1.0.1", "XGBoost")
        );

        assertEquals("tabular-model", result.modelKey());
        assertEquals("1.0.1", result.version());
    }

    @Test
    void shouldRejectModelWithBlankFields() {
        MlFoundationService service = new MlFoundationService();

        IllegalArgumentException missingKey = assertThrows(IllegalArgumentException.class, () ->
            service.registerModel(new ModelRegistryRequest(" ", "Name", "1.0.0", "PyTorch"))
        );
        IllegalArgumentException missingDisplayName = assertThrows(IllegalArgumentException.class, () ->
            service.registerModel(new ModelRegistryRequest("model-key", " ", "1.0.0", "PyTorch"))
        );
        IllegalArgumentException missingVersion = assertThrows(IllegalArgumentException.class, () ->
            service.registerModel(new ModelRegistryRequest("model-key", "Name", "", "PyTorch"))
        );
        IllegalArgumentException missingFramework = assertThrows(IllegalArgumentException.class, () ->
            service.registerModel(new ModelRegistryRequest("model-key", "Name", "1.0.0", null))
        );

        assertEquals("Model key is required.", missingKey.getMessage());
        assertEquals("Display name is required.", missingDisplayName.getMessage());
        assertEquals("Version is required.", missingVersion.getMessage());
        assertEquals("Framework is required.", missingFramework.getMessage());
    }

    @Test
    void shouldCreateTrainingJobForKnownModel() {
        MlFoundationService service = new MlFoundationService();
        service.registerModel(new ModelRegistryRequest("rl-agent", "RL Agent", "2.0.0", "JAX"));

        TrainingJobResponse response = service.createTrainingJob(
            new TrainingJobRequest("rl-agent", "datasets/sim-v1", "first run")
        );

        assertEquals("rl-agent", response.modelKey());
        assertEquals("datasets/sim-v1", response.datasetRef());
        assertEquals("first run", response.notes());
        assertEquals("QUEUED", response.status());
        assertTrue(response.jobName().startsWith("train-job-"));
    }

    @Test
    void shouldDefaultTrainingJobNotesWhenNotesAreNull() {
        MlFoundationService service = new MlFoundationService();
        service.registerModel(new ModelRegistryRequest("cv-model", "CV Model", "1.0.0", "PyTorch"));

        TrainingJobResponse response = service.createTrainingJob(
            new TrainingJobRequest("cv-model", "datasets/cv-v1", null)
        );

        assertEquals("", response.notes());
        assertFalse(service.listTrainingJobs().isEmpty());
    }

    @Test
    void shouldRejectTrainingJobForUnknownModel() {
        MlFoundationService service = new MlFoundationService();

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () ->
            service.createTrainingJob(new TrainingJobRequest("unknown-model", "dataset", ""))
        );

        assertEquals("Unknown model key.", error.getMessage());
    }

    @Test
    void shouldRejectTrainingJobWithMissingRequiredFields() {
        MlFoundationService service = new MlFoundationService();
        service.registerModel(new ModelRegistryRequest("nlp-model", "NLP Model", "1.1.0", "TensorFlow"));

        IllegalArgumentException missingModel = assertThrows(IllegalArgumentException.class, () ->
            service.createTrainingJob(new TrainingJobRequest(" ", "dataset", ""))
        );
        IllegalArgumentException missingDataset = assertThrows(IllegalArgumentException.class, () ->
            service.createTrainingJob(new TrainingJobRequest("nlp-model", " ", ""))
        );

        assertEquals("Model key is required.", missingModel.getMessage());
        assertEquals("Dataset reference is required.", missingDataset.getMessage());
    }

    @Test
    void shouldCreateExperimentStub() {
        MlFoundationService service = new MlFoundationService();

        ExperimentStubResponse response = service.createExperiment(
            new ExperimentStubRequest("exp-vision-002", "Vision model improves accuracy with augmentation.", "draft")
        );

        assertEquals("exp-vision-002", response.experimentKey());
        assertEquals("Vision model improves accuracy with augmentation.", response.hypothesis());
        assertEquals("draft", response.notes());
        assertEquals("DRAFT", response.status());
    }

    @Test
    void shouldDefaultExperimentNotesWhenNotesAreNull() {
        MlFoundationService service = new MlFoundationService();

        ExperimentStubResponse response = service.createExperiment(
            new ExperimentStubRequest("exp-notes-null", "Hypothesis for null notes.", null)
        );

        assertEquals("", response.notes());
        assertFalse(service.listExperiments().isEmpty());
    }

    @Test
    void shouldRejectExperimentWithMissingRequiredFieldsOrDuplicates() {
        MlFoundationService service = new MlFoundationService();
        service.createExperiment(new ExperimentStubRequest("exp-dup", "baseline", ""));

        IllegalArgumentException missingKey = assertThrows(IllegalArgumentException.class, () ->
            service.createExperiment(new ExperimentStubRequest(" ", "baseline", ""))
        );
        IllegalArgumentException missingHypothesis = assertThrows(IllegalArgumentException.class, () ->
            service.createExperiment(new ExperimentStubRequest("exp-hyp", " ", ""))
        );
        IllegalArgumentException duplicate = assertThrows(IllegalArgumentException.class, () ->
            service.createExperiment(new ExperimentStubRequest("exp-dup", "different", ""))
        );

        assertEquals("Experiment key is required.", missingKey.getMessage());
        assertEquals("Hypothesis is required.", missingHypothesis.getMessage());
        assertEquals("Experiment key already exists.", duplicate.getMessage());
    }
}
