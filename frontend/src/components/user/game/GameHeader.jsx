import React from 'react';
import { Typography } from 'antd';

const { Title, Text } = Typography;

const GameHeader = () => {
  return (
    <div className='text-center mb-8'>
      <Title
        level={2}
        className='text-orange-600 !font-black !mb-2 flex justify-center items-center gap-3'
      >
        <span className='text-4xl animate-bounce'>🤔</span>
        Đoán Tên Món Ăn
        <span className='text-4xl animate-bounce' style={{ animationDelay: '0.2s' }}>
          🍜
        </span>
      </Title>
      <Text className='text-gray-500 text-lg'>Đoán đúng để nhận XU thưởng!</Text>
    </div>
  );
};

export default GameHeader;
