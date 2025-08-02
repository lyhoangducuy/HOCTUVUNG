package com.dev.hoctuvung.service;

import com.dev.hoctuvung.entity.NguoiDung;
import com.dev.hoctuvung.repository.nguoiDungRepository;
import org.springframework.stereotype.Service;

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
}