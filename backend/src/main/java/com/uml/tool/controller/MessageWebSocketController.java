package com.uml.tool.controller;

import com.uml.tool.model.Message;
import com.uml.tool.DTO.MessageDTO;
import com.uml.tool.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
//import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
public class MessageWebSocketController {
    private static final Logger logger = LoggerFactory.getLogger(MessageWebSocketController.class);
    @Autowired
    private MessageService messageService;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Client sends to /app/chat.sendMessage
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload MessageDTO dto) {
        logger.info("WebSocket received: senderId={}, projectId={}, content={}", dto.getSenderId(), dto.getProjectId(),
                dto.getContent());
        Message saved = messageService.sendMessage(dto.getSenderId(), dto.getProjectId(), dto.getContent());
        logger.info("Broadcasting to /topic/project-{}: {}", dto.getProjectId(), saved);
        messagingTemplate.convertAndSend("/topic/project-" + dto.getProjectId(), saved);
    }
}
