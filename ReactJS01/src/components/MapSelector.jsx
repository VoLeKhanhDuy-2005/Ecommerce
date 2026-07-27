import React, { useEffect, useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Sửa lỗi icon default của Leaflet trong React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", //Ảnh marker cho màn hình Retina (độ phân giải cao)
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", //Ảnh marker bình thường
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", //Ảnh bóng của marker.
});

// Component con để bắt sự kiện click trên bản đồ
function MapEvents({ setPosition, onChange }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
      if (onChange) {
        onChange({ lat, lng });
      }
    },
  });
  return null;
  //Component này không hiển thị giao diện
  //Nó chỉ tồn tại để: đăng ký sự kiện, lắng nghe click, cập nhật dữ liệu -> logic only
}

/**
 * Component React dùng react-leaflet để hiển thị bản đồ và cho phép người dùng chọn vị trí bằng cách click
 *
 * Props:
 * - defaultLat: Vĩ độ mặc định
 * - defaultLng: Kinh độ mặc định
 * - onChange: Hàm callback khi vị trí thay đổi
 * - readOnly: Chỉ hiển thị bản đồ mà không cho phép tương tác
 */
export default function MapSelector({
  defaultLat = 10.850438,
  defaultLng = 106.772596,
  onChange,
  readOnly = false,
}) {
  const [position, setPosition] = useState({
    lat: defaultLat,
    lng: defaultLng,
  });
  const mapRef = useRef(); //dùng để lấy đối tượng bản đồ (Leaflet Map)

  // Cập nhật vị trí nếu prop thay đổi
  useEffect(() => {
    setPosition({ lat: defaultLat, lng: defaultLng });
    if (mapRef.current) {
      //Sau khi render: mapRef.current sẽ là Leaflet.Map
      mapRef.current.flyTo([defaultLat, defaultLng], mapRef.current.getZoom());
    }
  }, [defaultLat, defaultLng]);

  return (
    <div
      style={{
        height: "300px",
        width: "100%",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
      }}
    >
      <MapContainer //Bản đồ
        center={[position.lat, position.lng]} //Tọa độ trung tâm
        zoom={15} //Mức phóng to
        style={{ height: "100%", width: "100%" }}
        ref={mapRef} // Gắn đối tượng bản đồ vào mapRef
      >
        <TileLayer //Lớp ảnh nền -> Nếu bỏ thì chỉ còn nền trắng
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position.lat && position.lng && (
          <Marker position={[position.lat, position.lng]} />
        )}
        {!readOnly && (
          <MapEvents setPosition={setPosition} onChange={onChange} />
        )}
      </MapContainer>
    </div>
  );
}
