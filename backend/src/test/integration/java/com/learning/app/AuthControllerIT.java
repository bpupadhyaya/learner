package com.learning.app;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIT {

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:h2:mem:learningdb;MODE=PostgreSQL;DB_CLOSE_DELAY=-1");
        registry.add("spring.datasource.username", () -> "sa");
        registry.add("spring.datasource.password", () -> "");
        registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldLoginSuccessfullyWithSeededCredentials() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("""
                    {"username":"admin","password":"admin123"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("Login successful."))
            .andExpect(jsonPath("$.user.username").value("admin"))
            .andExpect(jsonPath("$.user.displayName").value("Administrator"))
            .andExpect(jsonPath("$.user.role").value("ADMIN"))
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty())
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void shouldRejectInvalidPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("""
                    {"username":"admin","password":"wrong"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Invalid username or password."));
    }

    @Test
    void shouldRejectUnknownUser() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("""
                    {"username":"ghost","password":"whatever"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Invalid username or password."));
    }

    @Test
    void shouldProtectNonPublicApiWithoutCredentials() throws Exception {
        mockMvc.perform(get("/api/system/ping"))
            .andExpect(status().isForbidden());
    }

    @Test
    void shouldProtectMlApiWithoutCredentials() throws Exception {
        mockMvc.perform(get("/api/ml/models"))
            .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowProtectedApisWithValidAccessToken() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("""
                    {"username":"admin","password":"admin123"}
                    """))
            .andExpect(status().isOk())
            .andReturn();
        String loginJson = loginResult.getResponse().getContentAsString();
        String accessToken = extractJsonValue(loginJson, "accessToken");
        String refreshToken = extractJsonValue(loginJson, "refreshToken");

        mockMvc.perform(get("/api/system/ping")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ok"));

        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("admin"))
            .andExpect(jsonPath("$.displayName").value("Administrator"))
            .andExpect(jsonPath("$.role").value("ADMIN"));

        mockMvc.perform(post("/api/auth/refresh")
                .contentType("application/json")
                .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("Token refresh successful."))
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void shouldRejectInvalidRefreshToken() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType("application/json")
                .content("""
                    {"refreshToken":"invalid-token"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Invalid or expired refresh token."));
    }

    @Test
    void shouldLogoutSuccessfullyWithValidRefreshToken() throws Exception {
        String accessToken = loginAndExtractToken("accessToken");
        String refreshToken = loginAndExtractToken("refreshToken");

        mockMvc.perform(post("/api/auth/logout")
                .header("Authorization", "Bearer " + accessToken)
                .contentType("application/json")
                .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("Logout successful."));
    }

    @Test
    void shouldRejectInvalidLogoutToken() throws Exception {
        String accessToken = loginAndExtractToken("accessToken");

        mockMvc.perform(post("/api/auth/logout")
                .header("Authorization", "Bearer " + accessToken)
                .contentType("application/json")
                .content("""
                    {"refreshToken":"invalid-token"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Invalid or expired refresh token."));
    }

    @Test
    void shouldRejectInvalidBearerTokenForProtectedEndpoint() throws Exception {
        mockMvc.perform(get("/api/system/ping")
                .header("Authorization", "Bearer invalid-token"))
            .andExpect(status().isForbidden());
    }

    @Test
    void shouldRejectNonBearerAuthorizationHeaderForProtectedEndpoint() throws Exception {
        mockMvc.perform(get("/api/system/ping")
                .header("Authorization", "Basic dGVzdDp0ZXN0"))
            .andExpect(status().isForbidden());
    }

    @Test
    void shouldKeepExistingAuthenticationWhenPresent() throws Exception {
        String accessToken = loginAndExtractToken("accessToken");

        mockMvc.perform(get("/api/auth/me")
                .with(user("ghost").roles("ADMIN"))
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNotFound());
    }

    @Test
    void shouldExposeHealthEndpointWithoutCredentials() throws Exception {
        mockMvc.perform(get("/api/system/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.service").value("learning-backend"))
            .andExpect(jsonPath("$.status").value("ok"))
            .andExpect(jsonPath("$.time").isNotEmpty());
    }

    @Test
    void shouldProvideMlFoundationApisWithValidAccessToken() throws Exception {
        String accessToken = loginAndExtractToken("accessToken");

        mockMvc.perform(get("/api/ml/models")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].modelKey").isNotEmpty())
            .andExpect(jsonPath("$[0].status").value("REGISTERED"));

        mockMvc.perform(post("/api/ml/models")
                .header("Authorization", "Bearer " + accessToken)
                .contentType("application/json")
                .content("""
                    {"modelKey":"timeseries-forecast","displayName":"Time Series Forecast","version":"1.2.0","framework":"PyTorch"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.modelKey").value("timeseries-forecast"))
            .andExpect(jsonPath("$.displayName").value("Time Series Forecast"))
            .andExpect(jsonPath("$.version").value("1.2.0"))
            .andExpect(jsonPath("$.framework").value("PyTorch"))
            .andExpect(jsonPath("$.status").value("REGISTERED"));

        mockMvc.perform(post("/api/ml/models")
                .header("Authorization", "Bearer " + accessToken)
                .contentType("application/json")
                .content("""
                    {"modelKey":"timeseries-forecast","displayName":"Time Series Forecast","version":"1.2.0","framework":"PyTorch"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Model already exists for key/version."));

        mockMvc.perform(post("/api/ml/training-jobs")
                .header("Authorization", "Bearer " + accessToken)
                .contentType("application/json")
                .content("""
                    {"modelKey":"timeseries-forecast","datasetRef":"datasets/forecast-v1","notes":"initial run"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.jobName").isNotEmpty())
            .andExpect(jsonPath("$.modelKey").value("timeseries-forecast"))
            .andExpect(jsonPath("$.datasetRef").value("datasets/forecast-v1"))
            .andExpect(jsonPath("$.status").value("QUEUED"));

        mockMvc.perform(get("/api/ml/training-jobs")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].jobName").isNotEmpty())
            .andExpect(jsonPath("$[0].status").value("QUEUED"));

        mockMvc.perform(post("/api/ml/training-jobs")
                .header("Authorization", "Bearer " + accessToken)
                .contentType("application/json")
                .content("""
                    {"modelKey":"unknown-model","datasetRef":"datasets/forecast-v1","notes":"initial run"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Unknown model key."));

        mockMvc.perform(get("/api/ml/experiments")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].experimentKey").isNotEmpty())
            .andExpect(jsonPath("$[0].status").value("DRAFT"));

        mockMvc.perform(post("/api/ml/experiments")
                .header("Authorization", "Bearer " + accessToken)
                .contentType("application/json")
                .content("""
                    {"experimentKey":"exp-timeseries-010","hypothesis":"Longer context window improves forecast stability.","notes":"stub"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.experimentKey").value("exp-timeseries-010"))
            .andExpect(jsonPath("$.status").value("DRAFT"));

        mockMvc.perform(post("/api/ml/experiments")
                .header("Authorization", "Bearer " + accessToken)
                .contentType("application/json")
                .content("""
                    {"experimentKey":" ","hypothesis":"Longer context window improves forecast stability.","notes":"stub"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Experiment key is required."));
    }

    private String loginAndExtractToken(String key) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("""
                    {"username":"admin","password":"admin123"}
                    """))
            .andExpect(status().isOk())
            .andReturn();
        return extractJsonValue(loginResult.getResponse().getContentAsString(), key);
    }

    private String extractJsonValue(String json, String key) {
        String tokenPrefix = "\"" + key + "\":\"";
        int start = json.indexOf(tokenPrefix);
        int valueStart = start + tokenPrefix.length();
        int valueEnd = json.indexOf('"', valueStart);
        return json.substring(valueStart, valueEnd);
    }
}
