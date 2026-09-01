import React from 'react';
import { Card, Typography, Button } from 'antd';

const { Title, Text } = Typography;

const GameCard = ({
  question,
  result,
  submitting,
  selectedOption,
  handleSelectOption,
  fetchQuestion,
}) => {
  const getButtonClass = (option) => {
    const baseClass = 'w-full text-lg h-12 rounded-xl font-semibold shadow-sm ';
    if (!result) {
      return (
        baseClass +
        'border border-gray-200 bg-white text-gray-700 hover:bg-orange-50 transition-all hover:scale-[1.02] active:scale-95'
      );
    }

    if (result.correctName === option) {
      return (
        baseClass +
        'bg-green-500 hover:bg-green-600 text-white border-none animate-pulse shadow-lg ring-2 ring-green-300 ring-offset-2'
      );
    }
    if (selectedOption === option && !result.isCorrect) {
      return (
        baseClass +
        'bg-red-500 hover:bg-red-600 text-white border-none line-through opacity-80 ring-2 ring-red-300 ring-offset-2'
      );
    }
    return (
      baseClass + 'border border-gray-200 bg-gray-50 text-gray-400 opacity-50 cursor-not-allowed'
    );
  };

  return (
    <Card
      className='shadow-2xl rounded-3xl overflow-hidden border-none backdrop-blur-md bg-white/95'
      styles={{ body: { padding: '2rem' } }}
    >
      <div className='relative group mb-8 rounded-2xl overflow-hidden shadow-inner border border-gray-100 bg-gray-50'>
        {question.image ? (
          <img
            src={`${question.image}`}
            alt='Food'
            className='w-full h-80 object-cover transform transition-transform duration-700 group-hover:scale-105'
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/600x400?text=Hình+ảnh+lỗi';
            }}
          />
        ) : (
          <div className='w-full h-80 flex items-center justify-center text-gray-400'>
            Không có hình ảnh
          </div>
        )}

        <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4'>
          <Text className='text-white font-medium text-lg tracking-wide drop-shadow-md'>
            Nhìn ngon quá nhỉ? 😋
          </Text>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelectOption(option)}
            disabled={result !== null || submitting}
            className={getButtonClass(option)}
            style={result ? {} : { transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {option}
          </button>
        ))}
      </div>

      {result && (
        <div className='mt-8 text-center animate-[fadeIn_0.5s_ease-out]'>
          {result.isCorrect ? (
            <div className='p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-sm'>
              <Title level={3} className='!text-green-600 !mb-2'>
                🎉 Xuất sắc! 🎉
              </Title>
              <Text className='text-green-700 font-medium text-lg block'>
                Bạn nhận được{' '}
                <span className='font-bold text-3xl mx-1 text-green-500 drop-shadow-sm'>
                  +{result.coinsEarned}
                </span>{' '}
                xu
              </Text>
            </div>
          ) : (
            <div className='p-5 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200 shadow-sm'>
              <Title level={3} className='!text-red-600 !mb-2'>
                Rất tiếc!
              </Title>
              <Text className='text-red-700 font-medium text-lg'>
                Tên món đúng là:{' '}
                <span className='font-bold block mt-1 text-xl'>{result.correctName}</span>
              </Text>
            </div>
          )}

          <Button
            type='primary'
            size='large'
            className='mt-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-none h-12 px-10 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1'
            onClick={fetchQuestion}
          >
            Chơi tiếp
          </Button>
        </div>
      )}
    </Card>
  );
};

export default GameCard;
