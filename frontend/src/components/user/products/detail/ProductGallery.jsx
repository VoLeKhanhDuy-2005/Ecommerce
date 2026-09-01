import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade, Thumbs } from 'swiper/modules';
import { FireOutlined } from '@ant-design/icons';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/thumbs';

const ProductGallery = ({ product }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  return (
    <div className='w-full lg:w-1/2 space-y-3'>
      <div className='rounded-2xl overflow-hidden bg-amber-50 border border-gray-100 relative'>
        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectFade, Thumbs]}
          effect='fade'
          navigation
          pagination={{ clickable: true, dynamicBullets: true }}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          thumbs={{
            swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          className='w-full h-80 sm:h-[420px]'
        >
          {product.images?.length > 0 ? (
            product.images.map((img, idx) => (
              <SwiperSlide key={idx}>
                <img
                  src={img}
                  alt={`${product.name} ảnh ${idx + 1}`}
                  className='w-full h-full object-cover'
                />
              </SwiperSlide>
            ))
          ) : (
            <SwiperSlide>
              <div className='w-full h-full flex items-center justify-center bg-amber-50 text-6xl'>
                🍽️
              </div>
            </SwiperSlide>
          )}
        </Swiper>
      </div>

      {product.images?.length > 1 && (
        <Swiper
          modules={[Thumbs]}
          onSwiper={setThumbsSwiper}
          spaceBetween={8}
          slidesPerView={Math.min(product.images.length, 4)}
          watchSlidesProgress
          className='thumbs-swiper'
        >
          {product.images.map((img, idx) => (
            <SwiperSlide key={idx}>
              <div className='h-20 rounded-xl overflow-hidden border-2 border-transparent cursor-pointer hover:border-orange-400 transition-colors'>
                <img src={img} alt={`thumb ${idx}`} className='w-full h-full object-cover' />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};

export default ProductGallery;
