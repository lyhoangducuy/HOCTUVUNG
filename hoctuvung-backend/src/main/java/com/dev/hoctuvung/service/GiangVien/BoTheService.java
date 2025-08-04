package com.dev.hoctuvung.service.GiangVien;

import com.dev.hoctuvung.entity.BoThe;
import com.dev.hoctuvung.repository.BoTheRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BoTheService {
    @Autowired
    private BoTheRepository boTheRepository;

    // Lấy 6 bộ thẻ gần đây nhất của giảng viên
    public List<BoThe> findRecentByGiangVienId(Long giangVienId) {
        return boTheRepository.findTop6ByNguoiDung_IdNguoiDungOrderByNgayTaoDesc(giangVienId);
    }

    // Lấy 6 bộ thẻ phổ biến nhất (ví dụ: nhiều người học nhất)
    public List<BoThe> findPopularBoThe() {
        return boTheRepository.findTop6ByOrderByLuotHocDesc();
    }
}