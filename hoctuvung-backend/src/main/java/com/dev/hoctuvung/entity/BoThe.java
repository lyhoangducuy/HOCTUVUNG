package com.dev.hoctuvung.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BoThe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idBoThe;

    private String tenBoThe;
    private String moTa;
    private String nguoiTao;
    private String cheDoHienThi;
    private boolean flashcard;
    private boolean matchgame;
    private boolean tracNghiem;
    private boolean baiKiemTra;

    @ManyToOne
    @JoinColumn(name = "idNguoiDung")
    private NguoiDung nguoiDung;

    @OneToMany(mappedBy = "boThe")
    private List<TuVungCuaBoThe> tuVungCuaBoThes;

    @OneToMany(mappedBy = "boThe")
    private List<BoTheCuaLop> boTheCuaLops;

    @OneToMany(mappedBy = "boThe")
    private List<TienDoHoc> tienDoHocs;
}