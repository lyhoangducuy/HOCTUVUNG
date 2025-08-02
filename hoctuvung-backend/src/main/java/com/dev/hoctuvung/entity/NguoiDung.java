package com.dev.hoctuvung.entity;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NguoiDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idNguoiDung;

    private String email;
    private String tenNguoiDung;
    private String hoten;
    private String matkhau;
    private String anhDaiDien;

    @Enumerated(EnumType.STRING)
    private VaiTro vaiTro;

    private LocalDateTime ngayTaoTaiKhoan;

    @OneToMany(mappedBy = "nguoiDung")
    private List<TienDoHoc> tienDoHocs;

    @OneToMany(mappedBy = "nguoiDung")
    private List<BoThe> boTheList;

    @OneToMany(mappedBy = "nguoiDung")
    private List<Feedback> feedbacks;

    @OneToMany(mappedBy = "nguoiDung")
    private List<GoiTraPhiCuaNguoiDung> goiTraPhis;

    @OneToMany(mappedBy = "nguoiDung")
    private List<LopHoc> lopHocs;
}