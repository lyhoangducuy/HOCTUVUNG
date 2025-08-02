package com.dev.hoctuvung.entity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LopHoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idLopHoc;

    private String tenLop;
    private String moTa;
    private String quocGia;
    private String thanhPho;
    private String tenTruong;
    private LocalDate ngayTao;

    @ManyToOne
    @JoinColumn(name = "idNguoiDung")
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "idBoThe")
    private BoThe boThe;

    @OneToMany(mappedBy = "lopHoc")
    private List<BoTheCuaLop> boTheCuaLops;

    @OneToMany(mappedBy = "lopHoc")
    private List<Feedback> feedbacks;
}