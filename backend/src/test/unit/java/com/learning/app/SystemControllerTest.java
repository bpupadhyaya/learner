package com.learning.app;

import com.learning.app.controller.SystemController;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class SystemControllerTest {

    @Test
    void shouldReturnHealthPayload() {
        SystemController controller = new SystemController();
        Map<String, String> result = controller.health();

        assertEquals("learning-backend", result.get("service"));
        assertEquals("ok", result.get("status"));
        assertNotNull(result.get("time"));
    }

    @Test
    void shouldReturnOkStatus() {
        SystemController controller = new SystemController();
        Map<String, String> result = controller.ping();

        assertEquals("ok", result.get("status"));
    }
}
