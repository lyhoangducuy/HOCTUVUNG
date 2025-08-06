package com.dev.hoctuvung.repository;

import com.dev.hoctuvung.entity.NguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface nguoiDungRepository extends JpaRepository<NguoiDung, Long> {
    Optional<NguoiDung> findByEmailAndMatkhau(String email, String matkhau);
    Optional<NguoiDung> findByEmail(String email);
    Optional<NguoiDung> findByTenNguoiDung(String tenNguoiDung);
}
