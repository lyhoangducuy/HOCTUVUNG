package com.dev.hoctuvung.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TuVung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idTuVung;

    private String matTruoc;
    private String matSau;
    private String viDuSuDung;
    private String hinhAnh;
    private String amThanh;
}