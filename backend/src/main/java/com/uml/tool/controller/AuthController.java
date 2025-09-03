package com.uml.tool.controller;

import com.uml.tool.constants.UserRoles;
import com.uml.tool.model.UserLoginDetails;
//import com.uml.tool.DTO.UserLoginDTO;
import com.uml.tool.repository.UserLoginDetailsRepository;
import jakarta.servlet.http.HttpServletRequest;
//import jakarta.validation.constraints.Email;
//import jakarta.validation.constraints.NotBlank;
//import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5000" }, allowCredentials = "true")
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserLoginDetailsRepository userLoginDetailsRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager,
            UserLoginDetailsRepository userLoginDetailsRepository,
            PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.userLoginDetailsRepository = userLoginDetailsRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Login endpoint
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        // Create session and set context
        request.getSession(true);
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            request.getSession(true).setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
            // Set JSESSIONID cookie manually if not present (for MockMvc tests)
            Map<String, String> result = new HashMap<>();
            result.put("message", "Login successful");
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, "JSESSIONID=" + request.getSession().getId() + "; Path=/; HttpOnly")
                    .body(result);
        } catch (AuthenticationException ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    // Registration endpoint
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest registerRequest) {
        // Validate input
        if (registerRequest.getEmail() == null
                || !registerRequest.getEmail().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid email");
        }
        if (registerRequest.getPassword() == null || registerRequest.getPassword().length() < 8) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password must be at least 8 characters");
        }
        if (registerRequest.getUsername() == null || registerRequest.getUsername().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username is required");
        }
        if (userLoginDetailsRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already exists");
        }
        if (userLoginDetailsRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username already exists");
        }
        UserLoginDetails newUser = new UserLoginDetails();
        newUser.setEmail(registerRequest.getEmail());
        newUser.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        newUser.setRole(UserRoles.USER);
        newUser.setUsername(registerRequest.getUsername());
        newUser.setFirstName(registerRequest.getFirstName());
        newUser.setLastName(registerRequest.getLastName());
        newUser.setOccupation(registerRequest.getOccupation());
        userLoginDetailsRepository.save(newUser);
        return ResponseEntity.ok("User registered successfully");
    }

    // Endpoint to get current authenticated user
    @GetMapping("/aUser")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName(); // This is the email
            // Fetch user from DB
            Optional<UserLoginDetails> userOpt = userLoginDetailsRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                UserLoginDetails user = userOpt.get();
                // Return all user info (except password)
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("email", user.getEmail());
                userInfo.put("username", user.getUsername());
                userInfo.put("role", user.getRole());
                userInfo.put("firstName", user.getFirstName());
                userInfo.put("lastName", user.getLastName());
                userInfo.put("occupation", user.getOccupation());
                userInfo.put("profileImage", user.getProfileImage());
                return ResponseEntity.ok(userInfo);
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        try {
            if (request.getSession(false) != null) {
                request.getSession(false).invalidate();
            }
        } catch (Exception e) {
            // Ignore if session is already invalidated
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok("Logged out");
    }

    @Getter
    @Setter
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Getter
    @Setter
    public static class RegisterRequest {
        private String email;
        private String password;
        private String username;
        private String firstName;
        private String lastName;
        private String occupation;
    }
}
