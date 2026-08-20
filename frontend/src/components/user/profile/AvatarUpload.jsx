import React from "react";
import { EditOutlined } from "@ant-design/icons";

const AvatarUpload = ({ preview, handleFileChange }) => {
  return (
    <div className="w-full md:w-1/3 flex flex-col items-center justify-start pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100">
      <label className="block text-sm font-semibold text-gray-700 mb-4">
        Ảnh đại diện
      </label>
      <div className="relative group">
        <div className="w-40 h-40 rounded-full border-4 border-orange-50 shadow-lg overflow-hidden bg-gray-50 flex items-center justify-center">
          {preview ? (
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl text-gray-300">👤</span>
          )}
        </div>

        <label
          htmlFor="avatar-input"
          className="absolute bottom-1 right-1 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-orange-600 transition-colors border-2 border-white"
          title="Thay đổi ảnh"
        >
          <EditOutlined className="text-lg" />
        </label>

        <input
          id="avatar-input"
          type="file"
          accept="image/jpeg, image/png"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <p className="text-xs text-gray-400 mt-4 text-center">
        Cho phép định dạng JPG, PNG. <br />
        Kích thước tối đa 2MB.
      </p>
    </div>
  );
};

export default AvatarUpload;
