package com.learning.app.config;

import com.learning.app.entity.AppUser;
import com.learning.app.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DataInitializerTest {

    @Test
    void shouldNotCreateAdminWhenAlreadyPresent() throws Exception {
        UserRepository repository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(repository.findByUsername("admin")).thenReturn(Optional.of(new AppUser("admin", "hash", "Administrator")));

        DataInitializer initializer = new DataInitializer();
        CommandLineRunner runner = initializer.seedInitialUser(repository, encoder);
        runner.run();

        verify(repository, never()).save(any(AppUser.class));
    }

    @Test
    void shouldCreateAdminWhenMissing() throws Exception {
        UserRepository repository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(repository.findByUsername("admin")).thenReturn(Optional.empty());
        when(encoder.encode("admin123")).thenReturn("hashed-value");
        when(repository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DataInitializer initializer = new DataInitializer();
        CommandLineRunner runner = initializer.seedInitialUser(repository, encoder);
        runner.run();

        verify(repository).save(any(AppUser.class));
        verify(encoder).encode("admin123");
    }
}
