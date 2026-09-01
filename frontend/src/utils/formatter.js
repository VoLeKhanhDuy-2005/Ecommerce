export const formatCurrency = (value) => {
  /*
    Intl trong JavaScript là một đối tượng toàn cục (global object)
     cung cấp API Quốc tế hóa (Internationalization API).
     Nó giúp định dạng số, tiền tệ, ngày tháng và so sánh chuỗi theo
     ngôn ngữ và khu vực cụ thể mà không cần thư viện ngoài.
  */
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};
