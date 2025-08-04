package com.dev.hoctuvung.repository;

import com.dev.hoctuvung.entity.BoThe;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BoTheRepository extends JpaRepository<BoThe, Long> {
    List<BoThe> findTop6ByNguoiDung_IdNguoiDungOrderByNgayTaoDesc(Long giangVienId);
    List<BoThe> findTop6ByOrderByLuotHocDesc();
}