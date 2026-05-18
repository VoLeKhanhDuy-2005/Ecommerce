import React from "react";
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
import { createUserApi } from "../util/api";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftOutlined,
  LockOutlined,
  UserOutlined,
  MailOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const RegisterPage = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const { name, email, password } = values;

    const res = await createUserApi(name, email, password);

    if (res) {
      notification.success({
        message: "Đăng ký thành công",
        description:
          "Bạn đã tạo tài khoản thành công. Vui lòng đăng nhập để tiếp tục.",
      });
      navigate("/login");
    } else {
      notification.error({
        message: "Đăng ký thất bại",
        description: "Không thể tạo tài khoản. Vui lòng thử lại sau.",
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
              ✨
            </div>
            <Title level={3} style={{ marginBottom: 8 }}>
              Đăng ký tài khoản
            </Title>
            <Text type="secondary">
              Tạo tài khoản để nhận ưu đãi và đặt món dễ dàng hơn.
            </Text>
          </div>
          <Form
            name="register"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              label="Tên của bạn"
              name="name"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập tên của bạn",
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                size="large"
                placeholder="Nguyễn Văn A"
              />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập email",
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
                {
                  min: 6,
                  message: "Mật khẩu phải từ 6 ký tự trở lên",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                size="large"
                placeholder="Tạo mật khẩu"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block size="large">
                Đăng ký
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
            <Text type="secondary">Đã có tài khoản?</Text>
            <Link to="/login" style={{ fontWeight: 600, color: "#fa541c" }}>
              Đăng nhập
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

export default RegisterPage;
