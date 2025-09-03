package com.uml.tool.controller;

//import com.uml.tool.DTO.MessageDTO;
import com.uml.tool.model.Message;
import com.uml.tool.service.MessageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MessageControllerTest {
    @Mock
    private MessageService messageService;
    @InjectMocks
    private MessageController messageController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(messageController)
                .setControllerAdvice(new com.uml.tool.exception.GlobalExceptionHandler())
                .build();
    }

    @Test
    void testSendMessage() throws Exception {
        when(messageService.sendMessage(any(), any(), any())).thenReturn(new Message());
        mockMvc.perform(post("/api/messages/send")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"senderId\":\"1\",\"projectId\":1,\"content\":\"hi\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetMessagesForProject() throws Exception {
        when(messageService.getMessagesForProject(anyLong())).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/api/messages/project/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testSendMessage_Error() throws Exception {
        when(messageService.sendMessage(any(), any(), any())).thenThrow(new RuntimeException("error"));
        mockMvc.perform(post("/api/messages/send")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"senderId\":\"1\",\"projectId\":1,\"content\":\"hi\"}"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testGetMessagesForProject_Error() throws Exception {
        when(messageService.getMessagesForProject(anyLong())).thenThrow(new RuntimeException("error"));
        mockMvc.perform(get("/api/messages/project/1"))
                .andExpect(status().isInternalServerError());
    }
}
