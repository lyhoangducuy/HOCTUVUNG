package com.dev.hoctuvung.controller.GiangVien;

import com.dev.hoctuvung.entity.BoThe;
import com.dev.hoctuvung.service.GiangVien.BoTheService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/giangvien/trangchu")
public class TrangChuGiangVienController {

    @Autowired
    private BoTheService boTheService;

    // Lấy các bộ thẻ gần đây của giảng viên (theo id giảng viên)
    @GetMapping("/gan-day/{giangVienId}")
    public List<BoThe> getBoTheGanDay(@PathVariable Long giangVienId) {
        return boTheService.findRecentByGiangVienId(giangVienId);
    }

    // Lấy các bộ thẻ phổ biến nhất
    @GetMapping("/bo-the-pho-bien")
    public List<BoThe> getBoThePhoBien() {
        return boTheService.findPopularBoThe();
    }
}
