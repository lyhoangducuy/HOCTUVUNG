import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./TrangTimKiem.css";
import { useNavigate } from "react-router-dom";


const listBoThe = JSON.parse(localStorage.getItem("boThe") || "[]");
const listUser = JSON.parse(localStorage.getItem("nguoiDung") || "[]");
const listLop = JSON.parse(localStorage.getItem("lop") || "[]");

function ItemBoThe(props) {
    const navigate = useNavigate();
    const denHoc = (id) => navigate(`/flashcard/${id}`);
    const nguoiTao = listUser.find((u) => String(u.idNguoiDung) === String(props.idNguoiDung));
    const tenNguoiTao = nguoiTao?.tenNguoiDung || "Ẩn danh";
    const anhNguoiTao = nguoiTao?.anhDaiDien || "";
    return (
        <div className="item-Search" onClick={() => denHoc(props.idBoThe)} key={props.idBoThe}>
            <h1>{props.tenBoThe}</h1>
            <p>{props.soTu}</p>
            <div className="user-item">
                <div
                    className="mini-avatar"
                    style={anhNguoiTao ? { backgroundImage: `url(${anhNguoiTao})` } : {}}
                />
                <span>{tenNguoiTao}</span>
            </div>
            <button className="btn-hoc" onClick={() => denHoc(props.idBoThe)}>Học</button>
        </div>
    );
}
function ItemUser(props) {
    return (
        <div className="item-Search" key={props.idNguoiDung}>
            <div className="user-item">
                <div
                    className="mini-avatar"
                    style={props.anhDaiDien ? { backgroundImage: `url(${props.anhDaiDien})` } : {}}
                />
                <span>{props.tenNguoiDung}</span>
            </div>
        </div>
    );
}



function ItemLop(props) {
    const nguoiTao = listUser.find((u) => String(u.idNguoiDung) === String(item.idNguoiDung));
    const tenNguoiTao = nguoiTao?.tenNguoiDung || "Ẩn danh";
    const anhNguoiTao = nguoiTao?.anhDaiDien || "";
    return (
        <div className="item-Search" key={props.idLop}>
            <h1>{props.tenLop}</h1>
            <div className="user-item">
                <div
                    className="mini-avatar"
                    style={anhNguoiTao ? { backgroundImage: `url(${anhNguoiTao})` } : {}}
                />
                <span>{tenNguoiTao}</span>
            </div>
        </div>
    );
}

export default function TrangTimKiem() {

    const { id } = useParams();
    const [typeSearch, settypeSearch] = useState("All");
    let listBoTheTimKiem = listBoThe.filter((x) => x.tenBoThe?.toLowerCase().includes(id.toLowerCase()));
    let listUserTimKiem = listUser.filter((x) => x.tenNguoiDung?.toLowerCase().includes(id.toLowerCase()));
    let listLopTimKiem = listLop.filter((x) => x.tenLop?.toLowerCase().includes(id.toLowerCase()));
    useEffect(() => {
        listBoTheTimKiem = listBoThe.filter((x) => x.tenBoThe?.toLowerCase().includes(id.toLowerCase()));
        listUserTimKiem = listUser.filter((x) => x.tenNguoiDung?.toLowerCase().includes(id.toLowerCase()));
        listLopTimKiem = listLop.filter((x) => x.tenLop?.toLowerCase().includes(id.toLowerCase()));

    }, [id,typeSearch]);

    return (
        <div className="search-container">
            <div className="type-search">
                <ul>
                    <li className={typeSearch === "All" ? "active" : ""}  onClick={() => settypeSearch("All")}>All</li>
                    <li className={typeSearch === "BoThe" ? "active" : ""}  onClick={() => settypeSearch("BoThe")}>Bộ thẻ</li>
                    <li className={typeSearch === "User" ? "active" : ""}  onClick={() => settypeSearch("User")}>Người dùng</li>
                    <li className={typeSearch === "Lop" ? "active" : ""}  onClick={() => settypeSearch("Lop")}>Lớp</li>
                </ul>
            </div>
            <div className="list-Search">
                {
                    typeSearch === "All" ? (
                        <>
                            <h3 className="list-Search-title">Bộ thẻ</h3>
                            {listBoTheTimKiem.length > 0 ? listBoTheTimKiem.map((item) => <ItemBoThe key={item.idBoThe} {...item} />) : "Không tìm thấy bộ thẻ nào"}
                            <h3 className="list-Search-title">Người dùng</h3>
                            {listUserTimKiem.length > 0 ? listUserTimKiem.map((item) =><ItemUser key={`user-${item.idNguoiDung}`} {...item} />) : "Không tìm thấy người dùng nào"}
                            <h3 className="list-Search-title">Lớp</h3>
                            {listLopTimKiem.length > 0 ? listLopTimKiem.map((item) => <ItemLop key={`lop-${item.idLop}`} {...item} />) : "Không tìm thấy lớp nào"}
                        </>
                    ) : ""
                }

                {typeSearch === "BoThe" ? (listBoTheTimKiem.length > 0 ? listBoTheTimKiem.map((item) => <ItemBoThe key={item.idBoThe} {...item} />) : "Không tìm thấy bộ thẻ nào") : ""}
                {typeSearch === "User" ? (listUserTimKiem.length > 0 ? listUserTimKiem.map((item) => <ItemUser key={`user-${item.idNguoiDung}`} {...item} />) : "Không tìm thấy người dùng nào") : ""}
                {typeSearch === "Lop" ? (listLopTimKiem.length > 0 ? listLopTimKiem.map((item) => <ItemLop key={`lop-${item.idLop}`} {...item} />) : "Không tìm thấy lớp nào") : ""}
            </div>
        </div>
    );
}