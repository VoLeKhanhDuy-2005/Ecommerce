const handleResolveMapLink = async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, message: "URL is required" });
  }

  const extractCoords = (urlString) => {
    // 1. Dạng /@10.850438,106.772596
    let match = urlString.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

    // 2. Dạng /search/10.71,+106.67 hoặc /place/... hoặc /dir/...
    match = urlString.match(
      /\/(?:search|place|dir)\/.*?(-?\d+\.\d+)(?:%2C|,|\+)+(-?\d+\.\d+)/,
    );
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

    // 3. Dạng query=10.711076,106.672011 hoặc ll=...
    match = urlString.match(
      /(?:query|ll)=(-?\d+\.\d+)(?:%2C|,|\+)+(-?\d+\.\d+)/,
    );
    /*
      Toàn bộ regex (?:%2C|,|\+) nghĩa là: Khớp một trong ba chuỗi:
      - %2C (URL encoding của dấu phẩy ,)
      - ,
      - +
    */
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

    return null;
  };

  try {
    // Thử trích xuất từ URL gốc trước
    let coords = extractCoords(url);
    if (coords) {
      return res.status(200).json({ success: true, data: coords });
    }

    // Nếu không có, tiến hành phân giải link ngắn
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
      },
    });

    const finalUrl = response.url;
    coords = extractCoords(finalUrl);

    if (coords) {
      return res.status(200).json({ success: true, data: coords });
    }

    // Nếu vẫn không có tọa độ, thử lấy tên địa điểm từ URL
    const placeNameMatch = finalUrl.match(/\/place\/([^/]+)/);
    /*
      ([^/]+)
      - []: Character class (tập ký tự)
      - dấu ^ có nghĩa là không phải -> [^/]: ất kỳ ký tự nào ngoại trừ dấu /
      - +: ít nhất một ký tự (khác "")
      - (...): Dấu ngoặc tròn tạo capturing group -> Phần khớp bên trong sẽ được lưu vào match[1]
    */
    if (placeNameMatch) {
      const placeName = decodeURIComponent(placeNameMatch[1]).replace(
        /\+/g,
        " ",
      );
      /*
        .replace(/\+/g, " ") là lệnh JavaScript dùng để thay thế 'tất cả' dấu + trong chuỗi thành dấu cách
        - ko có g: chỉ thay dấu + đầu tiên
      */
      return res.status(200).json({
        success: false,
        isPlaceName: true,
        placeName: placeName,
        message:
          "Đây là link một địa điểm cụ thể, hệ thống sẽ tự động tìm kiếm theo tên.",
      });
    }

    // Nếu vẫn không có, tìm trong HTML body (fallback)
    const htmlBody = await response.text();
    coords = extractCoords(htmlBody);

    if (coords) {
      return res.status(200).json({ success: true, data: coords });
    }

    return res.status(404).json({
      success: false,
      message: "Không tìm thấy tọa độ trong link bản đồ này",
    });
  } catch (error) {
    console.error("Resolve map link error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi kết nối khi phân tích link bản đồ",
    });
  }
};

module.exports = {
  handleResolveMapLink,
};
