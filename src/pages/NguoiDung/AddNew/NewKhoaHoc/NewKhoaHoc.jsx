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

  // tách danh sách "kienThuc" từ input (phân tách bởi dấu phẩy hoặc xuống dòng)
  const parseTags = (txt) =>
    (txt || "")
      .split(/[\n,]+/g)
      .map((s) => s.trim())
      .filter(Boolean);

  const onSubmit = (data) => {
    const list = JSON.parse(localStorage.getItem("khoaHoc") || "[]");

    const idKhoaHoc = Date.now(); // id đơn giản, duy nhất theo thời gian
    const session = JSON.parse(sessionStorage.getItem("session") || "null");
    const idNguoiDung = session?.idNguoiDung || null;

    const newCourse = {
      idKhoaHoc,
      idNguoiDung: idNguoiDung,
      tenKhoaHoc: data.tenKhoaHoc,
      moTa: data.moTa || "",
      kienThuc: parseTags(data.kienThuc),
      boTheIds: [],
      folderIds: [],
      thanhVienIds: [],
    };

    list.push(newCourse);
    localStorage.setItem("khoaHoc", JSON.stringify(list));

    // vẫn dùng route /lop/:id đang có sẵn trong app để hiển thị chi tiết
    navigate("/lop/" + idKhoaHoc);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2 className="tittle">Nhập thông tin khóa học</h2>

      <label>Tên khóa học</label>
      <input
        {...register("tenKhoaHoc", { required: "Vui lòng nhập tên khóa học" })}
      />
      {errors.tenKhoaHoc && (
        <p style={{ color: "red" }}>{errors.tenKhoaHoc.message}</p>
      )}

      <label>Kỹ năng/Chủ đề (kiến thức)</label>
      <textarea
        rows={3}
        placeholder="Ví dụ: it, tiếng nhật, tiếng anh..."
        {...register("kienThuc")}
      />

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
