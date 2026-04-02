interface HowItWorksProps {
  onBookingClick: () => void;
}

export default function HowItWorks({ onBookingClick }: HowItWorksProps) {
  const steps = [
    {
      number: '01',
      icon: '📋',
      title: 'Chọn loại rác',
      description: 'Chọn nhóm rác, size và đơn vị tính. Nếu không có trong danh sách, gửi yêu cầu riêng kèm ảnh.',
      color: 'bg-[#2F855A]'
    },
    {
      number: '02',
      icon: '📍',
      title: 'Nhập địa chỉ & thời gian',
      description: 'Hệ thống kiểm tra địa chỉ, xác nhận thời gian phù hợp và hiển thị ghi chú vận hành cần thiết.',
      color: 'bg-[#1D8F6A]'
    },
    {
      number: '03',
      icon: '🧾',
      title: 'Xác nhận báo giá',
      description: 'Giá được ước tính ngay với các món chuẩn, còn món đặc biệt sẽ chuyển sang chế độ cần báo giá.',
      color: 'bg-[#245F49]'
    },
    {
      number: '04',
      icon: '💸',
      title: 'Thanh toán / chốt đơn',
      description: 'Khách xác nhận phương thức thanh toán, admin hoặc staff tiếp nhận và chốt lịch thu gom.',
      color: 'bg-[#103B2D]'
    },
    {
      number: '05',
      icon: '🔎',
      title: 'Theo dõi & hoàn tất',
      description: 'Khách hàng theo dõi trạng thái thu gom, xử lý và đánh giá sau khi đơn hoàn thành.',
      color: 'bg-[#0B2F24]'
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#EEF8F1]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block rounded-full bg-[#2F855A]/10 px-4 py-1.5 text-sm font-semibold text-[#2F855A] mb-4">
            UX flow end-to-end
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#303030] mb-4">
            Cách hoạt động
          </h2>
          <p className="text-gray-600 text-lg">
            Flow được thiết kế để vừa dễ đặt lịch cho khách hàng, vừa đủ dữ liệu cho vận hành và xử lý xanh.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden xl:block absolute top-16 left-[65%] w-full h-0.5 bg-gradient-to-r from-[#2F855A] to-[#8DE0A6]"></div>
              )}

              <div className="relative z-10 rounded-[28px] border border-[#D6EEDD] bg-white p-8 shadow-[0_18px_45px_rgba(16,59,45,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(16,59,45,0.12)]">
                {/* Step Number */}
                <div className={`${step.color} w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {step.icon}
                </div>

                {/* Step Badge */}
                <div className="absolute top-6 right-6 text-gray-200 font-bold text-5xl">
                  {step.number}
                </div>

                <h3 className="text-xl font-bold text-[#303030] mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button
            onClick={onBookingClick}
            className="inline-flex items-center space-x-2 rounded-full bg-[#103B2D] px-8 py-4 text-lg font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <span>Bắt đầu ngay</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
