package com.dev.hoctuvung.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TuVungCuaBoThe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idTuVungCuaBoThe;

    @ManyToOne
    @JoinColumn(name = "idBoThe")
    private BoThe boThe;

    @ManyToOne
    @JoinColumn(name = "idTuVung")
    private TuVung tuVung;
}