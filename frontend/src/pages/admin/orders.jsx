import { useState, useEffect, useContext, useCallback } from 'react';
import { io } from 'socket.io-client';
import { notification, Empty, Spin, Card, Pagination, Select, message } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { AuthContext } from '../../components/common/context/auth.context';
import {
  getShopOrdersApi,
  updateShopOrderStatusApi,
  handleShopCancelRequestApi,
  exportInvoiceApi,
  adminApproveReturnApi,
  adminRejectReturnApi,
  adminCompleteReturnApi,
} from '../../apis';
import { ORDER_FILTER_OPTIONS } from '../../utils/constants';
import OrderCard from '../../components/admin/orders/OrderCard';
import OrderDetailModal from '../../components/admin/orders/OrderDetailModal';
import OrderRejectModal from '../../components/admin/orders/OrderRejectModal';

export default function AdminOrdersPage() {
  const { auth } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOrderId, setRejectOrderId] = useState(null);
  const [triggerRefresh, setTriggerRefresh] = useState(0);
  /*
   0: so sánh hai số nguyên là phép toán nhanh nhất trong JavaScript,
    biết ngay người dùng hoặc hệ thống đã kích hoạt làm mới bao nhiêu lần
  */
  const [returnLoading, setReturnLoading] = useState(false);

  const fetchShopOrders = useCallback(async (isAutoRefresh = false, page, limit, status) => {
    if (!isAutoRefresh) setIsLoading(true);
    try {
      const res = await getShopOrdersApi(page, limit, status);
      if (res && res.success) {
        setOrders(res.data);
        if (res.meta) {
          setPagination({
            current: res.meta.page,
            pageSize: res.meta.limit,
            total: res.meta.total,
          });
        }
      } else {
        notification.error({
          message: 'Lỗi tải đơn hàng',
          description: res?.message || 'Không thể tải danh sách đơn hàng.',
          placement: 'bottomLeft',
        });
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách đơn hàng admin:', error);
      notification.error({
        message: 'Lỗi kết nối',
        description: error.message || 'Đã xảy ra lỗi kết nối.',
        placement: 'bottomLeft',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Dùng khi đổi bộ lọc/phân trang
    (async () => {
      await fetchShopOrders(false, 1, pagination.pageSize, statusFilter);
    })();
  }, [statusFilter, fetchShopOrders, pagination.pageSize]);

  useEffect(() => {
    // Dùng khi hành động làm mới thủ công từ bên ngoài thông qua biến triggerRefresh
    if (triggerRefresh > 0) {
      (async () => {
        await fetchShopOrders(true, 1, pagination.pageSize, statusFilter);
      })();
    }
  }, [triggerRefresh, fetchShopOrders, pagination.pageSize, statusFilter]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8686', {
      withCredentials: true,
    });

    if (socket.connected) {
      console.log('[Socket Admin] Already connected, joining admin_room');
      socket.emit('JOIN_ADMIN_ROOM');
    }

    socket.on('connect', () => {
      // cứ kết nối thành công (kể cả lúc reconnect sau khi rớt mạng) thì frontend đều chủ động
      // báo cho server biết mình cần vào phòng admin_room
      socket.emit('JOIN_ADMIN_ROOM');
    });

    socket.on('NEW_ORDER', (data) => {
      console.log('[Socket Admin] Received NEW_ORDER event:', data);
      message.info(data?.message || 'Có đơn hàng mới vừa được đặt!');
      setTriggerRefresh((prev) => prev + 1);
    });

    // Lắng nghe khi user chủ động đổi trạng thái (hủy đơn, đã nhận hàng, v.v)
    socket.on('ADMIN_REFRESH_ORDERS', () => {
      setTriggerRefresh((prev) => prev + 1);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket Admin] Connection error:', err.message);
    });

    return () => {
      socket.disconnect(); //Ngắt kết nối khi rời trang
    };
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await updateShopOrderStatusApi(orderId, newStatus);
      if (res && res.success) {
        notification.success({
          message: 'Cập nhật thành công',
          description: `Đơn hàng đã chuyển sang trạng thái "${newStatus}"`,
          placement: 'bottomLeft',
        });
        fetchShopOrders(true);
        window.dispatchEvent(
          // Phát tín hiệu đồng bộ trạng thái thực tế sang các tab/trang đang mở khác
          new CustomEvent('orderStatusChanged', { detail: { orderId } })
        );
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi cập nhật đơn hàng',
        description: error.message,
        placement: 'bottomLeft',
      });
    }
  };

  const handleApproveRejectCancel = async (orderId, action) => {
    try {
      const res = await handleShopCancelRequestApi(orderId, action);
      if (res && res.success) {
        notification.success({
          message: 'Xử lý yêu cầu hủy đơn',
          description:
            action === 'approve' ? 'Đã chấp nhận yêu cầu hủy đơn.' : 'Đã từ chối yêu cầu hủy đơn.',
          placement: 'bottomLeft',
        });
        fetchShopOrders(true);
        window.dispatchEvent(new CustomEvent('orderStatusChanged', { detail: { orderId } }));
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi xử lý hủy đơn',
        description: error.message,
        placement: 'bottomLeft',
      });
    }
  };

  const handleApproveReturn = async (orderId) => {
    setReturnLoading(true);
    try {
      const res = await adminApproveReturnApi(orderId);
      if (res && res.success) {
        notification.success({
          message: 'Thành công',
          description: 'Đã chấp nhận yêu cầu khiếu nại & hoàn tiền.',
        });
        fetchShopOrders(true);
        setIsDetailModalOpen(false);
      } else {
        notification.error({ message: 'Lỗi', description: res.message });
      }
    } catch (err) {
      console.log(err);
      notification.error({ message: 'Lỗi', description: 'Đã xảy ra sự cố.' });
    } finally {
      setReturnLoading(false);
    }
  };

  const handleRejectReturn = (orderId) => {
    setRejectOrderId(orderId);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const submitRejectReturn = async () => {
    if (!rejectReason.trim()) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng nhập lý do từ chối hoàn tiền.',
      });
      return;
    }

    setReturnLoading(true);
    try {
      const res = await adminRejectReturnApi(rejectOrderId, rejectReason);
      if (res && res.success) {
        notification.success({
          message: 'Thành công',
          description: 'Đã từ chối yêu cầu hoàn tiền.',
        });
        fetchShopOrders(true);
        setIsDetailModalOpen(false);
        setIsRejectModalOpen(false);
      } else {
        notification.error({ message: 'Lỗi', description: res.message });
      }
    } catch (err) {
      console.log(err);
      notification.error({ message: 'Lỗi', description: 'Đã xảy ra sự cố.' });
    } finally {
      setReturnLoading(false);
    }
  };

  const handleCompleteReturn = async (orderId) => {
    if (!window.confirm('Xác nhận đã hoàn tiền cho khách?')) return;

    setReturnLoading(true);
    try {
      const res = await adminCompleteReturnApi(orderId);
      if (res && res.success) {
        notification.success({
          message: 'Thành công',
          description: 'Đã hoàn tất quá trình trả hàng và hoàn tiền.',
        });
        fetchShopOrders(true);
        setIsDetailModalOpen(false);
      } else {
        notification.error({ message: 'Lỗi', description: res.message });
      }
    } catch (err) {
      console.log(err);
      notification.error({ message: 'Lỗi', description: 'Đã xảy ra sự cố.' });
    } finally {
      setReturnLoading(false);
    }
  };

  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleExportInvoice = async (orderId) => {
    try {
      const res = await exportInvoiceApi(orderId);
      const url = window.URL.createObjectURL(new Blob([res]));
      //Blob là một object đại diện cho dữ liệu file dạng nhị phân
      //-> new Blob([res]) chứa dữ liệu PDF
      //Trình duyệt tạo ra một URL tạm thời, dạng: blob:http://localhost:5173/8b7c...-xxxx
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      notification.success({ message: 'Xuất hóa đơn thành công' });
    } catch (error) {
      console.log(error);
      notification.error({
        message: 'Lỗi xuất hóa đơn',
        description: 'Không thể tải hóa đơn. Vui lòng thử lại sau.',
      });
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <div className='min-h-[70vh] flex flex-col items-center justify-center'>
        <Empty description='Vui lòng đăng nhập tài khoản Quản trị viên' />
      </div>
    );
  }

  return (
    <div className='max-w-5xl mx-auto px-4 py-8 pb-20'>
      <div className='flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8'>
        <div className='flex items-center gap-3'>
          <div className='w-1.5 h-8 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full' />
          <h1 className='text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2'>
            <HistoryOutlined className='text-purple-600' />
            <span>Quản Lý Đơn Hàng</span>
          </h1>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-gray-600 font-semibold text-sm'>Trạng thái:</span>
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            className='w-44'
            options={ORDER_FILTER_OPTIONS}
          />
        </div>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-20'>
          <Spin size='large' tip='Đang tải dữ liệu hệ thống...' />
        </div>
      ) : orders.length === 0 ? (
        <Card className='rounded-3xl border-gray-100 text-center py-12 shadow-sm'>
          <Empty description='Hiện tại không có đơn hàng nào tồn tại trong hệ thống.' />
        </Card>
      ) : (
        <div className='space-y-6'>
          {orders.map((ord) => (
            <OrderCard
              key={ord._id}
              ord={ord}
              openDetailModal={openDetailModal}
              handleExportInvoice={handleExportInvoice}
              handleApproveRejectCancel={handleApproveRejectCancel}
              handleUpdateStatus={handleUpdateStatus}
            />
          ))}

          <div className='flex justify-end mt-6'>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={(page, pageSize) => fetchShopOrders(false, page, pageSize)}
              showSizeChanger
              showTotal={(total) => `Tổng số ${total} đơn hàng`}
            />
          </div>
        </div>
      )}

      <OrderDetailModal
        isDetailModalOpen={isDetailModalOpen}
        setIsDetailModalOpen={setIsDetailModalOpen}
        selectedOrder={selectedOrder}
        handleExportInvoice={handleExportInvoice}
        returnLoading={returnLoading}
        handleApproveReturn={handleApproveReturn}
        handleRejectReturn={handleRejectReturn}
        handleCompleteReturn={handleCompleteReturn}
      />

      <OrderRejectModal
        isRejectModalOpen={isRejectModalOpen}
        setIsRejectModalOpen={setIsRejectModalOpen}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        submitRejectReturn={submitRejectReturn}
        returnLoading={returnLoading}
      />
    </div>
  );
}
