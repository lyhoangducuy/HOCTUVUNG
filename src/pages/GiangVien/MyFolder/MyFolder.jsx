import { useNavigate, useParams } from "react-router-dom";
import "./Myfolder.css";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faBookOpen } from "@fortawesome/free-solid-svg-icons";

function MyFolder() {
  const { id } = useParams();
  const [folder, setFolder] = useState([]);
  const [add, setAdd] = useState(false);
  const navigate = useNavigate();
  const emptyBoThe = {
    idThuMuc: null,
    idBoThe: null,
    tenBoThe: "",
    soTu: 0,
    danhSachThe: [],
  };
  const [newBoThe, setNewBoThe] = useState(emptyBoThe);

  useEffect(() => {
    const current = JSON.parse(localStorage.getItem("currentFolder"));
    if (current) {
      setFolder(current);
    }
  }, [id]);

  const getId = () => {
    return (folder?.boThe?.length || 0) + 1;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    try {
      const folderId = parseInt(id);
      const idthe = getId();

      const updatedBoThe = {
        ...newBoThe,
        idThuMuc: folderId,
        idBoThe: idthe,
        soTu: newBoThe.danhSachThe.length,
      };

      const updatedFolder = {
        ...folder,
        idThuMuc: folderId,
        boThe: folder.boThe ? [...folder.boThe, updatedBoThe] : [updatedBoThe],
      };

      const allFolders = JSON.parse(localStorage.getItem("folders")) || [];
      const folderIndex = allFolders.findIndex((f) => f.idThuMuc === folderId);

      if (folderIndex !== -1) {
        allFolders[folderIndex] = updatedFolder;
      } else {
        allFolders.push(updatedFolder);
      }
      localStorage.setItem("folders", JSON.stringify(allFolders));
      localStorage.setItem("currentFolder", JSON.stringify(updatedFolder));
      setFolder(updatedFolder);
      setAdd(false);
      setNewBoThe(emptyBoThe);
    } catch (error) {
      console.error("Lỗi khi thêm bộ thẻ:", error);
    }
  };

  const handleStudy = (index) => {
    const selectedBoThe = folder.boThe[index];
    const boThe = {
      idBoThe: selectedBoThe.idBoThe,
      tenBoThe: selectedBoThe.tenBoThe,
      soTu: selectedBoThe.soTu,
      danhSachThe: selectedBoThe.danhSachThe,
      video: { src: "/assets/video.mp4", answer: ["こんにちは", "さようなら"] },
    };
    localStorage.setItem("selected", JSON.stringify(boThe));
    navigate(`/flashcard/${id}`);
  };
  return (
    <div className="folder-container">
      {
        <ul className="CardFolder">
          {folder?.boThe?.map((item, index) => (
            <li
              className="Card-item"
              key={index}
              onClick={() => handleStudy(index)}
            >
              {
                <>
                  <span className="nameCard">{item.tenBoThe}</span>
                  <span className="quantity">{item.soTu}</span>
                </>
              }
            </li>
          ))}
        </ul>
      }

      {
        <div className="addCard-container">
          <div className="icon-group">
            <FontAwesomeIcon icon={faBook} />
            <FontAwesomeIcon icon={faBookOpen} />
            <FontAwesomeIcon icon={faBook} />
          </div>
          <div className="paragram">
            <p>Let’s start building your folder</p>
          </div>

          <button className="btn-add" onClick={() => setAdd(true)}>
            Thêm Bộ Thẻ
          </button>
        </div>
      }

      {add && (
        <div className="overlay">
          <div className="create-card-form">
            <h2>Tạo bộ thẻ mới</h2>
            <form className="form-bo-the" onSubmit={handleSubmit}>
              <input
                required
                type="text"
                placeholder="Tên bộ thẻ"
                value={newBoThe.tenBoThe}
                onChange={(e) =>
                  setNewBoThe({ ...newBoThe, tenBoThe: e.target.value })
                }
              />

              <button
                type="button"
                onClick={() =>
                  setNewBoThe({
                    ...newBoThe,
                    danhSachThe: [
                      ...newBoThe.danhSachThe,
                      { tu: "", nghia: "" },
                    ],
                  })
                }
              >
                Thêm từ
              </button>

              {newBoThe.danhSachThe.map((item, index) => (
                <div key={index} className="card-input">
                  <input
                    required
                    type="text"
                    placeholder="Từ"
                    value={item.tu}
                    onChange={(e) => {
                      const updated = [...newBoThe.danhSachThe];
                      updated[index].tu = e.target.value;
                      setNewBoThe({ ...newBoThe, danhSachThe: updated });
                    }}
                  />
                  <input
                    required
                    type="text"
                    placeholder="Nghĩa"
                    value={item.nghia}
                    onChange={(e) => {
                      const updated = [...newBoThe.danhSachThe];
                      updated[index].nghia = e.target.value;
                      setNewBoThe({ ...newBoThe, danhSachThe: updated });
                    }}
                  />
                </div>
              ))}
              <div className="btn-group">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAdd(false)}
                >
                  Đóng
                </button>
                <button className="btn-primary" type="submit">
                  Lưu bộ thẻ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyFolder;
