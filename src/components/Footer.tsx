interface FooterProps {
  onBookingClick: () => void;
}

export default function Footer({ onBookingClick }: FooterProps) {
  return (
    <footer className="bg-[#0D3126] text-white">
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#1F6A4E] to-[#103B2D] py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Sẵn sàng chuyển sang trải nghiệm thu gom xanh hơn?
          </h2>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            Đặt lịch ngay hôm nay để trải nghiệm flow báo giá minh bạch, phân loại rõ ràng và vận hành thân thiện với môi trường.
          </p>
          <button
            onClick={onBookingClick}
            className="bg-[#8DE0A6] text-[#103B2D] hover:bg-[#A7EDBA] px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:shadow-lg hover:scale-105"
          >
            Đặt lịch ngay - Miễn phí báo giá
          </button>
        </div>
      </div>

      {/* Main Footer */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-[#8DE0A6] rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">♻️</span>
                </div>
                <span className="text-white font-bold text-xl">EcoCollect</span>
              </div>
              <p className="text-gray-400 mb-6">
                Dịch vụ thu gom rác chuyên nghiệp, nhanh chóng và thân thiện với môi trường.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-[#8DE0A6] rounded-full flex items-center justify-center transition-colors">
                  <span>📘</span>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-[#8DE0A6] rounded-full flex items-center justify-center transition-colors">
                  <span>📸</span>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-[#8DE0A6] rounded-full flex items-center justify-center transition-colors">
                  <span>🐦</span>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-[#8DE0A6] rounded-full flex items-center justify-center transition-colors">
                  <span>📺</span>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Liên kết nhanh</h4>
              <ul className="space-y-3">
                <li><a href="#home" className="text-gray-400 hover:text-[#8DE0A6] transition-colors">Trang chủ</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-[#8DE0A6] transition-colors">Về chúng tôi</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-[#8DE0A6] transition-colors">Cách hoạt động</a></li>
                <li><a href="#waste-types" className="text-gray-400 hover:text-[#8DE0A6] transition-colors">Loại rác nhận</a></li>
                <li><a href="#reviews" className="text-gray-400 hover:text-[#8DE0A6] transition-colors">Đánh giá</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-semibold mb-4">Dịch vụ</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-[#8DE0A6] transition-colors">Thu gom đồ nội thất</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#8DE0A6] transition-colors">Thu gom điện tử</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#8DE0A6] transition-colors">Xử lý rác sinh hoạt</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#8DE0A6] transition-colors">Thu gom phế thải xây dựng</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#8DE0A6] transition-colors">Tái chế & xử lý</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
              <ul className="space-y-3">
                <li className="flex items-center space-x-2 text-gray-400">
                  <span>📍</span>
                  <span>12 Nguyễn Huệ, Quận 1, TP.HCM</span>
                </li>
                <li className="flex items-center space-x-2 text-gray-400">
                  <span>📞</span>
                  <span>0901 234 567</span>
                </li>
                <li className="flex items-center space-x-2 text-gray-400">
                  <span>📧</span>
                  <span>hello@ecocollect.vn</span>
                </li>
                <li className="flex items-center space-x-2 text-gray-400">
                  <span>⏰</span>
                  <span>Mon-Sun: 8:00 - 20:00</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm">
            <p>© 2024 EcoCollect. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-[#8DE0A6] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#8DE0A6] transition-colors">Terms & Conditions</a>
              <a href="#" className="hover:text-[#8DE0A6] transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
