import { GiftOutlined, DollarCircleFilled } from '@ant-design/icons';

const RewardsHeader = ({ userCoins }) => {
  return (
    <div className='bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden'>
      <div className='absolute top-0 right-0 -mt-10 -mr-10 opacity-20'>
        <GiftOutlined style={{ fontSize: '200px' }} />
      </div>
      <div>
        <h1 className='text-3xl font-black mb-2 flex items-center gap-2'>
          <GiftOutlined /> Đổi Xu Nhận Quà
        </h1>
        <p className='text-orange-100 opacity-90'>
          Tích lũy Xu từ các đơn hàng để nhận ngàn ưu đãi hấp dẫn!
        </p>
      </div>
      <div className='bg-white/20 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/30 text-center relative z-10'>
        <p className='text-orange-100 text-sm font-semibold mb-1'>Xu hiện có</p>
        <p className='text-4xl font-black text-white flex items-center gap-2 justify-center'>
          <span className='text-yellow-300'>
            <DollarCircleFilled style={{ color: '#FFD700', marginRight: 4 }} />
          </span>{' '}
          {userCoins}
        </p>
      </div>
    </div>
  );
};

export default RewardsHeader;
