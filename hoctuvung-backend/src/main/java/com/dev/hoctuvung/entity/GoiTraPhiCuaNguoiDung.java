package com.dev.hoctuvung.entity;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoiTraPhiCuaNguoiDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idGTPCND;

    private LocalDate ngayBatDau;
    private LocalDate ngayKetThuc;

    @ManyToOne
    @JoinColumn(name = "idNguoiDung")
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "idGoi")
    private GoiTraPhi goiTraPhi;
}