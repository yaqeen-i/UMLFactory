package com.uml.tool.service;

import com.uml.tool.DTO.CreateGroupRequest;
import com.uml.tool.model.Group;
import com.uml.tool.model.Project;
import com.uml.tool.model.UserLoginDetails;
import com.uml.tool.model.GroupMember;
import com.uml.tool.repository.GroupMemberRepository;
import com.uml.tool.repository.GroupRepository;
import com.uml.tool.repository.ProjectRepository;
import com.uml.tool.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GroupServiceTest {
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private GroupRepository groupRepository;
    @Mock
    private GroupMemberRepository groupMemberRepository;
    @Mock
    private UserRepository userRepository;
    @InjectMocks
    private GroupService groupService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCreateGroup_ProjectNotFound() {
        CreateGroupRequest request = new CreateGroupRequest();
        request.setProjectId(1L);
        when(projectRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> groupService.createGroup(request));
    }

    @Test
    void testCreateGroup_GroupAlreadyExists() {
        CreateGroupRequest request = new CreateGroupRequest();
        request.setProjectId(1L);
        request.setMembers(new ArrayList<>()); // Ensure not null
        Project project = new Project();
        project.setId(1L); // Set project ID to match request
        UserLoginDetails owner = new UserLoginDetails();
        owner.setEmail("owner@example.com");
        project.setOwner(owner);
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(groupRepository.findByProjectId(1L)).thenReturn(new Group());
        // Should throw because group already exists
        assertThrows(ResponseStatusException.class, () -> groupService.createGroup(request));
    }

    @Test
    void testCreateGroup_Success() {
        CreateGroupRequest request = new CreateGroupRequest();
        request.setProjectId(1L);
        request.setGroupName("Test Group");
        request.setMembers(new ArrayList<>());
        Project project = new Project();
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(groupRepository.findByProjectId(1L)).thenReturn(null);
        Group group = new Group();
        when(groupRepository.save(any(Group.class))).thenReturn(group);
        Group result = groupService.createGroup(request);
        assertNotNull(result);
        verify(groupRepository, times(1)).save(any(Group.class));
    }

    @Test
    void testCreateGroup_NullMembers() {
        CreateGroupRequest request = new CreateGroupRequest();
        request.setProjectId(1L);
        // Do not set members (should be null)
        when(projectRepository.findById(1L)).thenReturn(Optional.of(new Project()));
        when(groupRepository.findByProjectId(1L)).thenReturn(null);
        assertThrows(ResponseStatusException.class, () -> groupService.createGroup(request));
    }

    @Test
    void testCreateGroup_InvalidPermission() {
        CreateGroupRequest request = new CreateGroupRequest();
        request.setProjectId(1L);
        request.setGroupName("Test Group");
        ArrayList<com.uml.tool.DTO.GroupMemberRequest> members = new ArrayList<>();
        com.uml.tool.DTO.GroupMemberRequest member = new com.uml.tool.DTO.GroupMemberRequest();
        member.setEmail("user@example.com");
        member.setPermission("INVALID");
        members.add(member);
        request.setMembers(members);
        Project project = new Project();
        UserLoginDetails user = new UserLoginDetails();
        user.setEmail("user@example.com");
        project.setOwner(user); // To avoid owner skip
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(groupRepository.findByProjectId(1L)).thenReturn(null);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        // Should throw due to invalid permission
        assertThrows(ResponseStatusException.class, () -> groupService.createGroup(request));
    }

    @Test
    void testCreateGroup_MemberIsOwner_Skipped() {
        CreateGroupRequest request = new CreateGroupRequest();
        request.setProjectId(1L);
        request.setGroupName("Test Group");
        ArrayList<com.uml.tool.DTO.GroupMemberRequest> members = new ArrayList<>();
        com.uml.tool.DTO.GroupMemberRequest member = new com.uml.tool.DTO.GroupMemberRequest();
        member.setEmail("owner@example.com");
        member.setPermission("EDIT"); // Use valid permission
        members.add(member);
        request.setMembers(members);
        Project project = new Project();
        UserLoginDetails owner = new UserLoginDetails();
        owner.setEmail("owner@example.com");
        project.setOwner(owner);
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(groupRepository.findByProjectId(1L)).thenReturn(null);
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        Group group = new Group();
        when(groupRepository.save(any(Group.class))).thenReturn(group);
        // Should succeed, owner is skipped as member
        Group result = groupService.createGroup(request);
        assertNotNull(result);
        verify(groupRepository, times(1)).save(any(Group.class));
        verify(groupMemberRepository, times(1)).saveAll(any());
    }

    @Test
    void testCreateGroup_MemberNotFound() {
        CreateGroupRequest request = new CreateGroupRequest();
        request.setProjectId(1L);
        request.setGroupName("Test Group");
        ArrayList<com.uml.tool.DTO.GroupMemberRequest> members = new ArrayList<>();
        com.uml.tool.DTO.GroupMemberRequest member = new com.uml.tool.DTO.GroupMemberRequest();
        member.setEmail("missing@example.com");
        member.setPermission("READ");
        members.add(member);
        request.setMembers(members);
        Project project = new Project();
        UserLoginDetails owner = new UserLoginDetails();
        owner.setEmail("owner@example.com");
        project.setOwner(owner);
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(groupRepository.findByProjectId(1L)).thenReturn(null);
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());
        // Should throw because member not found
        assertThrows(ResponseStatusException.class, () -> groupService.createGroup(request));
    }

    @Test
    void testGetGroupByProjectId() {
        Long projectId = 1L;
        Group group = new Group();
        when(groupRepository.findByProjectId(projectId)).thenReturn(group);
        Group result = groupService.getGroupByProjectId(projectId);
        assertEquals(group, result);
        verify(groupRepository, times(1)).findByProjectId(projectId);
    }

    @Test
    void testAddMemberToGroup_GroupNotFound() {
        when(groupRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class,
                () -> groupService.addMemberToGroup(1L, "user@example.com", "EDIT"));
    }

    @Test
    void testAddMemberToGroup_UserNotFound() {
        Group group = new Group();
        group.setMembers(new java.util.ArrayList<>());
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class,
                () -> groupService.addMemberToGroup(1L, "user@example.com", "EDIT"));
    }

    @Test
    void testAddMemberToGroup_InvalidPermission() {
        Group group = new Group();
        group.setMembers(new java.util.ArrayList<>());
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        UserLoginDetails user = new UserLoginDetails();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        assertThrows(ResponseStatusException.class,
                () -> groupService.addMemberToGroup(1L, "user@example.com", "INVALID"));
    }

    @Test
    void testAddMemberToGroup_AlreadyMember() {
        Group group = new Group();
        UserLoginDetails user = new UserLoginDetails();
        user.setEmail("user@example.com");
        GroupMember member = GroupMember.builder().user(user).build();
        java.util.List<GroupMember> members = new java.util.ArrayList<>();
        members.add(member);
        group.setMembers(members);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        assertThrows(ResponseStatusException.class,
                () -> groupService.addMemberToGroup(1L, "user@example.com", "EDIT"));
    }

    @Test
    void testAddMemberToGroup_Success() {
        Group group = new Group();
        group.setMembers(new java.util.ArrayList<>());
        UserLoginDetails user = new UserLoginDetails();
        user.setEmail("user@example.com");
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        //GroupMember.Permission perm = GroupMember.Permission.EDIT;
        //GroupMember member = GroupMember.builder().group(group).user(user).permission(perm).build();
        // No need to mock save, just verify
        GroupMember result = groupService.addMemberToGroup(1L, "user@example.com", "EDIT");
        assertEquals(user, result.getUser());
        verify(groupMemberRepository, times(1)).save(any(GroupMember.class));
        verify(groupRepository, times(1)).save(group);
    }

    @Test
    void testRemoveMemberFromGroup_GroupNotFound() {
        when(groupRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> groupService.removeMemberFromGroup(1L, "user@example.com"));
    }

    @Test
    void testRemoveMemberFromGroup_MemberNotFound() {
        Group group = new Group();
        group.setMembers(new java.util.ArrayList<>());
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        assertThrows(ResponseStatusException.class, () -> groupService.removeMemberFromGroup(1L, "user@example.com"));
    }

    @Test
    void testRemoveMemberFromGroup_Success() {
        Group group = new Group();
        UserLoginDetails user = new UserLoginDetails();
        user.setEmail("user@example.com");
        GroupMember member = GroupMember.builder().user(user).build();
        java.util.List<GroupMember> members = new java.util.ArrayList<>();
        members.add(member);
        group.setMembers(members);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        groupService.removeMemberFromGroup(1L, "user@example.com");
        assertFalse(group.getMembers().contains(member));
        verify(groupMemberRepository, times(1)).delete(member);
        verify(groupRepository, times(1)).save(group);
    }

    @Test
    void testCreateGroup_MemberIsNotOwner_Added() {
        CreateGroupRequest request = new CreateGroupRequest();
        request.setProjectId(1L);
        request.setGroupName("Test Group");
        ArrayList<com.uml.tool.DTO.GroupMemberRequest> members = new ArrayList<>();
        com.uml.tool.DTO.GroupMemberRequest member = new com.uml.tool.DTO.GroupMemberRequest();
        member.setEmail("user@example.com");
        member.setPermission("EDIT");
        members.add(member);
        request.setMembers(members);
        Project project = new Project();
        UserLoginDetails owner = new UserLoginDetails();
        owner.setEmail("owner@example.com");
        project.setOwner(owner);
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(groupRepository.findByProjectId(1L)).thenReturn(null);
        UserLoginDetails user = new UserLoginDetails();
        user.setEmail("user@example.com");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        Group group = new Group();
        when(groupRepository.save(any(Group.class))).thenReturn(group);
        Group result = groupService.createGroup(request);
        assertNotNull(result);
        verify(groupRepository, times(1)).save(any(Group.class));
        verify(groupMemberRepository, times(1)).saveAll(any());
    }
}
