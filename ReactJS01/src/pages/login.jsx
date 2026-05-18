import React, { useContext } from "react";
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  notification,
  Row,
  Typography,
} from "antd";
import { loginApi } from "../util/api";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../components/context/auth.context";
import {
  ArrowLeftOutlined,
  LockOutlined,
  MailOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useContext(AuthContext);

  const onFinish = async (values) => {
    const { email, password } = values;

    const res = await loginApi(email, password);

    if (res && res.EC === 0) {
      localStorage.setItem("access_token", res.access_token);
      notification.success({
        message: "LOGIN USER",
        description: "success",
      });
      setAuth({
        isAuthenticated: true,
        user: {
          email: res?.user?.email ?? "",
          name: res?.user?.name ?? "",
        },
      });
      navigate("/");
    } else {
      notification.error({
        message: "LOGIN USER",
        description: res?.EM ?? "error",
      });
    }
  };

  return (
    <Row
      justify="center"
      align="middle"
      style={{
        minHeight: "calc(100vh - 80px)",
        padding: "40px 16px",
        background:
          "radial-gradient(circle at top, rgba(255,160,80,0.18), transparent 40%), linear-gradient(180deg, #fff7ed 0%, #ffe8d6 100%)",
      }}
    >
      <Col xs={24} sm={20} md={14} lg={10} xl={8}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "28px",
            boxShadow: "0 30px 80px rgba(253, 128, 44, 0.18)",
            padding: "32px 28px",
            border: "1px solid rgba(255, 156, 66, 0.12)",
          }}
        >
          <div style={{ marginBottom: "24px", textAlign: "center" }}>
            <div
              style={{
                width: "72px",
                height: "72px",
                margin: "0 auto 16px",
                borderRadius: "22px",
                background: "linear-gradient(135deg, #ff8a3d, #ff5c00)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "28px",
              }}
            >
              🔒
            </div>
            <Title level={3} style={{ marginBottom: 8 }}>
              Đăng nhập
            </Title>
            <Text type="secondary">
              Đăng nhập để xem ưu đãi và tiếp tục đặt món nhanh chóng.
            </Text>
          </div>
          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập email của bạn",
                },
                {
                  type: "email",
                  message: "Email không đúng định dạng",
                },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                size="large"
                placeholder="name@example.com"
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập mật khẩu",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                size="large"
                placeholder="Nhập mật khẩu"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block size="large">
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <Divider />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <Text type="secondary">Chưa có tài khoản?</Text>
            <Link to="/register" style={{ fontWeight: 600, color: "#fa541c" }}>
              Đăng ký ngay
            </Link>
          </div>

          <div style={{ textAlign: "center" }}>
            <Link to="/">
              <ArrowLeftOutlined /> Quay lại trang chủ
            </Link>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default LoginPage;
