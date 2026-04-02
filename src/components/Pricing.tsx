interface PricingProps {
  onBookingClick: () => void;
}

export default function Pricing({ onBookingClick }: PricingProps) {
  const pricingItems = [
    { item: 'Sofa đôi / góc L', price: 'Từ 250.000đ' },
    { item: 'Tủ quần áo cỡ lớn', price: 'Từ 360.000đ' },
    { item: 'TV / màn hình', price: 'Từ 100.000đ' },
    { item: 'Giường đôi + nệm', price: 'Từ 320.000đ' },
    { item: 'Máy giặt / tủ lạnh', price: 'Từ 180.000đ' },
    { item: 'Phế thải xây dựng', price: 'Từ 80.000đ/bao' },
  ];

  return (
    <section id="pricing" className="relative overflow-hidden bg-gradient-to-br from-[#103B2D] to-[#1D5A45] py-20">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#8DE0A6] opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-white opacity-10 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            Giá cả minh bạch
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bảng giá tham khảo
          </h2>
          <p className="text-white/80 text-lg">
            Giá được chuẩn hóa theo loại rác, size và đơn vị tính để hạn chế phát sinh.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Pricing Table */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-[#303030] mb-6 flex items-center">
              <span className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2F855A] text-white">
                💰
              </span>
              Giá theo loại đồ
            </h3>

            <div className="space-y-4">
              {pricingItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-700">{item.item}</span>
                  <span className="font-bold text-[#2F855A]">{item.price}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#F4F4F4] rounded-xl">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-[#2F855A]">💡 Lưu ý:</span> Các hạng mục đặc biệt như phế thải xây dựng hoặc món ngoài danh sách sẽ chuyển sang chế độ cần báo giá.
              </p>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6">
              Tại sao chọn chúng tôi?
            </h3>

            <div className="space-y-5">
              {[
                { icon: '⚡', title: 'Giá real-time', desc: 'Xem giá ngay khi chọn đồ' },
                { icon: '🚚', title: 'Miễn phí vận chuyển', desc: 'Trong bán kính 10km' },
                { icon: '♻️', title: 'Xử lý xanh', desc: '90% được tái chế hoặc tái sử dụng' },
                { icon: '📱', title: 'Thanh toán dễ dàng', desc: 'Swish, thẻ, hoặc chuyển khoản' },
                { icon: '🎯', title: 'Đúng giờ', desc: 'Cam kết đến đúng khung giờ đã chọn' },
                { icon: '🛡️', title: 'Bảo hiểm đầy đủ', desc: 'An tâm với dịch vụ chuyên nghiệp' },
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#8DE0A6] text-xl">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{item.title}</h4>
                    <p className="text-white/70 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button
            onClick={onBookingClick}
            className="inline-flex items-center space-x-2 rounded-full bg-[#8DE0A6] px-10 py-4 text-lg font-bold text-[#103B2D] transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <span>Nhận báo giá ngay</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
