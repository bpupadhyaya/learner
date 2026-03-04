package com.learning.app;

import com.learning.app.config.SecurityConfig;
import com.learning.app.config.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.config.annotation.web.configurers.HttpBasicConfigurer;
import org.springframework.security.config.annotation.web.configurers.SessionManagementConfigurer;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.DefaultSecurityFilterChain;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SecurityConfigTest {

    @Test
    void shouldEncodeAndMatchPassword() {
        SecurityConfig securityConfig = new SecurityConfig(mock(JwtAuthenticationFilter.class));
        PasswordEncoder encoder = securityConfig.passwordEncoder();

        String encoded = encoder.encode("admin123");
        assertTrue(encoder.matches("admin123", encoded));
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    @Test
    void shouldBuildSecurityFilterChainWithJwtFilter() throws Exception {
        JwtAuthenticationFilter jwtFilter = mock(JwtAuthenticationFilter.class);
        SecurityConfig securityConfig = new SecurityConfig(jwtFilter);

        HttpSecurity http = mock(HttpSecurity.class);
        SessionManagementConfigurer<HttpSecurity> sessionManagementConfigurer = mock(SessionManagementConfigurer.class);
        AuthorizeHttpRequestsConfigurer.AuthorizationManagerRequestMatcherRegistry registry =
            mock(AuthorizeHttpRequestsConfigurer.AuthorizationManagerRequestMatcherRegistry.class);
        AuthorizeHttpRequestsConfigurer.AuthorizedUrl permitAllUrl = mock(AuthorizeHttpRequestsConfigurer.AuthorizedUrl.class);
        AuthorizeHttpRequestsConfigurer.AuthorizedUrl adminUrl = mock(AuthorizeHttpRequestsConfigurer.AuthorizedUrl.class);
        AuthorizeHttpRequestsConfigurer.AuthorizedUrl anyUrl = mock(AuthorizeHttpRequestsConfigurer.AuthorizedUrl.class);
        DefaultSecurityFilterChain expectedChain = mock(DefaultSecurityFilterChain.class);

        when(http.csrf(any())).thenAnswer(invocation -> {
            Customizer<CsrfConfigurer<HttpSecurity>> customizer = invocation.getArgument(0);
            customizer.customize(mock(CsrfConfigurer.class));
            return http;
        });
        when(http.httpBasic(any())).thenAnswer(invocation -> {
            Customizer<HttpBasicConfigurer<HttpSecurity>> customizer = invocation.getArgument(0);
            customizer.customize(mock(HttpBasicConfigurer.class));
            return http;
        });
        when(http.sessionManagement(any())).thenAnswer(invocation -> {
            Customizer<SessionManagementConfigurer<HttpSecurity>> customizer = invocation.getArgument(0);
            customizer.customize(sessionManagementConfigurer);
            return http;
        });
        when(sessionManagementConfigurer.sessionCreationPolicy(any())).thenReturn(sessionManagementConfigurer);

        when(http.authorizeHttpRequests(any())).thenAnswer(invocation -> {
            Customizer<AuthorizeHttpRequestsConfigurer.AuthorizationManagerRequestMatcherRegistry> customizer =
                invocation.getArgument(0);
            customizer.customize(registry);
            return http;
        });

        when(registry.requestMatchers("/api/auth/login", "/api/auth/refresh", "/api/system/health")).thenReturn(permitAllUrl);
        when(permitAllUrl.permitAll()).thenReturn(registry);
        when(registry.requestMatchers("/api/system/ping")).thenReturn(adminUrl);
        when(adminUrl.hasRole("ADMIN")).thenReturn(registry);
        when(registry.anyRequest()).thenReturn(anyUrl);
        when(anyUrl.authenticated()).thenReturn(registry);

        when(http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)).thenReturn(http);
        when(http.build()).thenReturn(expectedChain);

        SecurityFilterChain actualChain = securityConfig.securityFilterChain(http);

        assertEquals(expectedChain, actualChain);
        verify(http).addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    }
}
