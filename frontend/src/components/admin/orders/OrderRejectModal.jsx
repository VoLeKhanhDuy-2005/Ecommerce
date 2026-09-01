import React from 'react';
import { Modal, Input } from 'antd';

const OrderRejectModal = ({
  isRejectModalOpen,
  setIsRejectModalOpen,
  rejectReason,
  setRejectReason,
  submitRejectReturn,
  returnLoading,
}) => {
  return (
    <Modal
      title='Từ chối hoàn tiền'
      open={isRejectModalOpen}
      onCancel={() => setIsRejectModalOpen(false)}
      onOk={submitRejectReturn}
      okText='Xác nhận từ chối'
      okButtonProps={{ danger: true, loading: returnLoading }}
    >
      <p className='mb-2'>Vui lòng nhập lý do từ chối (bắt buộc):</p>
      <Input.TextArea
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        rows={4}
        placeholder='Nhập lý do từ chối...'
      />
    </Modal>
  );
};

export default OrderRejectModal;
