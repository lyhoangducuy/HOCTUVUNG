package com.dev.hoctuvung.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BoTheCuaLop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idBoTheCuaLop;

    @ManyToOne
    @JoinColumn(name = "idBoThe")
    private BoThe boThe;

    @ManyToOne
    @JoinColumn(name = "idLopHoc")
    private LopHoc lopHoc;
}