package com.dev.hoctuvung.service;

import com.dev.hoctuvung.dto.DangKyDTO;
import com.dev.hoctuvung.entity.NguoiDung;
import com.dev.hoctuvung.repository.nguoiDungRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class nguoiDungService {

    private final nguoiDungRepository nguoiDungRepository;

    public nguoiDungService(nguoiDungRepository nguoiDungRepository) {
        this.nguoiDungRepository = nguoiDungRepository;
    }

    public Optional<NguoiDung> dangNhap(String email, String matkhau) {
        return nguoiDungRepository.findByEmailAndMatkhau(email, matkhau);
    }
    public NguoiDung dangKy(DangKyDTO dangKyDTO) {
    // Kiểm tra email đã tồn tại
        if (nguoiDungRepository.findByEmail(dangKyDTO.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã tồn tại");
        }
        // Kiểm tra tên người dùng đã tồn tại
        if (nguoiDungRepository.findByTenNguoiDung(dangKyDTO.getTenNguoiDung()).isPresent()) {
            throw new RuntimeException("Tên người dùng đã tồn tại");
        }
        NguoiDung nguoiDung = new NguoiDung();
        nguoiDung.setEmail(dangKyDTO.getEmail());
        nguoiDung.setTenNguoiDung(dangKyDTO.getTenNguoiDung());
        nguoiDung.setMatkhau(dangKyDTO.getMatkhau());
        nguoiDung.setVaiTro(dangKyDTO.getVaiTro());
        nguoiDung.setNgayTaoTaiKhoan(java.time.LocalDateTime.now());
        return nguoiDungRepository.save(nguoiDung);
    }

}