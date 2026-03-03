package com.learning.app;

import com.learning.app.dto.LoginRequest;
import com.learning.app.dto.LoginResponse;
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
        UserResponse response = new UserResponse("admin", "Administrator");
        assertEquals("admin", response.username());
        assertEquals("Administrator", response.displayName());
    }

    @Test
    void shouldCoverLoginResponseRecord() {
        UserResponse user = new UserResponse("admin", "Administrator");
        LoginResponse response = new LoginResponse(true, "ok", user);
        assertEquals(true, response.success());
        assertEquals("ok", response.message());
        assertEquals(user, response.user());
    }

    @Test
    void shouldCoverAppUserConstructorsAndGetters() {
        AppUser empty = new AppUser();
        assertNull(empty.getUsername());

        AppUser user = new AppUser("admin", "hash", "Administrator");
        ReflectionTestUtils.setField(user, "id", 1L);

        assertEquals(1L, user.getId());
        assertEquals("admin", user.getUsername());
        assertEquals("hash", user.getPasswordHash());
        assertEquals("Administrator", user.getDisplayName());
    }
}
