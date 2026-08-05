const { AccessToken } = require('livekit-server-sdk');
const dotenv = require('dotenv');
const path = require('path');

// Nạp biến môi trường từ file .env của backend
dotenv.config({ path: path.join(__dirname, '../../.env') });

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const ROOM_NAME = 'support-room';

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error("❌ Thiếu cấu hình LIVEKIT_API_KEY hoặc LIVEKIT_API_SECRET trong .env");
  process.exit(1);
}

/**
 * Bài test 1: Kiểm tra hiệu năng tạo Token (Backend API Load)
 * Mô phỏng 1000 user gọi API để lấy token tham gia phòng Livestream.
 */
async function testTokenGenerationPerformance(userCount = 1000) {
  console.log(`\n🚀 [TEST 1] Bắt đầu tạo ${userCount} tokens...`);
  const startTime = Date.now();
  const tokens = [];

  for (let i = 1; i <= userCount; i++) {
    const participantName = `Test_Viewer_${i}`;
    const identity = `viewer_${i}@example.com`;

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: identity,
      name: participantName,
    });

    at.addGrant({
      roomJoin: true,
      room: ROOM_NAME,
      canPublish: false, // Viewer không được phát video
      canPublishData: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    tokens.push(token);
  }

  const endTime = Date.now();
  console.log(`✅ Đã tạo thành công ${tokens.length} tokens.`);
  console.log(`⏱️ Thời gian thực thi: ${endTime - startTime} ms`);
  console.log(`⚡ Tốc độ trung bình: ${((userCount / (endTime - startTime)) * 1000).toFixed(2)} tokens/giây`);
}

async function runTests() {
  await testTokenGenerationPerformance(1000);
}

runTests();
