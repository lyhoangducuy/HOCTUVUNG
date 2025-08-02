package com.dev.hoctuvung.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoiTraPhi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idGoi;

    private String tenGoi;
    private double giaGoi;
    private int thoiHan;
    private String tinhNang;
    private boolean conHoatDong;
}