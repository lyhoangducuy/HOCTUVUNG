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
    const dataLocal = JSON.parse(localStorage.getItem("class")) || [];
    const list = Array.isArray(dataLocal) ? dataLocal : [dataLocal];

    const idLop = Math.floor(Math.random() * 1000000);

    // Nếu có thông tin đăng nhập, lấy idNguoiDung từ localStorage
    const currentUser = JSON.parse(localStorage.getItem("nguoiDung")) || {};
    const idNguoiDung = currentUser.id || Math.floor(Math.random() * 1000000);

    const newClass = {
      idLop,
      idNguoiDung,
      ...data,
      boTheIds: [],   // danh sách ID bộ thẻ
      folderIds: []   // danh sách ID folder
    };

    list.push(newClass);
    localStorage.setItem("class", JSON.stringify(list));
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
      <input {...register("country", { required: "vui long nhap quoc gia" })} />
      {errors.country && (
        <p style={{ color: "red" }}>{errors.country.message}</p>
      )}

      <label>Thành Phố</label>
      <input {...register("city", { required: "vui long nhap thanh pho " })} />
      {errors.city && <p style={{ color: "red" }}>{errors.city.message}</p>}

      <label>Tên Trường Học</label>
      <input {...register("school", { required: "vui long nhap truong" })} />
      {errors.school && <p style={{ color: "red" }}>{errors.school.message}</p>}

      <label>Mô tả</label>
      <input {...register("description")} />

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
