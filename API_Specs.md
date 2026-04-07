# Tài Liệu Đặc Tả API (API Specification) Toàn Dự Án - EcoCollect

Tài liệu này mô tả chi tiết toàn bộ các API dành cho Frontend (FE) của cả phía **Customer (Khách hàng)** và **Admin Panel**, bao hàm toàn bộ luồng nghiệp vụ hệ thống.

---

## I. CẤU TRÚC RESPONSE CHUẨN (GLOBAL)
Tất cả các API tuân thủ định dạng response sau:
**Thành công (20x)**:
```json
{
  "success": true,
  "data": { ... }, // Object hoặc Mảng
  "message": "Thông báo (nếu có)",
  "error_code": null
}
```

**Thất bại (40x, 50x)**:
```json
{
  "success": false,
  "data": null,
  "message": "Mô tả lỗi chi tiết cho người dùng",
  "error_code": "ERROR_CODE_ENUM" // Ví dụ: VALIDATION_ERROR, UNAUTHORIZED, ITEM_OUT_OF_STOCK
}
```
**Auth**: Dùng `Authorization: Bearer <token>` trên Header.

---

## II. AUTH API (Xác thực & Danh tính)

### 1. Khách Hàng Đăng Ký
- **Endpoint**: `POST /auth/register`
- **Body**: `{ "full_name": "Nguyen A", "phone": "0123456789", "email": "a@gmail.com", "password": "..." }`
- **Response**: Trả về `access_token` và thông tin `user`.

### 2. Đăng Nhập (Customer & Admin)
- **Endpoint**: `POST /auth/login`
- **Body**: `{ "identity": "0123456789", "password": "..." }` // identity = phone/email
- **Response**: Trả về `access_token` và `user` object có chứa `role` (customer | admin). Nếu là admin mà FE đang ở web customer thì có thể chặn hoặc chuyển hướng.

### 3. Đăng Xuất
- **Endpoint**: `POST /auth/logout`

---

## III. CUSTOMER API (Dành Cho Khách Hàng)

### 1. Tài Khoản & Thông Tin
- **`GET /me`**: Lấy thông tin cá nhân.
- **`PATCH /me`**: Cập nhật thông tin cá nhân hiện tại.
- **`GET /me/orders`**: Lấy lịch sử đơn hàng của mình. (Query: `?status=completed&page=1&limit=10`)

### 2. Catalog Dịch Vụ & Lịch Hẹn (Public)
- **`GET /services`**: Danh sách tất cả service khả dụng kèm theo `variants` của chúng.
- **`GET /time-slots`**: Lấy danh sách khung giờ trống. FE kết hợp truyền ngày `?date=YYYY-MM-DD` để BE trả về trạng thái `is_full` cho từng slot.

### 3. Báo Giá & Đặt Đơn Hàng (Core)
- **`POST /pricing/quote`**: API Báo giá tạm tính.
  - **Body**: Truyền danh sách `items` (gồm: `service_id`, `variant_id`, `quantity`, `measurement_value`, `custom_item_name`), thông tin bậc thang `handling_mode` (inside/outside/stairs), `stairs_floors`, và `voucher_code`.
  - **Response**: Trả về chi tiết `service_subtotal`, `handling_fee`, `discount_amount`, `estimated_total` và cờ bắt buộc `manual_quote_required`.
- **`POST /orders`**: Khởi tạo đơn hàng (Hỗ trợ cả Guest mode không cần đăng nhập).
  - **Body**: Gồm `customer` (name, phone, email), `address` (chi tiết tỉnh/huyện/xã/số nhà), `booking_date`, `time_slot_id`, `items`, cấu hình nhận giá (như API Quote) và `payment_method` (online/cash).
  - Yêu cầu `cash_policy_accepted`: boolean.
