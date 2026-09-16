import { Modal, Button, Image } from 'antd';
import { EyeOutlined, PrinterOutlined, ShoppingOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../../src/utils/formatter';

const OrderDetailModal = ({
  isDetailModalOpen,
  setIsDetailModalOpen,
  selectedOrder,
  handleExportInvoice,
  returnLoading,
  handleApproveReturn,
  handleRejectReturn,
  handleCompleteReturn,
}) => {
  if (!selectedOrder) return null;

  return (
    <Modal
      title={
        <div className='flex items-center gap-2 text-lg'>
          <EyeOutlined className='text-blue-600' />
          <span>Chi Tiết Đơn Hàng #{selectedOrder._id.slice(-6).toUpperCase()}</span>
        </div>
      }
      open={isDetailModalOpen}
      onCancel={() => setIsDetailModalOpen(false)}
      footer={[
        selectedOrder.status !== 'Cancelled' && (
          <Button
            key='export'
            icon={<PrinterOutlined />}
            className='text-green-600 hover:text-green-700 text-xs font-semibold inline-flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md transition-colors ml-1'
            onClick={() => handleExportInvoice(selectedOrder._id)}
          >
            Xuất hóa đơn
          </Button>
        ),
        <Button
          key='close'
          className='rounded-xl font-semibold'
          onClick={() => setIsDetailModalOpen(false)}
        >
          Đóng
        </Button>,
      ]}
      width={800}
      centered
    >
      <div className='space-y-6 pt-4 pb-2'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-2xl border border-gray-100'>
          <div className='space-y-2'>
            <p className='font-bold text-gray-800 text-base mb-3 border-b pb-2'>
              Thông tin khách hàng
            </p>
            <p className='flex justify-between'>
              <span className='text-gray-500'>Tên:</span>{' '}
              <span className='font-medium'>{selectedOrder.customerName || 'N/A'}</span>
            </p>
            <p className='flex justify-between'>
              <span className='text-gray-500'>SĐT:</span>{' '}
              <span className='font-medium'>{selectedOrder.phoneNumber || 'N/A'}</span>
            </p>
            <p className='flex justify-between'>
              <span className='text-gray-500'>Email:</span>{' '}
              <span className='font-medium'>{selectedOrder.userEmail}</span>
            </p>
            {selectedOrder.note && (
              <div className='mt-4 pt-3 border-t'>
                <p className='text-gray-500 mb-1'>Ghi chú:</p>
                <p className='font-medium text-orange-600 bg-orange-50 p-2 rounded-lg text-sm'>
                  {selectedOrder.note}
                </p>
              </div>
            )}
          </div>
          <div className='space-y-2'>
            <p className='font-bold text-gray-800 text-base mb-3 border-b pb-2'>
              Giao hàng & Thanh toán
            </p>
            <p className='flex flex-col'>
              <span className='text-gray-500'>Địa chỉ:</span>{' '}
              <span className='font-medium line-clamp-2'>
                {selectedOrder.shippingAddress || 'N/A'}
              </span>
            </p>
            <p className='flex justify-between mt-1'>
              <span className='text-gray-500'>Phương thức:</span>{' '}
              <span className='font-medium'>
                {selectedOrder.paymentMethod === 'MOMO' ? 'Ví MoMo' : 'Thanh toán khi nhận hàng'}
              </span>
            </p>
            <p className='flex justify-between'>
              <span className='text-gray-500'>Trạng thái:</span>{' '}
              <span className='font-medium'>
                {selectedOrder.paymentStatus === 'Paid' ? (
                  <span className='text-green-600 font-bold'>Đã thanh toán</span>
                ) : (
                  <span className='text-orange-500 font-bold'>Chưa thanh toán</span>
                )}
              </span>
            </p>
          </div>
        </div>

        <div>
          <p className='font-bold text-gray-800 text-base mb-3 flex items-center gap-2'>
            <ShoppingOutlined className='text-orange-500' /> Sản phẩm đã đặt
          </p>
          <div className='space-y-3 bg-white p-4 rounded-2xl border border-gray-100'>
            {selectedOrder.items?.map((item, idx) => (
              <div
                key={idx}
                className='flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0'
              >
                <div className='flex items-center gap-3'>
                  <img
                    src={item.image || 'https://placehold.co/100'}
                    alt={item.name}
                    className='w-12 h-12 object-cover rounded-xl border border-gray-100'
                  />
                  <div>
                    <p className='font-bold text-gray-800'>{item.name}</p>
                    <p className='text-xs text-gray-500'>Số lượng: {item.quantity}</p>
                  </div>
                </div>
                <span className='font-bold text-gray-700'>{formatCurrency(item.price)}</span>
              </div>
            ))}
          </div>
          <div className='mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100/50 space-y-2 text-right'>
            <p className='text-sm text-gray-600'>
              Phí giao hàng: {formatCurrency(selectedOrder.shippingFee || 0)}
            </p>
            <p className='text-lg font-black text-orange-600 flex justify-end items-center gap-2'>
              <span className='text-sm text-gray-700 font-semibold'>Tổng cộng:</span>{' '}
              {formatCurrency(selectedOrder.totalAmount)}
            </p>
          </div>
        </div>

        {selectedOrder.returnRequests && selectedOrder.returnRequests.length > 0 && (
          <div className='bg-orange-50 p-4 rounded-xl border border-orange-200 mt-6'>
            <h3 className='font-bold text-orange-800 mb-3 text-lg'>Yêu Cầu Hoàn Tiền</h3>
            <div className='space-y-4'>
              {selectedOrder.returnRequests.map((req, idx) => (
                <div
                  key={idx}
                  className='bg-white p-3 rounded-lg border border-orange-100 flex flex-col gap-2'
                >
                  <div className='flex justify-between font-semibold text-sm text-gray-700'>
                    <span>Sản phẩm:</span>
                    <span className='text-right'>
                      {selectedOrder.items.find((i) => i.product === req.item)?.name} x{' '}
                      {req.quantity}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm text-gray-600'>
                    <span>Lý do:</span>
                    <span className='text-right italic'>{req.reason}</span>
                  </div>
                  <div className='flex justify-between text-sm text-gray-600'>
                    <span>Trạng thái:</span>
                    <span className='font-bold'>
                      {req.status === 'Pending' ? 'Chưa giải quyết' : 'Đã giải quyết'}
                    </span>
                  </div>
                  {req.images && req.images.length > 0 && (
                    <div className='mt-2 flex gap-2 overflow-x-auto'>
                      <Image.PreviewGroup>
                        {req.images.map((img, i) => (
                          <Image
                            key={i}
                            src={`${img}`}
                            alt='proof'
                            className='w-16 h-16 object-cover rounded'
                          />
                        ))}
                      </Image.PreviewGroup>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {selectedOrder.status === 'Return Requested' && (
              <div className='mt-4 flex gap-3'>
                <Button
                  type='primary'
                  className='bg-orange-500 hover:bg-orange-600'
                  loading={returnLoading}
                  onClick={() => handleApproveReturn(selectedOrder._id)}
                >
                  Chấp Nhận Hoàn Tiền
                </Button>
                <Button danger onClick={() => handleRejectReturn(selectedOrder._id)}>
                  Từ Chối Hoàn Tiền
                </Button>
              </div>
            )}
            {selectedOrder.status === 'Returned' && (
              <div className='mt-4 flex justify-end'>
                <Button
                  type='primary'
                  className='bg-green-600 hover:bg-green-700'
                  loading={returnLoading}
                  onClick={() => handleCompleteReturn(selectedOrder._id)}
                >
                  Đã nhận hàng trả về & Hoàn tiền
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OrderDetailModal;
