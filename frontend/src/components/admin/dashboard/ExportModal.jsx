import React from "react";
import { Modal, Select } from "antd";

const ExportModal = ({
  isVisible,
  isExporting,
  selectedExportYears,
  setSelectedExportYears,
  onExport,
  onCancel,
}) => {
  return (
    <Modal
      title={
        <span className="text-xl font-bold text-gray-800">
          Xuất Báo Cáo Excel
        </span>
      }
      open={isVisible}
      onOk={onExport}
      onCancel={onCancel}
      confirmLoading={isExporting}
      okText="Tải xuống"
      cancelText="Hủy"
      okButtonProps={{
        className: "bg-green-600 hover:bg-green-700 border-none",
      }}
      centered
    >
      <div className="py-4">
        <p className="mb-2 text-gray-600 font-medium">
          Chọn các năm cần xuất dữ liệu:
        </p>
        <Select
          mode="multiple"
          allowClear
          style={{ width: "100%" }}
          placeholder="Chọn năm"
          value={selectedExportYears}
          onChange={(values) => setSelectedExportYears(values)}
          options={Array.from(
            { length: Number(import.meta.env.VITE_MAX_EXPORT_YEARS) || 10 },
            (_, index) => {
              const year = new Date().getFullYear() - index;
              return {
                value: year,
                label: `Năm ${year}`,
              };
            },
          )}
        />
      </div>
    </Modal>
  );
};

export default ExportModal;
