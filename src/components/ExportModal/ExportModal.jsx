import React, { useState, useEffect } from 'react';
import './ExportModal.css';

const ExportModal = ({ 
  isOpen, 
  onClose, 
  onExport, 
  filteredData = [], 
  title = "Xuất dữ liệu",
  columns = [] // Mảng các cột có thể xuất
}) => {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedColumns, setSelectedColumns] = useState({});
  const [isExporting, setIsExporting] = useState(false);

  // Tự động tạo selectedColumns từ columns prop
  useEffect(() => {
    const initialColumns = {};
    columns.forEach(col => {
      initialColumns[col.key] = true;
    });
    setSelectedColumns(initialColumns);
  }, [columns]);

  const handleFormatChange = (format) => {
    setSelectedFormat(format);
  };

  const handleColumnToggle = (column) => {
    setSelectedColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  // Hàm xuất CSV
  const exportToCSV = (data, columns, columnConfig) => {
    const headers = [];
    const selectedKeys = [];
    
    columnConfig.forEach(col => {
      if (columns[col.key]) {
        headers.push(col.name);
        selectedKeys.push(col.key);
      }
    });

    const csvContent = [
      headers.join(','),
      ...data.map(item => {
        const row = [];
        selectedKeys.forEach(key => {
          const value = item[key];
          // Xử lý giá trị có dấu phẩy hoặc xuống dòng
          if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
            row.push(`"${value}"`);
          } else {
            row.push(value || '');
          }
        });
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Hàm xuất JSON
  const exportToJSON = (data, columns, columnConfig) => {
    const filteredData = data.map(item => {
      const filteredItem = {};
      columnConfig.forEach(col => {
        if (columns[col.key]) {
          filteredItem[col.key] = item[col.key];
        }
      });
      return filteredItem;
    });

    const jsonContent = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Hàm xuất TXT
  const exportToTXT = (data, columns, columnConfig) => {
    const headers = [];
    const selectedKeys = [];
    
    columnConfig.forEach(col => {
      if (columns[col.key]) {
        headers.push(col.name);
        selectedKeys.push(col.key);
      }
    });

    const txtContent = [
      'DANH SÁCH DỮ LIỆU',
      '='.repeat(50),
      '',
      headers.join('\t'),
      ...data.map(item => {
        const row = [];
        selectedKeys.forEach(key => {
          row.push(item[key] || '');
        });
        return row.join('\t');
      })
    ].join('\n');

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export_${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    if (filteredData.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    if (columns.length === 0) {
      alert('Chưa cấu hình cột để xuất!');
      return;
    }

    setIsExporting(true);
    
    try {
      switch (selectedFormat) {
        case 'csv':
          exportToCSV(filteredData, selectedColumns, columns);
          break;
        case 'json':
          exportToJSON(filteredData, selectedColumns, columns);
          break;
        case 'txt':
          exportToTXT(filteredData, selectedColumns, columns);
          break;
        default:
          throw new Error('Định dạng không được hỗ trợ');
      }

      // Gọi callback nếu có
      if (onExport) {
        onExport({
          format: selectedFormat,
          columns: selectedColumns,
          data: filteredData
        });
      }

      alert(`Đã xuất dữ liệu thành công với định dạng ${selectedFormat.toUpperCase()}`);
      onClose();
    } catch (error) {
      console.error('Lỗi khi xuất dữ liệu:', error);
      alert('Có lỗi xảy ra khi xuất dữ liệu. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="export-modal-overlay">
      <div className="export-modal">
        <div className="export-modal-header">
          <h3 className="export-modal-title">{title}</h3>
          <button className="export-modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="export-modal-content">
          {/* Thông tin dữ liệu */}
          <div className="export-info">
            <p>Tổng số bản ghi: <strong>{filteredData.length}</strong></p>
          </div>

          {/* Chọn định dạng file */}
          <div className="export-section">
            <div className="section-header">
              <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="section-title">Chọn định dạng file</span>
            </div>
            <div className="format-options">
              <label className="format-option">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={selectedFormat === 'csv'}
                  onChange={() => handleFormatChange('csv')}
                />
                <span className="radio-custom"></span>
                <span>CSV</span>
              </label>
              <label className="format-option">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={selectedFormat === 'json'}
                  onChange={() => handleFormatChange('json')}
                />
                <span className="radio-custom"></span>
                <span>JSON</span>
              </label>
              <label className="format-option">
                <input
                  type="radio"
                  name="format"
                  value="txt"
                  checked={selectedFormat === 'txt'}
                  onChange={() => handleFormatChange('txt')}
                />
                <span className="radio-custom"></span>
                <span>TXT</span>
              </label>
            </div>
          </div>

          {/* Chọn cột cần xuất */}
          <div className="export-section">
            <div className="section-header">
              <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="section-title">Chọn cột cần xuất</span>
            </div>
            <div className="column-options">
              {columns.map(col => (
                <label key={col.key} className="column-option">
                  <input
                    type="checkbox"
                    checked={selectedColumns[col.key] || false}
                    onChange={() => handleColumnToggle(col.key)}
                  />
                  <span className="checkbox-custom"></span>
                  <span>{col.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="export-modal-footer">
          <button 
            className="export-button" 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Đang xuất...' : 'Xuất dữ liệu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
