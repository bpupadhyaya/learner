package com.learning.app;

import com.learning.app.controller.AuthController;
import com.learning.app.dto.LoginRequest;
import com.learning.app.dto.LoginResponse;
import com.learning.app.dto.UserResponse;
import com.learning.app.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthControllerTest {

    @Test
    void shouldReturnOkOnSuccessfulLogin() {
        AuthService service = mock(AuthService.class);
        AuthController controller = new AuthController(service);
        LoginRequest request = new LoginRequest("admin", "admin123");
        LoginResponse response = new LoginResponse(true, "Login successful.", new UserResponse("admin", "Administrator"));
        when(service.authenticate(request)).thenReturn(response);

        ResponseEntity<LoginResponse> result = controller.login(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(response, result.getBody());
    }

    @Test
    void shouldReturnUnauthorizedOnFailedLogin() {
        AuthService service = mock(AuthService.class);
        AuthController controller = new AuthController(service);
        LoginRequest request = new LoginRequest("admin", "wrong");
        LoginResponse response = new LoginResponse(false, "Invalid username or password.", null);
        when(service.authenticate(request)).thenReturn(response);

        ResponseEntity<LoginResponse> result = controller.login(request);

        assertEquals(HttpStatus.UNAUTHORIZED, result.getStatusCode());
        assertEquals(response, result.getBody());
    }
}
