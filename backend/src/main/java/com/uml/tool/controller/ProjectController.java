package com.uml.tool.controller;

import com.uml.tool.DTO.ProjectCreateDTO;
import com.uml.tool.DTO.ProjectDTO;
import com.uml.tool.model.Project;
//import com.uml.tool.model.UserLoginDetails;
import com.uml.tool.service.ProjectService;
//import com.uml.tool.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5000" }, allowCredentials = "true")
public class ProjectController {
    @Autowired
    private ProjectService projectService;
//    @Autowired
    //private UserService userService;

    @PostMapping("/create")
    public ResponseEntity<?> createProject(@Valid @RequestBody ProjectCreateDTO dto) {
        try {
            Project project = projectService.createProject(dto.getName(), dto.getOwnerEmail());
            return ResponseEntity.ok(project);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Failed to create project: " + ex.getMessage());
        }
    }

    @GetMapping("/own")
    public List<ProjectDTO> getOwnProjects(@RequestParam String email) {
        return projectService.getOwnProjectsByEmail(email)
                .stream()
                .map(ProjectDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/shared")
    public List<ProjectDTO> getSharedProjects(@RequestParam String email) {
        return projectService.getSharedProjects(email)
                .stream()
                .map(ProjectDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @PutMapping("/updateDiagram")
    public Project updateDiagram(@RequestParam Long projectId, @RequestBody String diagramJson) {
        return projectService.updateDiagram(projectId, diagramJson);
    }

    @GetMapping("/{id:\\d+}")
    public ProjectDTO getProjectById(@PathVariable Long id) {
        Project project = projectService.getProjectById(id);
        return ProjectDTO.fromEntity(project);
    }

    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        try {
            projectService.deleteProject(id);
            return ResponseEntity.ok().build();
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Failed to delete project: " + ex.getMessage());
        }
    }

    @PutMapping("/updateName")
    public ResponseEntity<?> updateProjectName(@RequestParam Long projectId,
            @RequestBody(required = false) String newName) {
        try {
            // Remove surrounding quotes if present
            if (newName != null && newName.length() > 1 && newName.startsWith("\"") && newName.endsWith("\"")) {
                newName = newName.substring(1, newName.length() - 1);
            }
            projectService.updateProjectName(projectId, newName);
            return ResponseEntity.ok().build();
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Failed to update project name: " + ex.getMessage());
        }
    }
}
