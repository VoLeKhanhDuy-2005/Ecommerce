const { AccessToken } = require('livekit-server-sdk');

const generateToken = async (req, res) => {
  try {
    const { room } = req.query;
    if (!room) {
      return res.status(400).json({ EC: 1, EM: "Missing room parameter" });
    }

    const user = req.user; // từ middleware auth
    if (!user) {
      return res.status(401).json({ EC: -1, EM: "Unauthorized" });
    }

    const roomName = room;
    const participantName = user.name || user.email;
    
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
       console.error("Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET in environment variables.");
       return res.status(500).json({ EC: -1, EM: "Server LiveKit Configuration Error" });
    }

    // Khởi tạo access token
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: user.email,
        name: participantName,
      }
    );

    // Phân quyền theo role
    const isAdmin = user.role === 'admin';
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: isAdmin, // Chỉ admin mới được phát video/audio
      canPublishData: true, // Cho phép chat bằng Data Channel
      canSubscribe: true,
    });

    const token = await at.toJwt();
    return res.status(200).json({ EC: 0, EM: "Success", data: { token } });
  } catch (error) {
    console.error("Generate LiveKit token error: ", error);
    return res.status(500).json({ EC: -1, EM: "Internal server error" });
  }
};

module.exports = {
  generateToken,
};
