import React from "react";

const PaymentMethods = ({ paymentMethod, setPaymentMethod }) => {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
      <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
        Phương thức thanh toán
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => setPaymentMethod("COD")}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 relative ${
            paymentMethod === "COD"
              ? "border-orange-500 bg-orange-50/50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-800 text-sm">
              Thanh toán khi nhận hàng (COD)
            </span>
            <input
              type="radio"
              checked={paymentMethod === "COD"}
              onChange={() => {}}
              className="accent-orange-500 w-4 h-4"
            />
          </div>
          <p className="text-xs text-gray-400">
            Nhận hàng và thanh toán tiền mặt trực tiếp cho shipper.
          </p>
          <span className="text-2xl mt-1">💵</span>
        </div>

        <div
          onClick={() => setPaymentMethod("MOMO")}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 relative ${
            paymentMethod === "MOMO"
              ? "border-purple-600 bg-purple-50/30"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-800 text-sm">
              Ví Điện Tử MoMo (Sandbox)
            </span>
            <input
              type="radio"
              checked={paymentMethod === "MOMO"}
              onChange={() => {}}
              className="accent-purple-600 w-4 h-4"
            />
          </div>
          <p className="text-xs text-gray-400">
            Tích hợp thanh toán thật qua cổng thử nghiệm Sandbox của ví MoMo.
          </p>
          <span className="text-lg font-black text-purple-600 mt-1 flex items-center gap-1.5">
            <span className="w-6 h-6 bg-pink-500 text-white rounded-lg flex items-center justify-center text-xs font-bold font-sans">
              Mo
            </span>
            MoMo Payment
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
