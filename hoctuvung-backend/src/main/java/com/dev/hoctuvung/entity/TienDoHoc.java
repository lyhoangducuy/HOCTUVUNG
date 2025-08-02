package com.dev.hoctuvung.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TienDoHoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idTienDoHoc;

    private int soTuDaHoc;
    private boolean tyLeHoanThanh;
    private LocalDate ngayHocGanDay;

    @ManyToOne
    @JoinColumn(name = "idNguoiDung")
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "idBoThe")
    private BoThe boThe;
}