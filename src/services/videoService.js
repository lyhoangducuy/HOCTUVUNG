import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query,
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../../lib/firebase";

const COLLECTION_NAME = "videos";

// Lấy danh sách tất cả video
export const getAllVideos = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const videos = [];
    querySnapshot.forEach((doc) => {
      videos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return videos;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách video:", error);
    throw error;
  }
};

// Lấy video theo ID
export const getVideoById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error("Video không tồn tại");
    }
  } catch (error) {
    console.error("Lỗi khi lấy video:", error);
    throw error;
  }
};

// Thêm video mới
export const addVideo = async (videoData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...videoData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Lỗi khi thêm video:", error);
    throw error;
  }
};

// Cập nhật video
export const updateVideo = async (id, videoData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...videoData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Lỗi khi cập nhật video:", error);
    throw error;
  }
};

// Xóa video
export const deleteVideo = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Lỗi khi xóa video:", error);
    throw error;
  }
};
