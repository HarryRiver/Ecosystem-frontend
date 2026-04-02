interface WasteTypesProps {
  onBookingClick: () => void;
}

export default function WasteTypes({ onBookingClick }: WasteTypesProps) {
  const wasteTypes = [
    {
      icon: '🛋️',
      name: 'Sofa & Ghế',
      description: 'Có chọn size đơn, đôi hoặc góc L',
      price: 'Từ 150.000đ / món',
      items: ['Sofa 2-3 chỗ', 'Ghế bành', 'Ghế gaming', 'Ghế văn phòng']
    },
    {
      icon: '🗄️',
      name: 'Tủ & Kệ',
      description: 'Tách theo kích thước nhỏ, vừa, lớn',
      price: 'Từ 180.000đ / món',
      items: ['Tủ quần áo', 'Tủ bếp', 'Kệ sách', 'Tủ giày']
    },
    {
      icon: '📺',
      name: 'Đồ điện tử',
      description: 'TV, máy tính, tủ lạnh, máy giặt',
      price: 'Từ 100.000đ / món',
      items: ['TV & Màn hình', 'Máy tính', 'Tủ lạnh', 'Máy giặt']
    },
    {
      icon: '🧱',
      name: 'Phế thải xây dựng',
      description: 'Tính theo bao, kg hoặc khối lượng ước tính',
      price: 'Từ 80.000đ / bao',
      items: ['Xà bần', 'Gạch vỡ', 'Xi măng', 'Tấm trần']
    },
    {
      icon: '🪑',
      name: 'Bàn & Đồ gỗ',
      description: 'Bàn ăn, bàn làm việc, ghế và đồ gỗ rời',
      price: 'Từ 120.000đ / món',
      items: ['Bàn ăn', 'Bàn làm việc', 'Bàn coffee', 'Tủ TV']
    },
    {
      icon: '✨',
      name: 'Món ngoài danh sách',
      description: 'Khách có thể mô tả riêng và upload ảnh',
      price: 'Cần báo giá',
      items: ['Bàn ăn', 'Cũi trẻ em', 'Xe máy điện', 'Biển quảng cáo']
    }
  ];

  return (
    <section id="waste-types" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block rounded-full bg-[#2F855A]/10 px-4 py-1.5 text-sm font-semibold text-[#2F855A] mb-4">
            Service selection rõ ràng hơn
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#303030] mb-4">
            Loại rác chúng tôi nhận
          </h2>
          <p className="text-gray-600 text-lg">
            Mỗi nhóm rác đều có logic báo giá riêng để UX rõ ràng hơn và nghiệp vụ dễ xử lý hơn.
          </p>
        </div>

        {/* Waste Types Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {wasteTypes.map((type, index) => (
            <div
              key={index}
              className="group cursor-pointer rounded-[28px] border border-[#D6EEDD] bg-[#F7FCF8] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#2F855A] hover:shadow-[0_18px_45px_rgba(16,59,45,0.08)]"
              onClick={onBookingClick}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm transition-transform duration-300 group-hover:scale-110">
                  {type.icon}
                </div>
                <span className="rounded-full bg-[#E7F8EC] px-3 py-1 text-sm font-bold text-[#2F855A] transition-colors">
                  {type.price}
                </span>
              </div>

              <h3 className="mb-2 text-xl font-bold text-[#103B2D]">
                {type.name}
              </h3>
              <p className="mb-4 text-gray-600">
                {type.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {type.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-white px-2 py-1 text-xs text-[#24483A]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm font-medium text-[#476458]">
                  Click để mở flow đặt lịch
                </span>
                <span className="text-sm font-bold text-[#2F855A]">Chọn dịch vụ</span>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 rounded-[28px] border border-[#D6EEDD] bg-[#103B2D] px-6 py-7 text-white max-w-5xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#A7E8B6]">
                Special case handling
              </p>
              <h3 className="text-2xl font-bold">Không thấy món của bạn trong danh sách?</h3>
              <p className="mt-2 max-w-2xl text-white/75">
                Flow mới cho phép nhập mô tả riêng, gửi ảnh và chuyển item sang chế độ cần báo giá thay vì buộc khách phải chọn sai danh mục.
              </p>
            </div>
            <button
              onClick={onBookingClick}
              className="rounded-full bg-[#8DE0A6] px-6 py-3 font-semibold text-[#103B2D]"
            >
              Gửi yêu cầu đặc biệt
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
