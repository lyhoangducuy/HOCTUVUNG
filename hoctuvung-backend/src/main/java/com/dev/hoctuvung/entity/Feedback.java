package com.dev.hoctuvung.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idFeedBack;

    private String noiDung;
    private LocalDateTime thoiGianGui;
    private String trangThai;

    @ManyToOne
    @JoinColumn(name = "idNguoiDung")
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "idLopHoc")
    private LopHoc lopHoc;
}