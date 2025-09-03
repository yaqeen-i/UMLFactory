package com.uml.tool.controller;

import com.uml.tool.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import org.springframework.security.core.Authentication;
import com.uml.tool.model.UserLoginDetails;
import com.uml.tool.repository.UserLoginDetailsRepository;
//import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTest {
    @Mock
    private UserService userService;
    @Mock
    private UserLoginDetailsRepository userLoginDetailsRepository;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private PasswordEncoder passwordEncoder;
    private com.uml.tool.controller.AuthController authController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        authController = new com.uml.tool.controller.AuthController(authenticationManager, userLoginDetailsRepository,
                passwordEncoder);
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new com.uml.tool.exception.GlobalExceptionHandler())
                .build();
    }

    @Test
    void testGetCurrentUser_authenticated() throws Exception {
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("user@example.com");
        UserLoginDetails user = new UserLoginDetails();
        user.setEmail("user@example.com");
        user.setUsername("testuser");
        user.setRole(com.uml.tool.constants.UserRoles.USER);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setOccupation("Dev");
        user.setProfileImage("img.png");
        when(userLoginDetailsRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        mockMvc.perform(get("/auth/aUser").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.firstName").value("Test"))
                .andExpect(jsonPath("$.lastName").value("User"))
                .andExpect(jsonPath("$.occupation").value("Dev"))
                .andExpect(jsonPath("$.profileImage").value("img.png"));
    }

    @Test
    void testGetCurrentUser_unauthenticated() throws Exception {
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(false);
        mockMvc.perform(get("/auth/aUser").principal(authentication))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Not authenticated"));
    }

    @Test
    void testLogout() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setSession(new org.springframework.mock.web.MockHttpSession());
        mockMvc.perform(
                post("/auth/logout").requestAttr("org.springframework.mock.web.MockHttpServletRequest", request))
                .andExpect(status().isOk())
                .andExpect(content().string("Logged out"));
    }

    @Test
    void testLogout_noSession() throws Exception {
        MockHttpServletRequest request = mock(MockHttpServletRequest.class);
        when(request.getSession(false)).thenReturn(null);
        mockMvc.perform(
                post("/auth/logout").requestAttr("org.springframework.mock.web.MockHttpServletRequest", request))
                .andExpect(status().isOk())
                .andExpect(content().string("Logged out"));
    }

    @Test
    void testRegister_invalidEmail() throws Exception {
        mockMvc.perform(post("/auth/register")
                .contentType("application/json")
                .content("{" +
                        "\"email\":\"invalid\"," +
                        "\"username\":\"user\"," +
                        "\"password\":\"password123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Invalid email"));
    }

    @Test
    void testRegister_shortPassword() throws Exception {
        mockMvc.perform(post("/auth/register")
                .contentType("application/json")
                .content("{" +
                        "\"email\":\"user@example.com\"," +
                        "\"username\":\"user\"," +
                        "\"password\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Password must be at least 8 characters"));
    }

    @Test
    void testRegister_missingUsername() throws Exception {
        mockMvc.perform(post("/auth/register")
                .contentType("application/json")
                .content("{" +
                        "\"email\":\"user@example.com\"," +
                        "\"password\":\"password123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Username is required"));
    }

    @Test
    void testRegister_duplicateEmail() throws Exception {
        when(userLoginDetailsRepository.findByEmail("user@example.com"))
                .thenReturn(java.util.Optional.of(new UserLoginDetails()));
        mockMvc.perform(post("/auth/register")
                .contentType("application/json")
                .content("{" +
                        "\"email\":\"user@example.com\"," +
                        "\"username\":\"user\"," +
                        "\"password\":\"password123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Email already exists"));
    }

    @Test
    void testRegister_duplicateUsername() throws Exception {
        when(userLoginDetailsRepository.findByUsername("user"))
                .thenReturn(java.util.Optional.of(new UserLoginDetails()));
        mockMvc.perform(post("/auth/register")
                .contentType("application/json")
                .content("{" +
                        "\"email\":\"user2@example.com\"," +
                        "\"username\":\"user\"," +
                        "\"password\":\"password123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Username already exists"));
    }

    @Test
    void testRegister_nullEmail() throws Exception {
        mockMvc.perform(post("/auth/register")
                .contentType("application/json")
                .content("{" +
                        "\"username\":\"user\"," +
                        "\"password\":\"password123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Invalid email"));
    }

    @Test
    void testRegister_nullPassword() throws Exception {
        mockMvc.perform(post("/auth/register")
                .contentType("application/json")
                .content("{" +
                        "\"email\":\"user@example.com\"," +
                        "\"username\":\"user\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Password must be at least 8 characters"));
    }

    @Test
    void testRegister_blankUsername() throws Exception {
        mockMvc.perform(post("/auth/register")
                .contentType("application/json")
                .content("{" +
                        "\"email\":\"user@example.com\"," +
                        "\"username\":\"   \" ," +
                        "\"password\":\"password123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Username is required"));
    }

    @Test
    void testGetCurrentUser_nullAuthentication() throws Exception {
        mockMvc.perform(get("/auth/aUser"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Not authenticated"));
    }

    @Test
    void testGetCurrentUser_userNotFound() throws Exception {
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("notfound@example.com");
        when(userLoginDetailsRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());
        mockMvc.perform(get("/auth/aUser").principal(authentication))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Not authenticated"));
    }

    @Test
    void testLogout_sessionAlreadyInvalidated() throws Exception {
        MockHttpServletRequest request = mock(MockHttpServletRequest.class);
        when(request.getSession(false)).thenThrow(new IllegalStateException("Session already invalidated"));
        mockMvc.perform(
                post("/auth/logout").requestAttr("org.springframework.mock.web.MockHttpServletRequest", request))
                .andExpect(status().isOk())
                .andExpect(content().string("Logged out"));
    }

    @Test
    void testRegisterRequestSetters() {
        com.uml.tool.controller.AuthController.RegisterRequest req = new com.uml.tool.controller.AuthController.RegisterRequest();
        req.setEmail("test@example.com");
        req.setPassword("password123");
        req.setUsername("testuser");
        req.setFirstName("Test");
        req.setLastName("User");
        req.setOccupation("Developer");
        assert "test@example.com".equals(req.getEmail());
        assert "password123".equals(req.getPassword());
        assert "testuser".equals(req.getUsername());
        assert "Test".equals(req.getFirstName());
        assert "User".equals(req.getLastName());
        assert "Developer".equals(req.getOccupation());
    }

    @Test
    void testLogout_directBranches() {
        jakarta.servlet.http.HttpServletRequest req1 = mock(jakarta.servlet.http.HttpServletRequest.class);
        jakarta.servlet.http.HttpSession session = mock(jakarta.servlet.http.HttpSession.class);
        when(req1.getSession(false)).thenReturn(session);
        authController.logout(req1);

        jakarta.servlet.http.HttpServletRequest req2 = mock(jakarta.servlet.http.HttpServletRequest.class);
        when(req2.getSession(false)).thenReturn(null);
        authController.logout(req2);

        jakarta.servlet.http.HttpServletRequest req3 = mock(jakarta.servlet.http.HttpServletRequest.class);
        when(req3.getSession(false)).thenThrow(new IllegalStateException("Session already invalidated"));
        authController.logout(req3);
    }

    @Test
    void testLogin_sessionBranches() {
        jakarta.servlet.http.HttpServletRequest req1 = mock(jakarta.servlet.http.HttpServletRequest.class);
        jakarta.servlet.http.HttpSession session = mock(jakarta.servlet.http.HttpSession.class);
        when(req1.getSession(false)).thenReturn(session);
        when(req1.getSession(true)).thenReturn(session);
        com.uml.tool.controller.AuthController.LoginRequest loginRequest = new com.uml.tool.controller.AuthController.LoginRequest();
        loginRequest.setEmail("user@example.com");
        loginRequest.setPassword("password123");
        try {
            authController.login(loginRequest, req1);
        } catch (Exception ignored) {
        }
        verify(session, times(1)).invalidate();

        jakarta.servlet.http.HttpServletRequest req2 = mock(jakarta.servlet.http.HttpServletRequest.class);
        jakarta.servlet.http.HttpSession session2 = mock(jakarta.servlet.http.HttpSession.class);
        when(req2.getSession(false)).thenReturn(null);
        when(req2.getSession(true)).thenReturn(session2);
        try {
            authController.login(loginRequest, req2);
        } catch (Exception ignored) {
        }
        verify(session2, never()).invalidate();

        jakarta.servlet.http.HttpServletRequest req3 = mock(jakarta.servlet.http.HttpServletRequest.class);
        when(req3.getSession(false)).thenThrow(new IllegalStateException("Session already invalidated"));
        jakarta.servlet.http.HttpSession session3 = mock(jakarta.servlet.http.HttpSession.class);
        when(req3.getSession(true)).thenReturn(session3);
        try {
            authController.login(loginRequest, req3);
        } catch (Exception ignored) {
        }
    }

}
