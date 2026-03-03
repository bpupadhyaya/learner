package com.learning.app.service;

import com.learning.app.dto.LoginRequest;
import com.learning.app.dto.LoginResponse;
import com.learning.app.dto.UserResponse;
import com.learning.app.entity.AppUser;
import com.learning.app.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse authenticate(LoginRequest request) {
        Optional<AppUser> userOptional = userRepository.findByUsername(request.username());
        if (userOptional.isEmpty()) {
            return new LoginResponse(false, "Invalid username or password.", null);
        }

        AppUser user = userOptional.get();
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return new LoginResponse(false, "Invalid username or password.", null);
        }

        UserResponse userResponse = new UserResponse(user.getUsername(), user.getDisplayName());
        return new LoginResponse(true, "Login successful.", userResponse);
    }
}
