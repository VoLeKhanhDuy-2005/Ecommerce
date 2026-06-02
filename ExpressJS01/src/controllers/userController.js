const { createUserService, loginService, getUserService, getCurrentUserService, refreshTokenService, updateProfile } = require("../services/userService");
const User = require("../models/user");

const createUser = async (req, res) => {
    const { name, email, password } = req.body;
    const data = await createUserService(name, email, password);
    return res.status(200).json(data)
}

const handleLogin = async (req, res) => {
    const { email, password } = req.body;
    const data = await loginService(email, password);

    if (data && data.refresh_token) {
        res.cookie("refresh_token", data.refresh_token, {
            httpOnly: true,
            secure: false, // Set là true nếu chạy trên HTTPS
            sameSite: "strict",
            // Trình duyệt chỉ gửi cookie nếu bạn đang ở trang A (nganhang.com)
            // và thực hiện hành động (nhấp link, gửi biểu mẫu, gọi API) dẫn đến trang A 
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        // Xóa refresh_token khỏi response body để bảo mật
        delete data.refresh_token;
    }

    return res.status(200).json(data)
}

const getUser = async (req, res) => {
    const data = await getUserService();
    return res.status(200).json(data)
}

const getCurrentUser = async (req, res) => {
    const data = await getCurrentUserService(req.user.email);
    return res.status(200).json(data)
}

const handleRefreshToken = async (req, res) => {
    const refresh_token = req.cookies.refresh_token;
    
    if (!refresh_token) {
        return res.status(401).json({ EC: 1, EM: "Không tìm thấy refresh token trong cookie" });
    }

    const data = await refreshTokenService(refresh_token);

    return res.status(200).json(data);
}

const handleLogout = (req, res) => {
    res.clearCookie("refresh_token");
    return res.status(200).json({ EC: 0, EM: "Đăng xuất thành công" });
}

const handleUpdateProfile = async (req, res) => {
    try {
        const result = await updateProfile(req.user.email, req.body, req.file);
        if (result.EC === 0)
            return res.status(200).json({ success: true, message: "Cập nhật thành công", data: result.data });
        return res.status(400).json({ success: false, message: result.EM });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Lỗi server" });
    }
}

module.exports = {
    createUser, handleLogin, getUser, getCurrentUser, handleRefreshToken, handleLogout, handleUpdateProfile
}