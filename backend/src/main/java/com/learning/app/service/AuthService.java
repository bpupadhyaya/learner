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
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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

        return buildSuccessResponse(user, "Login successful.");
    }

    public LoginResponse refresh(String refreshToken) {
        if (!jwtService.isRefreshTokenValid(refreshToken)) {
            return new LoginResponse(false, "Invalid or expired refresh token.", null);
        }

        String username = jwtService.extractUsername(refreshToken);
        Optional<AppUser> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            return new LoginResponse(false, "User not found.", null);
        }

        return buildSuccessResponse(userOptional.get(), "Token refresh successful.");
    }

    public LoginResponse logout(String refreshToken) {
        if (!jwtService.isRefreshTokenValid(refreshToken)) {
            return new LoginResponse(false, "Invalid or expired refresh token.", null);
        }

        return new LoginResponse(true, "Logout successful.", null);
    }

    public UserResponse getUserProfile(String username) {
        Optional<AppUser> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            return null;
        }

        AppUser user = userOptional.get();
        return new UserResponse(user.getUsername(), user.getDisplayName(), user.getRole());
    }

    private LoginResponse buildSuccessResponse(AppUser user, String message) {
        String accessToken = jwtService.generateAccessToken(user.getUsername(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getUsername(), user.getRole());
        UserResponse userResponse = new UserResponse(user.getUsername(), user.getDisplayName(), user.getRole());
        return new LoginResponse(true, message, userResponse, accessToken, refreshToken, "Bearer", user.getRole());
    }
}
