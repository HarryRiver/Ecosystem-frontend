# EcoCollect

Landing page và booking flow cho dịch vụ thu gom rác, đồ cũ và phế thải cồng kềnh theo định hướng `eco-tech`.

Dự án hiện đang tập trung vào `frontend experience` với các luồng chính cho khách hàng: xem landing page, đặt lịch thu gom, nhập thông tin, chọn lịch hẹn, xác nhận đơn, và trải nghiệm đăng ký/đăng nhập tùy chọn.

## Mục tiêu dự án

EcoCollect được thiết kế để:

- giúp khách hàng đặt lịch thu gom nhanh, dễ hiểu, minh bạch giá
- thể hiện rõ định vị sản phẩm xanh, thân thiện môi trường
- hỗ trợ các trường hợp thu gom khác nhau như đồ nội thất, điện tử, rác đóng bao, phế thải xây dựng
- làm rõ nghiệp vụ để FE dev và BE dev có thể triển khai đồng bộ

## Tech Stack

Frontend hiện tại dùng:

- `Next.js 15` với `App Router`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `clsx`
- `tailwind-merge`

Kiến trúc hiện tại:

- `app/layout.tsx`: root layout của Next.js
- `app/page.tsx`: route trang chủ
- `src/App.tsx`: client app chính, điều phối landing page, booking modal và auth modal
- `src/index.css`: stylesheet global của dự án

## Nghiệp vụ FE hiện có

### 1. Landing page

Landing page là trang giới thiệu sản phẩm và điều hướng khách vào flow đặt lịch.

Các section chính:

- `Header`
  - logo EcoCollect
  - menu điều hướng
  - CTA `Đặt lịch ngay`
  - khu vực `Đăng nhập / Tạo tài khoản` hoặc thông tin user nếu đã login

- `Hero`
  - heading nhấn mạnh thông điệp môi trường
  - CTA chính `Đặt lịch ngay`
  - CTA phụ `Tạo tài khoản nhận ưu đãi` khi chưa đăng nhập
  - form booking nhanh trên banner
  - khối giải thích `guest checkout` hoặc quyền lợi thành viên

- `BrandStory`
  - về chúng tôi
  - sứ mệnh
  - điểm khác biệt

- `HowItWorks`
  - mô tả quy trình khách hàng từ chọn dịch vụ đến hoàn tất

- `WasteTypes`
  - giới thiệu các nhóm rác và đồ vật có thể thu gom

- `Pricing`
  - khối tham khảo giá

- `Reviews`
  - đánh giá và social proof

- `Footer`
  - CTA cuối trang

### 2. Form nhanh trên banner

Form nhanh trên hero không giống hoàn toàn với nút `Đặt lịch ngay`.

Nghiệp vụ:

- khách chọn nhanh `loại rác`
- nhập `địa chỉ thu gom`
- chọn `mục tiêu xử lý`
- bấm `Áp dụng thông tin này vào form chi tiết`

Kết quả:

- mở booking modal
- prefill trước một phần dữ liệu vào flow chi tiết:
  - từ khóa loại rác để hỗ trợ tìm kiếm ở step 1
  - địa chỉ vào thông tin liên hệ
  - mục tiêu xử lý vào ghi chú

Trong khi đó:

- nút `Đặt lịch ngay` chỉ mở booking modal theo cách bình thường
- không truyền sẵn dữ liệu từ form nhanh

### 3. Tài khoản khách hàng

Frontend hiện hỗ trợ UI cho:

- `Đăng nhập`
- `Đăng ký`
- `Đăng xuất`
- lời nhắc tạo tài khoản sau khi đặt đơn thành công

Nghiệp vụ account hiện tại:

- khách vẫn có thể đặt lịch mà không cần đăng nhập
- nếu có tài khoản thì hệ thống hiển thị quyền lợi thành viên
- nếu đã đăng nhập:
  - header hiển thị user hiện tại
  - hero không còn hiện block `guest checkout`
  - booking flow sẽ tự điền sẵn một phần thông tin cá nhân

Lưu ý:

- phần auth hiện tại là `UI mock`
- chưa kết nối API thật cho login/register/session

### 4. Booking flow chi tiết

Booking flow hiện triển khai qua `BookingModal` với 4 bước:

#### Step 1: Chọn dịch vụ

Khách có thể:

- tìm kiếm vật phẩm
- lọc theo category
- chọn một hoặc nhiều hạng mục
- tăng giảm số lượng với các món tính theo món
- nhập trực tiếp số `kg` cho `Phế thải xây dựng`
- nhập tên món với `Hạng mục khác`
- upload ảnh vật cần chuyển

Nhóm dịch vụ hiện có:

- Nội thất
  - Sofa đơn
  - Sofa đôi / góc L
  - Tủ quần áo
    - có variant `Nhỏ / Tiêu chuẩn / Khổ lớn`
  - Tủ bếp / tủ giày
  - Giường / nệm

- Điện tử
  - Tivi
  - Tủ lạnh
  - Máy giặt
  - Máy lạnh cũ

- Khác
  - Bàn / ghế văn phòng
  - Rác sinh hoạt đóng bao
  - Phế thải xây dựng
  - Hạng mục khác