- **`GET /orders/{id}`**: Lấy chi tiết một đơn hàng, các `order_items` và timeline trạng thái đơn.
- **`POST /orders/{id}/images`**: Customer upload ảnh rác/đồ cồng kềnh (Form-Data: `images`, `image_role='before'`).
- **`POST /orders/{id}/cancel`**: Yêu cầu hủy đơn. Body: `{ "reason": "..." }`.

### 4. Thanh Toán (Payment)
- **`POST /orders/{id}/payment-intent`**: Tạo link thanh toán online cho đơn. Trả về URLs để FE redirect khách đi thanh toán.
- **`POST /payments/callback`**: Nhận webhook tự động từ bên thứ 3 (ZaloPay, Momo, Stripe). BE tự đổi trạng thái.

### 5. Thông Báo Của Khách (Notifications)
- **`GET /me/notifications`**: Lấy danh sách thông báo.
- **`GET /me/notifications/unread-count`**: Đếm số thông báo chưa đọc.
- **`PATCH /me/notifications/{id}/read`**: Đánh dấu đã đọc 1 thông báo.
- **`POST /me/notifications/read-all`**: Đánh dấu đã đọc tất cả.

---

## IV. ADMIN API (Dành Cho Trang Quản Trị)

*(Admin cần truyền `Authorization` Token có role='admin')*

### 1. Dashboard & Thống kê
- **`GET /admin/metrics`**: 
  - Query: `?date_from=2026-04-01&date_to=2026-04-30`
  - Báo cáo trả về: Tổng số đơn, Số đơn hôm nay, Doanh thu, Số đơn theo trạng thái (Pie chart data), Tỷ lệ hoàn thành, Thời gian biểu đồ doanh số, Top dịch vụ.

### 2. Quản Lý Đơn Hàng (Orders)
- **`GET /admin/orders`**: Danh sách đơn hàng toàn hệ thống.
  - Query filters: `?search=order_code,phone&status=confirmed&date_from=&date_to=&district=`
- **`GET /admin/orders/{id}`**: Chi tiết đơn y như bên Customer nhưng có thêm ghi chú nội bộ (internal_notes) và phân công nhân viên nếu có.
- **`PATCH /admin/orders/{id}`**: 
  - Cập nhật thông tin đơn hàng chuyên sâu.
  - Cập nhật trạng thái: `status` (Đổi draft -> pending -> confirmed -> completed).
  - Đóng chốt giá cuối: `final_total` (Bắt buộc kèm `adjustment_reason` nếu giá đổi).
  - Note thêm `internal_notes`.
- **`POST /admin/orders/{id}/mark-no-show`**: Ghi nhận đơn hàng bị khách bùng. Kích hoạt logic đếm count cho khách.

### 3. Quản Lý Dịch Vụ (Services)
- **`GET /admin/services`**: Lọc và hiển thị danh sách service.
- **`POST /admin/services`**: Tạo mới (cung cấp code, name, pricing_type, base_price, default_unit...).
- **`PATCH /admin/services/{id}`**: Cập nhật (đổi tên, giá cơ bản, ẩn hiển dịch vụ bằng cờ `active`).

### 4. Quản Lý Biến Thể Dịch Vụ (Service Variants)
- **`GET /admin/services/{serviceId}/variants`**: Lấy tất cả biến thể của 1 dịch vụ.
- **`POST /admin/services/{serviceId}/variants`**: Thêm mới biến thể (Ví dụ: Thêm size "Khổng lồ" cho Sofa).
- **`PATCH /admin/service-variants/{id}`**: Cập nhật giá, label, bật/tắt biến thể.

### 5. Quản Lý Khung Giờ (Time Slots)
- **`GET /admin/time-slots`**: Admin lấy danh sách khung giờ (Bao gồm slot đã tắt).
- **`POST /admin/time-slots`**: Tạo khung giờ mới (start_time, end_time, max_orders).
- **`PATCH /admin/time-slots/{id}`**: Chỉnh sửa / Bật, tắt nhanh (active).

