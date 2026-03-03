package com.learning.app;

import com.learning.app.controller.SystemController;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SystemControllerTest {

    @Test
    void shouldReturnOkStatus() {
        SystemController controller = new SystemController();
        Map<String, String> result = controller.ping();

        assertEquals("ok", result.get("status"));
    }
}
