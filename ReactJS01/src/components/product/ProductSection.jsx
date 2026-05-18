import ProductCard from "./ProductCard";

export default function ProductSection({
  smallHeader,
  bigHeader,
  buttonText,
  productData,
}) {
  return (
    <>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-label text-orange-500 mb-1">{smallHeader}</p>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
              {bigHeader}
            </h3>
          </div>
          <Link
            to="/search"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition-colors"
          >
            {buttonText} <ArrowRightOutlined />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productData.length > 0 ? (
            productData.map((item) => (
              <ProductCard
                key={item._id}
                id={item._id}
                name={item.name}
                price={formatPrice(item.price)}
                image={item.images[0]}
                categoryName={item.categoryName}
                badge="New"
                rating={item.rating}
                sold={item.sold}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed">
              Chưa có món mới.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
