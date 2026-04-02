interface BrandStoryProps {
  onBookingClick: () => void;
}

const storyBlocks = [
  {
    eyebrow: 'Về chúng tôi',
    title: 'Nền tảng thu gom rác theo hướng eco-tech cho đô thị hiện đại',
    description:
      'EcoCollect giúp khách hàng đặt lịch thu gom nhanh, minh bạch giá và theo dõi toàn bộ vòng đời xử lý rác từ lúc nhận đơn đến tái chế.',
  },
  {
    eyebrow: 'Sứ mệnh',
    title: 'Giảm rác chôn lấp, tăng tái sử dụng',
    description:
      'Mỗi đơn hàng đều được định tuyến để ưu tiên phân loại, tái chế và tái sử dụng thay vì chỉ vận chuyển đi đổ bỏ.',
  },
  {
    eyebrow: 'Điểm khác biệt',
    title: 'Đặt lịch dễ, báo giá rõ, trạng thái minh bạch',
    description:
      'Khách hàng biết mình đang trả tiền cho gì, nhân viên biết cần xử lý món gì, và admin có dữ liệu để tối ưu vận hành.',
  },
];

const uspCards = [
  {
    icon: '♻️',
    title: 'Xử lý xanh',
    text: 'Phân tuyến theo nhóm rác để tăng khả năng tái chế và giảm chôn lấp.',
  },
  {
    icon: '⚙️',
    title: 'Vận hành thông minh',
    text: 'Giá được ước tính theo loại rác, kích thước, đơn vị tính và độ phức tạp.',
  },
  {
    icon: '🔎',
    title: 'Minh bạch end-to-end',
    text: 'Khách hàng theo dõi được trạng thái từ đặt lịch, thu gom, xử lý đến hoàn tất.',
  },
];

export default function BrandStory({ onBookingClick }: BrandStoryProps) {
  return (
    <section id="about" className="bg-[#F5FBF6] py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-5">
            {storyBlocks.map((block) => (
              <article
                key={block.eyebrow}
                className="rounded-[28px] border border-[#D6EEDD] bg-white p-7 shadow-[0_20px_60px_rgba(15,61,46,0.08)]"
              >
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#2F855A]">
                  {block.eyebrow}
                </p>
                <h2 className="mb-3 text-2xl font-bold text-[#103B2D] md:text-3xl">
                  {block.title}
                </h2>
                <p className="max-w-2xl text-base leading-7 text-[#476458]">
                  {block.description}
                </p>
              </article>
            ))}
          </div>

          <aside className="rounded-[32px] border border-[#CFE7D7] bg-[#103B2D] p-8 text-white shadow-[0_24px_80px_rgba(16,59,45,0.24)]">
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#8DE0A6]">
                Why EcoCollect
              </p>
              <h3 className="text-3xl font-bold leading-tight">
                Một thương hiệu xanh nhưng vẫn mang cảm giác công nghệ và đáng tin.
              </h3>
            </div>

            <div className="space-y-4">
              {uspCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur-sm"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8DE0A6]/15 text-2xl">
                    {card.icon}
                  </div>
                  <h4 className="mb-2 text-lg font-semibold">{card.title}</h4>
                  <p className="text-sm leading-6 text-white/75">{card.text}</p>
                </div>
              ))}
            </div>

            <button
              onClick={onBookingClick}
              className="mt-8 w-full rounded-full bg-[#8DE0A6] px-6 py-4 text-sm font-bold text-[#103B2D] transition-transform duration-300 hover:-translate-y-0.5"
            >
              Đặt lịch trải nghiệm flow mới
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}
