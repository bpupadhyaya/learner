package com.learning.app;

import com.learning.app.dto.LoginRequest;
import com.learning.app.dto.LoginResponse;
import com.learning.app.dto.LogoutRequest;
import com.learning.app.dto.RefreshRequest;
import com.learning.app.dto.UserResponse;
import com.learning.app.entity.AppUser;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ModelAndDtoTest {

    @Test
    void shouldCoverLoginRequestRecord() {
        LoginRequest request = new LoginRequest("admin", "admin123");
        assertEquals("admin", request.username());
        assertEquals("admin123", request.password());
    }

    @Test
    void shouldCoverUserResponseRecord() {
        UserResponse response = new UserResponse("admin", "Administrator", "ADMIN");
        assertEquals("admin", response.username());
        assertEquals("Administrator", response.displayName());
        assertEquals("ADMIN", response.role());
    }

    @Test
    void shouldCoverUserResponseSecondaryConstructor() {
        UserResponse response = new UserResponse("admin", "Administrator");
        assertEquals("admin", response.username());
        assertEquals("Administrator", response.displayName());
        assertNull(response.role());
    }

    @Test
    void shouldCoverLoginResponseRecord() {
        UserResponse user = new UserResponse("admin", "Administrator", "ADMIN");
        LoginResponse response = new LoginResponse(true, "ok", user, "access", "refresh", "Bearer", "ADMIN");
        assertEquals(true, response.success());
        assertEquals("ok", response.message());
        assertEquals(user, response.user());
        assertEquals("access", response.accessToken());
        assertEquals("refresh", response.refreshToken());
        assertEquals("Bearer", response.tokenType());
        assertEquals("ADMIN", response.role());
    }

    @Test
    void shouldCoverLoginResponseSecondaryConstructor() {
        UserResponse user = new UserResponse("admin", "Administrator", "ADMIN");
        LoginResponse response = new LoginResponse(true, "ok", user);
        assertNull(response.accessToken());
        assertNull(response.refreshToken());
        assertNull(response.tokenType());
        assertNull(response.role());
    }

    @Test
    void shouldCoverRefreshAndLogoutRecords() {
        RefreshRequest refreshRequest = new RefreshRequest("refresh");
        LogoutRequest logoutRequest = new LogoutRequest("refresh");
        assertEquals("refresh", refreshRequest.refreshToken());
        assertEquals("refresh", logoutRequest.refreshToken());
    }

    @Test
    void shouldCoverAppUserConstructorsAndGetters() {
        AppUser empty = new AppUser();
        assertNull(empty.getUsername());

        AppUser user = new AppUser("admin", "hash", "Administrator", "ADMIN");
        ReflectionTestUtils.setField(user, "id", 1L);

        assertEquals(1L, user.getId());
        assertEquals("admin", user.getUsername());
        assertEquals("hash", user.getPasswordHash());
        assertEquals("Administrator", user.getDisplayName());
        assertEquals("ADMIN", user.getRole());
    }

    @Test
    void shouldCoverAppUserSecondaryConstructor() {
        AppUser user = new AppUser("admin", "hash", "Administrator");
        assertEquals("ADMIN", user.getRole());
    }
}
