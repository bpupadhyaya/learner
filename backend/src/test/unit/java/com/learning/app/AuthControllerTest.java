package com.learning.app;

import com.learning.app.controller.AuthController;
import com.learning.app.dto.LoginRequest;
import com.learning.app.dto.LoginResponse;
import com.learning.app.dto.LogoutRequest;
import com.learning.app.dto.RefreshRequest;
import com.learning.app.dto.UserResponse;
import com.learning.app.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.TestingAuthenticationToken;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthControllerTest {

    @Test
    void shouldReturnOkOnSuccessfulLogin() {
        AuthService service = mock(AuthService.class);
        AuthController controller = new AuthController(service);
        LoginRequest request = new LoginRequest("admin", "admin123");
        LoginResponse response = new LoginResponse(true, "Login successful.", new UserResponse("admin", "Administrator", "ADMIN"));
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

    @Test
    void shouldRefreshTokensWhenRequestIsValid() {
        AuthService service = mock(AuthService.class);
        AuthController controller = new AuthController(service);
        RefreshRequest request = new RefreshRequest("refresh");
        LoginResponse response = new LoginResponse(true, "Token refresh successful.", null);
        when(service.refresh("refresh")).thenReturn(response);

        ResponseEntity<LoginResponse> result = controller.refresh(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(response, result.getBody());
    }

    @Test
    void shouldReturnUnauthorizedWhenRefreshFails() {
        AuthService service = mock(AuthService.class);
        AuthController controller = new AuthController(service);
        RefreshRequest request = new RefreshRequest("bad");
        LoginResponse response = new LoginResponse(false, "Invalid or expired refresh token.", null);
        when(service.refresh("bad")).thenReturn(response);

        ResponseEntity<LoginResponse> result = controller.refresh(request);

        assertEquals(HttpStatus.UNAUTHORIZED, result.getStatusCode());
        assertEquals(response, result.getBody());
    }

    @Test
    void shouldLogoutSuccessfully() {
        AuthService service = mock(AuthService.class);
        AuthController controller = new AuthController(service);
        LogoutRequest request = new LogoutRequest("refresh");
        LoginResponse response = new LoginResponse(true, "Logout successful.", null);
        when(service.logout("refresh")).thenReturn(response);

        ResponseEntity<LoginResponse> result = controller.logout(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(response, result.getBody());
    }

    @Test
    void shouldReturnUnauthorizedWhenLogoutFails() {
        AuthService service = mock(AuthService.class);
        AuthController controller = new AuthController(service);
        LogoutRequest request = new LogoutRequest("bad");
        LoginResponse response = new LoginResponse(false, "Invalid or expired refresh token.", null);
        when(service.logout("bad")).thenReturn(response);

        ResponseEntity<LoginResponse> result = controller.logout(request);

        assertEquals(HttpStatus.UNAUTHORIZED, result.getStatusCode());
        assertEquals(response, result.getBody());
    }

    @Test
    void shouldReturnAuthenticatedUserProfile() {
        AuthService service = mock(AuthService.class);
        AuthController controller = new AuthController(service);
        TestingAuthenticationToken auth = new TestingAuthenticationToken("admin", null);
        UserResponse user = new UserResponse("admin", "Administrator", "ADMIN");
        when(service.getUserProfile("admin")).thenReturn(user);

        ResponseEntity<UserResponse> result = controller.me(auth);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(user, result.getBody());
    }

    @Test
    void shouldReturnNotFoundWhenUserProfileMissing() {
        AuthService service = mock(AuthService.class);
        AuthController controller = new AuthController(service);
        TestingAuthenticationToken auth = new TestingAuthenticationToken("ghost", null);
        when(service.getUserProfile("ghost")).thenReturn(null);

        ResponseEntity<UserResponse> result = controller.me(auth);

        assertEquals(HttpStatus.NOT_FOUND, result.getStatusCode());
    }
}