Rule FE:

- phải chọn ít nhất 1 dịch vụ
- phải tải ít nhất 1 ảnh
- nếu là `Phế thải xây dựng` thì `kg > 0`
- nếu là `Hạng mục khác` thì phải nhập tên món
- chỉ khi hợp lệ mới sang được step 2

#### Step 2: Thông tin khách hàng và địa chỉ

Field hiện có:

- tên khách hàng
- số nhà, tên đường
- quận / huyện
- thành phố
- số điện thoại
- email
- ghi chú thêm

Rule FE:

- validate realtime
- hiển thị lỗi inline
- không cho sang step 3 nếu thiếu hoặc sai dữ liệu

Các kiểm tra chính:

- tên tối thiểu 2 ký tự
- địa chỉ đủ dữ liệu
- số điện thoại đúng định dạng Việt Nam
- email hợp lệ

Ngoài ra:

- nếu user đã đăng nhập thì hiển thị khối thông tin member
- nếu guest thì hiển thị block gợi ý login/register

#### Step 3: Chọn ngày và khung giờ

Khách chọn:

- ngày thu gom
- khung giờ

Rule FE:

- chưa chọn đủ thì không sang được step 4

#### Step 4: Xác nhận đơn hàng

Hiển thị:

- danh sách hạng mục đã chọn
- thông tin khách hàng
- địa chỉ
- ngày và khung giờ
- tóm tắt giá

Khách phải chọn:

- `Cách bốc xếp / tiếp cận hàng`
  - vào tận nhà bê đồ
  - để đồ bên ngoài
  - vác đồ thang bộ

- `Phương thức thanh toán`
  - thanh toán khi thu gom
  - thanh toán online

Rule FE hiện có:

- `Để đồ bên ngoài`: giảm phí
- `Vác đồ thang bộ`: cộng phí theo số tầng
- nếu chọn `Thanh toán khi thu gom` thì phải tick xác nhận chính sách no-show

Ngoài ra:

- nếu guest thì step 4 tiếp tục gợi ý tạo tài khoản cho lần đặt sau
- nếu member thì hiển thị quyền lợi account

### 5. Màn hình thành công

Sau khi submit thành công, FE hiển thị:

- thông báo đặt lịch thành công
- email nhận xác nhận
- tóm tắt đơn
- nếu chưa có account thì gợi ý:
  - tạo tài khoản
  - hoặc đăng nhập nếu đã có account

Lưu ý:

- submit hiện tại là mô phỏng bằng state local
- chưa gọi API backend thật

## Trạng thái triển khai hiện tại

Phần đã có:

- UI landing page hoàn chỉnh
- booking modal 4 bước
- validate FE cho các bước chính
- prefill dữ liệu từ form nhanh
- auth modal cho login/register
- trạng thái logged-in giả lập trên frontend

Phần chưa có hoặc mới là mock:

- API backend thật
- database
- xác thực tài khoản thật
- upload ảnh lên storage thật
- thanh toán online thật
- dashboard cho admin/staff
- email/SMS thật

## Cấu trúc thư mục chính

```bash
app/
  layout.tsx
  page.tsx

src/
  App.tsx
  index.css
  utils/
    cn.ts
  components/
    AuthModal.tsx
    BookingModal.tsx
    Header.tsx
    Hero.tsx
    BrandStory.tsx
    HowItWorks.tsx
    WasteTypes.tsx
    Pricing.tsx
    Reviews.tsx
    Footer.tsx
```

## Cài đặt và chạy dự án

### Yêu cầu môi trường

Khuyến nghị:

- `Node.js >= 20`
- `npm >= 10`

### Cài đặt

```bash
npm install
```

### Chạy môi trường development

```bash
npm run dev
```

Mặc định app chạy tại:

```bash
http://localhost:3000
```

### Build production

```bash
npm run build
```

### Chạy production local

```bash
npm run start
```

## Scripts

```bash
npm run dev
npm run build
npm run start
```

## Hướng phối hợp với BE

Để nối FE với backend, BE cần chuẩn bị tối thiểu các nhóm API:

- auth
  - register
  - login
  - logout
  - me

- services
  - lấy catalog dịch vụ
  - lấy variants

- pricing
  - tính báo giá tạm thời

- orders
  - tạo đơn
  - upload ảnh
  - lấy chi tiết đơn
  - hủy đơn

- payments
  - tạo payment intent
  - callback thanh toán

- vouchers
  - danh sách voucher theo account

## Ghi chú cho dev

- Dự án dùng `Next.js App Router` nhưng phần giao diện chính hiện chạy qua `src/App.tsx` như một client component.
- CSS đang được giữ nguyên trong `src/index.css`.
- Nếu mở rộng backend thật, nên tách dần:
  - data fetching
  - auth state
  - API integration
  - booking submit

## Định hướng bước tiếp theo

Các bước hợp lý tiếp theo:

- nối auth thật với backend
- nối quote API cho booking
- tạo order API và upload ảnh thật
- thêm dashboard admin/staff
- thêm tracking trạng thái đơn
- thêm email xác nhận và voucher member
