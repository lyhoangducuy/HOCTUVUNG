package com.dev.hoctuvung.dto;

import com.dev.hoctuvung.entity.VaiTro;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DangKyDTO {
    private String email;
    private String tenNguoiDung;
    private String matkhau;
    private VaiTro vaiTro; // Enum: GIANG_VIEN, HOC_VIEN, ADMIN (ví dụ)
}