### 6. Quản Lý Người Dùng & Khách Hàng (Users)
- **`GET /admin/users`**: Lọc danh sách khách hàng (Query: `?role=customer&search=&is_blacklisted=true`).
- **`GET /admin/users/{id}`**: Chi tiết thông cá nhân, lịch sử đơn hàng, chỉ số bùng đơn (`no_show_count`).
- **`PATCH /admin/users/{id}`**: 
  - Bật/tắt `prepaid_required`: Bắt buộc thanh toán trước do bùng nhiều lần.
  - Bật/tắt `is_blacklisted`: Chặn khách.
  - Thay đổi `status`: Active / Inactive / Locked.

### 7. Quản Lý Payment (Giao dịch)
- **`GET /admin/payments`**: Danh sách lịch sử thanh toán toàn hệ thống (Dùng để đối soát). Lọc theo `method`, `status`, `provider_ref`.

### 8. Quản Lý Voucher (Khuyến Mãi)
- **`GET /admin/vouchers`**: Danh sách mã quy đổi.
- **`POST /admin/vouchers`**: Tạo mã. (Body: `code`, `type=percent/fixed`, `value`, `max_discount`, `min_order_value`, `usage_limit`, `start_date`, `end_date`).
- **`PATCH /admin/vouchers/{id}`**: Update giá trị / Tắt voucher (đổi trạng thái `active`).

### 9. Quản Lý Notification (Broadcast)
- **`GET /admin/notifications`**: Các thông báo hệ thống / hoạt động khách dành riêng cho Admin đọc.
- **`GET /admin/notifications/unread-count`**: Admin đếm thông báo chờ xử lý.
- **`PATCH /admin/notifications/{id}/read`**: Đánh dấu đã đọc.
- **`POST /admin/notifications/send`**: Tool để Admin gửi Push Notification Broadcast hàng loạt hoặc chỉ đích danh một user qua `user_id`. (Sử dụng cho CRM/Marketing).

---

## V. CÁC QUY TẮC NGHIỆP VỤ (BUSINESS RULES) QUAN TRỌNG KHI GỌI API

1. **Guest Checkout Workflow**: Chức năng order hoàn toàn có thể truyền header rỗng (không gắn Bearer). Hệ thống tự định danh dựa vào Số điện thoại. FE phải làm màn checkout sao cho kể cả Guest cũng phải nhập số điện thoại + tên.
2. **Snapshot Mechanism**: Ở API Admin xem đơn hàng (`GET /admin/orders/{id}`), tên dịch vụ là text cố định lấy từ `order_items` lúc order tạo ra chứ không join móc vào bảng `services` nữa. Frontend cứ render text backend trả là an toàn.
3. **Luôn Báo Giá (Quote) trên BE**: Ở màn hình giỏ hàng của khách, ngay khi khách tăng qty, chọn phụ phí cầu thang, FE CẦN call debounce (vd delay 500ms) lên hàm `POST /pricing/quote` để backend nhả lại số tiền gốc, tiền phụ thu, tiền đã trừ mã giảm giá. FE tuyệt đối không tự tính.
4. **Phụ phí (Handling Mode) cho FE xử lý form**: FE hiển thị 1 block, có 3 option: `Vận chuyển trong nhà (inside - Miễn phí)`, `Đã mang ra ngoài cửa (outside - Giảm giá)`, `Di chuyển bằng cầu thang rườm rà (stairs - Tính phụ phí)`. Nếu chọn stairs, show thêm ô nhập số tầng `stairs_floors`.
5. **No Show Rule**: Nút `Đánh dấu No Show` ở màn hình Admin Order Details (gọi API `POST /admin/orders/{id}/mark-no-show`) sẽ làm khách bị +1 vào `no_show_count`. Nếu vi phạm quá mức, khách chỉ được thanh toán `online`. FE ở App User nếu thấy `prepaid_required` thì ẩn nút Cash đi. 
