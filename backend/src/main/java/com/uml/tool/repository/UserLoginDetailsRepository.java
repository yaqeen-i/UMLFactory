package com.uml.tool.repository;

//import com.uml.tool.DTO.UserLoginDTO;
import com.uml.tool.model.UserLoginDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// NOTE: The primary key (ID) for UserLoginDetails is now email, not username.
public interface UserLoginDetailsRepository extends JpaRepository<UserLoginDetails, String> {
    Optional<UserLoginDetails> findByEmail(String email);

    Optional<UserLoginDetails> findByUsername(String username);

    void deleteByEmail(String email);

    List<UserLoginDetails> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(String username, String email);

    List<UserLoginDetails> findByIsDeletedFalse();
}
