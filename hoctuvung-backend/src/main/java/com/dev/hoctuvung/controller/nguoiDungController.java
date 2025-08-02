package com.dev.hoctuvung.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dev.hoctuvung.entity.NguoiDung;
import com.dev.hoctuvung.service.nguoiDungService;

@RestController
@RequestMapping("/api/nguoidung")
@CrossOrigin(origins = "*")
public class nguoiDungController {

    private final nguoiDungService nguoiDungService;

    public nguoiDungController(nguoiDungService nguoiDungService) {
        this.nguoiDungService = nguoiDungService;
    }

    @PostMapping("/dangnhap")
    public Optional<NguoiDung> dangNhap(@RequestBody NguoiDung nguoiDung) {
        return nguoiDungService.dangNhap(nguoiDung.getEmail(), nguoiDung.getMatkhau());
    }
}
