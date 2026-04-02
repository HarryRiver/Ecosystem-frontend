export default function Reviews() {
  const reviews = [
    {
      name: 'Nguyễn Minh Anh',
      avatar: '👩',
      rating: 5,
      comment: 'Dịch vụ tuyệt vời! Đội ngũ đến đúng giờ, làm việc chuyên nghiệp. Giá cả hợp lý so với chất lượng dịch vụ.',
      date: '2 ngày trước',
      service: 'Thu gom sofa cũ'
    },
    {
      name: 'Trần Văn Hùng',
      avatar: '👨',
      rating: 5,
      comment: 'Rất tiện lợi! Chỉ cần đặt lịch online, không cần gọi điện hay chờ đợi. Highly recommended!',
      date: '1 tuần trước',
      service: 'Thu gom tủ lạnh & máy giặt'
    },
    {
      name: 'Lê Thị Hương',
      avatar: '👩',
      rating: 5,
      comment: 'Tôi đã dọn nhà và có rất nhiều đồ cần bỏ. EcoCollect giúp tôi xử lý tất cả chỉ trong 1 ngày. Cảm ơn!',
      date: '2 tuần trước',
      service: 'Thu gom nhiều loại đồ'
    },
    {
      name: 'Phạm Quốc Bảo',
      avatar: '👨',
      rating: 4,
      comment: 'Nhân viên thân thiện, giá cả minh bạch. Đã giới thiệu cho bạn bè và gia đình.',
      date: '3 tuần trước',
      service: 'Thu gom giường cũ'
    },
    {
      name: 'Hoàng Mai Linh',
      avatar: '👩',
      rating: 5,
      comment: 'App dễ sử dụng, đặt lịch nhanh chóng. Đội ngũ rất chuyên nghiệp và nhiệt tình.',
      date: '1 tháng trước',
      service: 'Thu gom đồ điện tử'
    },
    {
      name: 'Đỗ Thanh Tùng',
      avatar: '👨',
      rating: 5,
      comment: 'Lần đầu sử dụng dịch vụ và rất hài lòng. Giá công khai ngay từ đầu, không phát sinh thêm.',
      date: '1 tháng trước',
      service: 'Thu gom bàn ghế văn phòng'
    }
  ];

  return (
    <section id="reviews" className="py-20 bg-[#F5FBF6]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block bg-[#2F855A]/10 text-[#2F855A] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            Customer experience
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#303030] mb-4">
            Đánh giá từ khách hàng
          </h2>
          <p className="text-gray-600 text-lg">
            Social proof và câu chuyện hoàn tất đơn hàng giúp khách tin vào toàn bộ flow, không chỉ riêng bước đặt lịch.
          </p>
        </div>

        <div className="mb-10 grid gap-4 rounded-[28px] border border-[#D6EEDD] bg-white p-6 shadow-[0_16px_40px_rgba(15,61,46,0.06)] md:grid-cols-4">
          {[
            'Đặt lịch trong 60 giây',
            'Nhận xác nhận và lịch hẹn',
            'Staff thu gom và phân loại',
            'Hoàn tất, đánh giá, tái chế',
          ].map((step, index) => (
            <div key={step} className="rounded-2xl bg-[#F7FCF8] p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#2F855A]">
                Step {index + 1}
              </div>
              <p className="text-sm font-medium text-[#103B2D]">{step}</p>
            </div>
          ))}
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2F855A] to-[#8DE0A6] rounded-full flex items-center justify-center text-2xl">
                    {review.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#303030]">{review.name}</h4>
                    <p className="text-xs text-gray-500">{review.date}</p>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${i < review.rating ? 'text-[#2F855A]' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>

              {/* Comment */}
              <p className="text-gray-600 mb-4">"{review.comment}"</p>

              {/* Service Tag */}
              <div className="inline-block bg-[#2F855A]/10 text-[#2F855A] px-3 py-1 rounded-full text-xs font-medium">
                {review.service}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 flex flex-wrap justify-center items-center gap-8">
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="font-bold text-[#303030]">4.9/5</div>
              <div className="text-xs">Điểm đánh giá</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="font-bold text-[#303030]">Top 1</div>
              <div className="text-xs">Dịch vụ thu gom</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-bold text-[#303030]">Verified</div>
              <div className="text-xs">Doanh nghiệp xanh</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="text-2xl">🔒</span>
            <div>
              <div className="font-bold text-[#303030]">Secure</div>
              <div className="text-xs">Thanh toán an toàn</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
