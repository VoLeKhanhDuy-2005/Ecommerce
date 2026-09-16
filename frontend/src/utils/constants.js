export const ORDER_STATUS_MAP = {
  New: { label: 'Đơn hàng mới', color: 'blue' },
  Confirmed: { label: 'Đã xác nhận', color: 'cyan' },
  Preparing: { label: 'Đang chuẩn bị', color: 'orange' },
  Shipping: { label: 'Đang giao hàng', color: 'processing' },
  Delivered: { label: 'Đã giao thành công', color: 'success' },
  Cancelled: { label: 'Đã hủy', color: 'error' },
  'Return Requested': { label: 'Yêu cầu hoàn tiền', color: 'orange' },
  Returned: { label: 'Đã hoàn tiền', color: 'default' },
};

export const ORDER_FILTER_OPTIONS = [
  { value: 'All', label: 'Tất cả đơn hàng' },
  ...Object.keys(ORDER_STATUS_MAP).map((key) => ({
    value: key,
    label: ORDER_STATUS_MAP[key].label,
  })),
];

export const DEFAULT_SHIPPING_CONFIG = {
  BASE_FEE: 15000,
  BASE_DISTANCE: 3,
  EXTRA_FEE_PER_KM: 5000,
};
