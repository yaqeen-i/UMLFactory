package com.uml.tool.controller;

// import com.uml.tool.DTO.UserCreateDTO;
// import com.uml.tool.DTO.UserDTO;
// import com.uml.tool.DTO.UserUpdateDTO;
import com.uml.tool.model.UserLoginDetails;
import com.uml.tool.service.AdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminControllerTest {
        @Mock
        private AdminService adminService;
        @InjectMocks
        private AdminController adminController;
        private MockMvc mockMvc;

        @BeforeEach
        void setUp() {
                MockitoAnnotations.openMocks(this);
                LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
                validator.afterPropertiesSet();
                mockMvc = MockMvcBuilders.standaloneSetup(adminController)
                                .setControllerAdvice(new com.uml.tool.exception.GlobalExceptionHandler())
                                .setValidator(validator)
                                .build();
        }

        @Test
        void testAddAdmin() throws Exception {
                when(adminService.addAdmin(any())).thenReturn(new UserLoginDetails());
                mockMvc.perform(post("/api/admin/add-admin")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{" +
                                                "\"email\":\"admin@example.com\"," +
                                                "\"username\":\"adminuser\"," +
                                                "\"password\":\"password123\"}"))
                                .andExpect(status().isOk());
        }

        @Test
        void testAddUser() throws Exception {
                when(adminService.addUser(any())).thenReturn(new UserLoginDetails());
                mockMvc.perform(post("/api/admin/add-user")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{" +
                                                "\"email\":\"user@example.com\"," +
                                                "\"username\":\"testuser\"," +
                                                "\"password\":\"password123\"}"))
                                .andExpect(status().isOk());
        }

        @Test
        void testDeleteUser() throws Exception {
                doNothing().when(adminService).deleteUserByEmail(any());
                mockMvc.perform(delete("/api/admin/delete-user/test@example.com"))
                                .andExpect(status().isOk());
        }

        @Test
        void testGetAllUsers() throws Exception {
                when(adminService.getAllUsers()).thenReturn(Collections.emptyList());
                mockMvc.perform(get("/api/admin/users"))
                                .andExpect(status().isOk());
        }

        @Test
        void testUpdateAdminProfile() throws Exception {
                when(adminService.updateAdminProfile(any(), any())).thenReturn(new UserLoginDetails());
                mockMvc.perform(put("/api/admin/profile/test@example.com")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{" +
                                                "\"email\":\"test@example.com\"," +
                                                "\"username\":\"admin\"}"))
                                .andExpect(status().isOk());
        }

        @Test
        void testAddAdmin_Error() throws Exception {
                when(adminService.addAdmin(any())).thenThrow(new RuntimeException("error"));
                mockMvc.perform(post("/api/admin/add-admin")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{" +
                                                "\"email\":\"admin@example.com\"," +
                                                "\"username\":\"adminuser\"," +
                                                "\"password\":\"password123\"}"))
                                .andExpect(status().isInternalServerError());
        }

        @Test
        void testAddUser_Duplicate() throws Exception {
                when(adminService.addUser(any()))
                                .thenThrow(new RuntimeException("User with this email or username already exists."));
                mockMvc.perform(post("/api/admin/add-user")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{" +
                                                "\"email\":\"user@example.com\"," +
                                                "\"username\":\"testuser\"," +
                                                "\"password\":\"password123\"}"))
                                .andExpect(status().isInternalServerError());
        }

        @Test
        void testDeleteUser_Error() throws Exception {
                doThrow(new RuntimeException("error")).when(adminService).deleteUserByEmail(any());
                mockMvc.perform(delete("/api/admin/delete-user/test@example.com"))
                                .andExpect(status().isInternalServerError());
        }

        @Test
        void testGetAllUsers_Error() throws Exception {
                when(adminService.getAllUsers()).thenThrow(new RuntimeException("error"));
                mockMvc.perform(get("/api/admin/users"))
                                .andExpect(status().isInternalServerError());
        }

        @Test
        void testUpdateAdminProfile_NotFound() throws Exception {
                when(adminService.updateAdminProfile(any(), any())).thenThrow(new RuntimeException("not found"));
                mockMvc.perform(put("/api/admin/profile/test@example.com")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{" +
                                                "\"email\":\"test@example.com\"," +
                                                "\"username\":\"admin\"}"))
                                .andExpect(status().isInternalServerError());
        }

        @Test
        void testHandleValidationExceptions() throws Exception {
                // Simulate invalid input (missing required field)
                mockMvc.perform(post("/api/admin/add-admin")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}")) // missing required email, username, password
                                .andExpect(status().isBadRequest());
        }

        @Test
        void testHandleUserNotFoundException() throws Exception {
                when(adminService.updateAdminProfile(any(), any()))
                                .thenThrow(new com.uml.tool.exception.UserNotFoundException("User not found"));
                mockMvc.perform(put("/api/admin/profile/test@example.com")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{" +
                                                "\"email\":\"test@example.com\"," +
                                                "\"username\":\"admin\"}"))
                                .andExpect(status().isNotFound());
        }

        @Test
        void testAddAdmin_ReturnsRoleInDTO() throws Exception {
                UserLoginDetails admin = new UserLoginDetails();
                admin.setEmail("admin@example.com");
                admin.setUsername("adminuser");
                admin.setPassword("password123");
                admin.setRole(com.uml.tool.constants.UserRoles.ADMIN);
                when(adminService.addAdmin(any())).thenReturn(admin);
                mockMvc.perform(post("/api/admin/add-admin")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{" +
                                                "\"email\":\"admin@example.com\"," +
                                                "\"username\":\"adminuser\"," +
                                                "\"password\":\"password123\"}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.role").value("ADMIN"));
        }
}
