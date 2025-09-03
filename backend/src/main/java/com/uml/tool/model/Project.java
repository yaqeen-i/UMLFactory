package com.uml.tool.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.time.LocalDateTime;
//import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private UserLoginDetails owner;

    private String name;
    // private String diagramType; // <-- Remove this line

    @Column(columnDefinition = "TEXT")
    private String diagramJson;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "project", cascade = CascadeType.ALL)
    @JsonManagedReference
    @ToString.Exclude
    private Group group;
}
