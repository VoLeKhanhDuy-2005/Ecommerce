import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Sửa lỗi icon default của Leaflet trong React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Component con bắt sự kiện click trên bản đồ.
 * Không hiển thị giao diện — chỉ đăng ký sự kiện và gọi callback khi user chọn vị trí.
 */
function MapEvents({ setPosition, onChange }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
      if (onChange) onChange({ lat, lng });
    },
  });
  return null;
}

/**
 * Component con dùng useMap (react-leaflet v5) để điều khiển bản đồ khi tọa độ thay đổi.
 * Phải đặt bên trong MapContainer mới dùng được useMap.
 */
function MapController({ lat, lng }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom());
  }, [lat, lng, map]);

  return null;
}

/**
 * Hiển thị bản đồ Leaflet và cho phép người dùng chọn vị trí bằng cách click.
 *
 * Props:
 * - defaultLat: Vĩ độ mặc định
 * - defaultLng: Kinh độ mặc định
 * - onChange: Callback khi vị trí thay đổi, nhận { lat, lng }
 * - readOnly: Chỉ xem, không cho phép click chọn vị trí
 */
export default function MapSelector({
  defaultLat = 10.850438,
  defaultLng = 106.772596,
  onChange,
  readOnly = false,
}) {
  // Vị trí do user tự click chọn; null = chưa chọn -> dùng props làm mặc định
  const [pickedPosition, setPickedPosition] = useState(null);

  // Theo dõi props trước đó để phát hiện khi parent thay đổi tọa độ (ví dụ: bấm "Dùng GPS")
  const [prevDefault, setPrevDefault] = useState({ lat: defaultLat, lng: defaultLng });

  // Khi props thay đổi -> reset vị trí đã chọn để props mới có hiệu lực
  // (Pattern chính thức của React: gọi setState trong render thay vì dùng useEffect)
  if (prevDefault.lat !== defaultLat || prevDefault.lng !== defaultLng) {
    setPrevDefault({ lat: defaultLat, lng: defaultLng });
    setPickedPosition(null);
  }

  // Vị trí hiệu lực: ưu tiên click của user, nếu chưa chọn thì dùng props
  const position = pickedPosition ?? { lat: defaultLat, lng: defaultLng };

  return (
    <div
      style={{
        height: '300px',
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
      }}
    >
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, HERE, Garmin, OpenStreetMap contributors'
          url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
          maxZoom={19}
        />
        <MapController lat={position.lat} lng={position.lng} />
        {position.lat && position.lng && <Marker position={[position.lat, position.lng]} />}
        {!readOnly && <MapEvents setPosition={setPickedPosition} onChange={onChange} />}
      </MapContainer>
    </div>
  );
}
