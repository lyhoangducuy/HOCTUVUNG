import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import "./Newclass.css";

function Newclass() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    const dataLocal = JSON.parse(localStorage.getItem("lop")) || [];
    const list = Array.isArray(dataLocal) ? dataLocal : [dataLocal];

    const idLop = Math.floor(Math.random() * 1000000);

    const session= JSON.parse( sessionStorage.getItem("session"));
    const idNguoiDung = session.idNguoiDung;

    const newClass = {
      idLop,
      idNguoiDung,
      ...data,
      boTheIds: [],   // danh sách ID bộ thẻ
      folderIds: [],
      thanhVienIds:[]   // danh sách ID folder
    };

    list.push(newClass);
    localStorage.setItem("lop", JSON.stringify(list));
    navigate("/lop/" + idLop);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2 className="tittle">Nhập thông tin lớp học</h2>

      <label>Tên lớp học</label>
      <input
        {...register("tenLop", { required: "vui long nhap ten lop" })}
      />
      {errors.tenLop && (
        <p style={{ color: "red" }}>{errors.tenLop.message}</p>
      )}

      <label>Quốc Gia</label>
      <input {...register("tenQuocGia", { required: "vui long nhap quoc gia" })} />
      {errors.tenQuocGia && (
        <p style={{ color: "red" }}>{errors.tenQuocGia.message}</p>
      )}

      <label>Thành Phố</label>
      <input {...register("tenThanhPho", { required: "vui long nhap thanh pho " })} />
      {errors.tenThanhPho && <p style={{ color: "red" }}>{errors.tenThanhPho.message}</p>}

      <label>Tên Trường Học</label>
      <input {...register("tenTruong", { required: "vui long nhap truong" })} />
      {errors.tenTruong && <p style={{ color: "red" }}>{errors.tenTruong.message}</p>}

      <label>Mô tả</label>
      <input {...register("moTa")} />

      <div className="button-group">
        <button
          type="button"
          className="btn-close"
          onClick={() => navigate("/giangvien")}
        >
          Đóng
        </button>
        <button className="btn-submit" type="submit">
          Xác Nhận
        </button>
      </div>
    </form>
  );
}

export default Newclass;
