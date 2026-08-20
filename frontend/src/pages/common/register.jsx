import React, { useState, useEffect } from "react";
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
import { registerApi, sendRegisterOtpApi } from "../../apis";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftOutlined,
  LockOutlined,
  UserOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const onFinishStep1 = async (values) => {
    setLoading(true);
    try {
      const { email } = values;
      const res = await sendRegisterOtpApi(email);

      if (res && res.success) {
        notification.success({
          message: "Gửi OTP thành công",
          description: "Vui lòng kiểm tra email của bạn để lấy mã OTP.",
        });
        setStep(2);
        setCountdown(300); // 5 phút
      } else {
        notification.error({
          message: "Gửi OTP thất bại",
          description: res?.EM || "Đã có lỗi xảy ra. Vui lòng thử lại.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: error.response?.data?.EM || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const onFinishStep2 = async (values) => {
    setLoading(true);
    try {
      const { name, email, password, otp } = values;
      const res = await registerApi(name, email, password, otp);

      if (res && res.success) {
        notification.success({
          message: "Đăng ký thành công",
          description:
            "Bạn đã tạo tài khoản thành công. Vui lòng đăng nhập để tiếp tục.",
        });
        navigate("/login");
      } else {
        notification.error({
          message: "Đăng ký thất bại",
          description:
            res?.EM || "Không thể tạo tài khoản. Vui lòng thử lại sau.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: error.response?.data?.EM || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    const email = form.getFieldValue("email");
    setLoading(true);
    try {
      const res = await sendRegisterOtpApi(email);
      if (res && res.success) {
        notification.success({
          message: "Đã gửi lại mã OTP",
          description: "Vui lòng kiểm tra lại email của bạn.",
        });
        setCountdown(300);
      } else {
        notification.error({
          message: "Gửi lại OTP thất bại",
          description: res?.EM || "Đã có lỗi xảy ra.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: error.response?.data?.EM || error.message,
      });
    } finally {
      setLoading(false);
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
              {step === 1 ? "✨" : "📩"}
            </div>
            <Title level={3} style={{ marginBottom: 8 }}>
              {step === 1 ? "Đăng ký tài khoản" : "Xác thực Email"}
            </Title>
            <Text type="secondary">
              {step === 1
                ? "Tạo tài khoản để đặt món và nhận ưu đãi."
                : "Vui lòng nhập mã OTP gồm 6 chữ số vừa được gửi đến email của bạn."}
            </Text>
          </div>
          <Form
            form={form}
            name="register"
            onFinish={step === 1 ? onFinishStep1 : onFinishStep2}
            autoComplete="off"
            layout="vertical"
          >
            {/* Bước 1: Nhập thông tin */}
            <div style={{ display: step === 1 ? "block" : "none" }}>
              <Form.Item
                label="Tên của bạn"
                name="name"
                rules={[
                  {
                    required: step === 1,
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
                    required: step === 1,
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
                    required: step === 1,
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
            </div>

            {/* Bước 2: Nhập OTP */}
            <div style={{ display: step === 2 ? "block" : "none" }}>
              <Form.Item
                label="Mã OTP"
                name="otp"
                rules={[
                  {
                    required: step === 2,
                    message: "Vui lòng nhập mã OTP",
                  },
                  {
                    len: 6,
                    message: "Mã OTP phải có đúng 6 chữ số",
                  },
                ]}
              >
                <Input
                  prefix={<SafetyCertificateOutlined />}
                  size="large"
                  placeholder="Nhập 6 số OTP"
                  maxLength={6}
                />
              </Form.Item>

              <div style={{ textAlign: "right", marginBottom: "16px" }}>
                <Text type="secondary">Chưa nhận được mã? </Text>
                {countdown > 0 ? (
                  <Text type="secondary">Gửi lại sau {countdown}s</Text>
                ) : (
                  <Button
                    type="link"
                    style={{ padding: 0 }}
                    onClick={resendOTP}
                    loading={loading}
                  >
                    Gửi lại mã
                  </Button>
                )}
              </div>
            </div>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
              >
                {step === 1 ? "Tiếp tục" : "Đăng ký"}
              </Button>
            </Form.Item>

            {step === 2 && (
              <Form.Item style={{ marginBottom: 0, marginTop: "12px" }}>
                <Button
                  type="default"
                  block
                  size="large"
                  onClick={() => setStep(1)}
                >
                  Quay lại sửa thông tin
                </Button>
              </Form.Item>
            )}
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
