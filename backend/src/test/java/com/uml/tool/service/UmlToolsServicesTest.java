package com.uml.tool.service;

//import com.uml.tool.DTO.UserLoginDTO;
import com.uml.tool.repository.UserLoginDetailsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UmlToolsServicesTest {
    @Mock
    private UserLoginDetailsRepository userLoginDetailsRepository;
    @InjectMocks
    private UmlToolsServices umlToolsServices;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testLoadUserByUsername_UserNotFound() {
        when(userLoginDetailsRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        assertThrows(UsernameNotFoundException.class, () -> umlToolsServices.loadUserByUsername("email"));
    }
}
