import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faClock, faFileAlt } from "@fortawesome/free-solid-svg-icons";

export default function VideoDetail({ video, onClose }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Chi Tiết Video</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Video Preview */}
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <div className="text-gray-500 text-lg mb-2">🎬</div>
            <p className="text-gray-600 text-sm">
              {video.video?.src || "Không có đường dẫn video"}
            </p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông Tin Cơ Bản</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên Bộ Thẻ
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {video.tenBoThe}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô Tả
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {video.moTa}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày Tạo
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {video.createdAt?.toDate ? 
                      video.createdAt.toDate().toLocaleDateString('vi-VN') : 
                      'N/A'
                    }
                  </p>
                </div>

                {video.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày Cập Nhật
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {video.updatedAt?.toDate ? 
                        video.updatedAt.toDate().toLocaleDateString('vi-VN') : 
                        'N/A'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống Kê</h3>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FontAwesomeIcon icon={faFileAlt} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Tổng Số Câu</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {video.video?.transcript?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <FontAwesomeIcon icon={faClock} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-900">Thời Gian Tổng</p>
                      <p className="text-2xl font-bold text-green-600">
                        {video.video?.transcript?.length > 0 
                          ? formatTime(Math.max(...video.video.transcript.map(t => t.t)))
                          : '0:00'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transcript */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transcript</h3>
            
            {video.video?.transcript && video.video.transcript.length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  {video.video.transcript.map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex-shrink-0">
                        <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          {formatTime(item.t)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900">{item.answers}</p>
                      </div>
                      <div className="flex-shrink-0 text-xs text-gray-500">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="text-gray-400 text-4xl mb-2">📝</div>
                <p className="text-gray-500">Chưa có transcript nào</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
