# Thiết Kế Database PostgreSQL Cho EcoCollect

## Tóm tắt
Thiết kế database dùng `PostgreSQL` theo hướng `OLTP-first`, ưu tiên:
- chuẩn hóa đủ cho booking, payment, staff ops, admin ops
- snapshot dữ liệu quan trọng tại thời điểm tạo đơn để không lệ thuộc catalog sau này
- audit log rõ ràng cho trạng thái, giá, thanh toán, no-show
- vẫn đủ linh hoạt cho reporting và mở rộng loyalty/voucher/account sau này

Nguyên tắc chốt:
- `services` là catalog nguồn sự thật
- `orders` và `order_items` luôn lưu snapshot tên/giá/variant tại thời điểm đặt
- guest checkout và account dùng chung một mô hình customer
- payment, voucher, no-show, assignment, notification đều là first-class tables
- reporting lấy từ order lifecycle đã chốt, không đọc trực tiếp từ FE state

## Thiết kế bảng
### 1. Identity và customer
#### `users`
Dùng cho mọi account đăng nhập.

Cột chính:
- `id uuid pk`
- `role text not null check in ('customer','staff','admin')`
- `email citext unique null`
- `phone varchar(20) unique null`
- `password_hash text null`
- `status text not null check in ('active','inactive','locked','pending_activation')`
- `last_login_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Index:
- unique index `users_email_uq`
- unique index `users_phone_uq`
- index `(role, status)`

Rule:
- guest không cần record trong `users`
- staff/admin bắt buộc có `users`
- customer có account thì có `users`; guest thì không

#### `customer_profiles`
Hồ sơ khách hàng dùng chung cho guest và registered customer.

Cột chính:
- `id uuid pk`
- `user_id uuid null fk -> users.id`
- `full_name text not null`
- `primary_email citext null`
- `primary_phone varchar(20) not null`
- `customer_type text not null check in ('guest','registered')`
- `no_show_count integer not null default 0`
- `cancellation_late_count integer not null default 0`
- `prepaid_required boolean not null default false`
- `is_blacklisted boolean not null default false`
- `notes text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Index:
- unique partial index on `user_id where user_id is not null`
- index `(primary_phone)`
- index `(primary_email)`
- index `(prepaid_required, is_blacklisted)`

Rule:
- guest booking tạo hoặc reuse `customer_profiles`
- nếu guest sau này đăng ký bằng cùng phone/email thì merge vào profile này

#### `customer_addresses`
Lưu sổ địa chỉ của member.

Cột chính:
- `id uuid pk`
- `customer_profile_id uuid not null fk -> customer_profiles.id`
- `label text null`
- `contact_name text not null`
- `contact_phone varchar(20) not null`
- `street_address text not null`
- `district text not null`
- `city text not null`
- `country text not null default 'VN'`
- `full_address text not null`
- `latitude numeric(10,7) null`
- `longitude numeric(10,7) null`
- `is_default boolean not null default false`
- `created_at timestamptz not null default now()`

Index:
- index `(customer_profile_id, is_default)`

Rule:
- order không được tham chiếu động vào bảng này khi hiển thị lịch sử
- `orders` phải lưu snapshot riêng

### 2. Tổ chức nội bộ
#### `staff_profiles`
Cột chính:
- `id uuid pk`
- `user_id uuid not null unique fk -> users.id`
- `staff_code varchar(30) unique not null`
- `full_name text not null`
- `phone varchar(20) not null`
- `vehicle_type text null`
- `service_area text[] null`
- `status text not null check in ('active','inactive','suspended')`
- `created_at timestamptz not null default now()`

#### `admin_profiles`
Cột chính:
- `id uuid pk`
- `user_id uuid not null unique fk -> users.id`
- `full_name text not null`
- `permission_group text not null`
- `created_at timestamptz not null default now()`

### 3. Catalog dịch vụ
#### `service_categories`
Cột chính:
- `id uuid pk`
- `code varchar(50) unique not null`
- `name text not null`
- `sort_order integer not null default 0`
- `active boolean not null default true`

Seed gợi ý:
- `furniture`
- `electronics`
- `other`

#### `services`
Cột chính:
- `id uuid pk`
- `category_id uuid not null fk -> service_categories.id`
- `code varchar(50) unique not null`
- `name text not null`
- `description text null`
- `icon text null`
- `pricing_type text not null check in ('fixed','weight_based','quote_only')`
- `default_unit text not null check in ('item','bag','kg')`
- `base_price numeric(12,2) null`
- `manual_quote_required boolean not null default false`
- `requires_image boolean not null default true`
- `requires_custom_name boolean not null default false`
- `active boolean not null default true`
- `sort_order integer not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Rule nghiệp vụ:
- `construction` là `weight_based`, `default_unit='kg'`, `base_price=7000`
- `custom` là `quote_only`, `requires_custom_name=true`, `manual_quote_required=true`

#### `service_variants`
Dùng cho các món có size/trọng tải riêng như tủ quần áo.

Cột chính:
- `id uuid pk`
- `service_id uuid not null fk -> services.id`
- `code varchar(50) not null`
- `label text not null`
- `unit text not null check in ('item','bag','kg')`
- `price numeric(12,2) not null`
- `sort_order integer not null default 0`
- `active boolean not null default true`

Constraint:
- unique `(service_id, code)`

Rule:
- nếu service không có variant thì dùng `services.base_price`
- nếu có variant, quote engine ưu tiên giá variant

### 4. Slot và cấu hình booking
#### `time_slots`
Cột chính:
- `id uuid pk`
- `code varchar(50) unique not null`
- `label text not null`
- `start_time time not null`
- `end_time time not null`
- `max_orders integer not null`
- `active boolean not null default true`

Seed gợi ý:
- `08_10`, `10_12`, `12_14`, `14_16`, `16_18`, `18_20`

#### `booking_capacity_overrides`
Để khóa ngày hoặc chỉnh công suất theo ngày.

Cột chính:
- `id uuid pk`
- `service_date date not null`
- `time_slot_id uuid not null fk -> time_slots.id`
- `max_orders integer null`
- `is_blocked boolean not null default false`
- `note text null`

Constraint:
- unique `(service_date, time_slot_id)`

### 5. Orders
#### `orders`
Đây là bảng trung tâm.

Cột chính:
- `id uuid pk`
- `order_code varchar(30) unique not null`
- `customer_profile_id uuid not null fk -> customer_profiles.id`
- `customer_user_id uuid null fk -> users.id`
- `customer_name_snapshot text not null`
- `customer_phone_snapshot varchar(20) not null`
- `customer_email_snapshot citext not null`
- `street_address_snapshot text not null`
- `district_snapshot text not null`
- `city_snapshot text not null`
- `full_address_snapshot text not null`
- `latitude_snapshot numeric(10,7) null`
- `longitude_snapshot numeric(10,7) null`
- `address_validation_status text not null check in ('unverified','heuristic_valid','map_verified','rejected')`
- `booking_date date not null`
- `time_slot_id uuid not null fk -> time_slots.id`
- `status text not null check in ('draft','awaiting_payment','pending_confirmation','confirmed','assigned','in_progress','collected','completed','cancelled','no_show')`
- `payment_method text not null check in ('cash','online')`
- `payment_status text not null check in ('unpaid','awaiting_payment','paid_partial','paid','refunded','failed')`
- `handling_mode text not null check in ('inside','outside','stairs')`
- `stairs_floors integer null`
- `handling_fee numeric(12,2) not null default 0`
- `service_subtotal numeric(12,2) not null default 0`
- `discount_total numeric(12,2) not null default 0`
- `estimated_total numeric(12,2) not null default 0`
- `final_total numeric(12,2) null`
- `manual_quote_required boolean not null default false`
- `cash_policy_accepted boolean not null default false`
- `notes text null`
- `internal_note text null`
- `confirmed_at timestamptz null`
- `completed_at timestamptz null`
- `cancelled_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Index:
- index `(customer_profile_id, created_at desc)`
- index `(status, booking_date)`
- index `(booking_date, time_slot_id, status)`
- index `(payment_method, payment_status)`
- index `(manual_quote_required, status)`
- index `(customer_phone_snapshot)`
- index `(customer_email_snapshot)`

Rule:
- `customer_user_id` null với guest
- `final_total` chỉ set khi chốt onsite hoặc hoàn tất
- `estimated_total` luôn là số BE tự tính lúc confirm

#### `order_items`
Cột chính:
- `id uuid pk`
- `order_id uuid not null fk -> orders.id on delete cascade`
- `service_id uuid null fk -> services.id`
- `service_variant_id uuid null fk -> service_variants.id`
- `service_code_snapshot varchar(50) not null`
- `service_name_snapshot text not null`
- `variant_code_snapshot varchar(50) null`
- `variant_label_snapshot text null`
- `pricing_type text not null check in ('fixed','weight_based','quote_only')`
- `unit text not null check in ('item','bag','kg')`
- `quantity integer not null default 1`
- `measurement_value numeric(12,2) null`
- `unit_price numeric(12,2) null`
- `line_total numeric(12,2) null`
- `custom_item_name text null`
- `custom_item_note text null`
- `manual_quote_required boolean not null default false`
- `display_order integer not null default 0`
- `created_at timestamptz not null default now()`

Constraint:
- `quantity >= 1`
- nếu `unit='kg'` thì `measurement_value > 0`
- nếu `pricing_type='quote_only'` thì `manual_quote_required=true`

Rule:
- `custom_item_name` bắt buộc nếu item ngoài danh sách
- `line_total` có thể null với quote-only

#### `order_images`
Cột chính:
- `id uuid pk`
- `order_id uuid not null fk -> orders.id on delete cascade`
- `file_url text not null`
- `mime_type varchar(100) null`
- `file_size integer null`
- `image_role text not null check in ('customer_upload','staff_onsite','completion_proof')`
- `uploaded_by_user_id uuid null fk -> users.id`
- `created_at timestamptz not null default now()`

Index:
- index `(order_id, image_role)`

Rule:
- tối thiểu 1 ảnh khách upload trước khi confirm booking ở V1 business rule

### 6. Assignment và lifecycle
#### `staff_assignments`
Cột chính:
- `id uuid pk`
- `order_id uuid not null fk -> orders.id`
- `staff_profile_id uuid not null fk -> staff_profiles.id`
- `assignment_status text not null check in ('assigned','accepted','declined','reassigned','completed')`
- `assigned_at timestamptz not null default now()`
- `accepted_at timestamptz null`
- `completed_at timestamptz null`
- `assigned_by_user_id uuid not null fk -> users.id`
- `note text null`

Constraint:
- unique partial index on `(order_id)` where assignment_status in ('assigned','accepted')

#### `order_status_logs`
Cột chính:
- `id uuid pk`
- `order_id uuid not null fk -> orders.id on delete cascade`
- `from_status text null`
- `to_status text not null`
- `actor_user_id uuid null fk -> users.id`
- `actor_type text not null check in ('system','customer','staff','admin')`
- `reason text null`
- `metadata jsonb null`
- `created_at timestamptz not null default now()`

Index:
- index `(order_id, created_at desc)`

#### `order_price_adjustments`
Để log mọi thay đổi giá sau onsite.

Cột chính:
- `id uuid pk`
- `order_id uuid not null fk -> orders.id on delete cascade`
- `adjustment_type text not null check in ('handling_fee_change','weight_remeasure','manual_quote','discount','surcharge')`
- `amount numeric(12,2) not null`
- `reason text not null`
- `actor_user_id uuid not null fk -> users.id`
- `created_at timestamptz not null default now()`

### 7. Payment
#### `payments`
Cột chính:
- `id uuid pk`
- `order_id uuid not null fk -> orders.id`
- `payment_code varchar(40) unique not null`
- `method text not null check in ('cash','online')`
- `provider text null`
- `provider_ref text null`
- `status text not null check in ('pending','authorized','paid','failed','cancelled','refunded','partially_refunded')`
- `amount numeric(12,2) not null`
- `paid_at timestamptz null`
- `failed_at timestamptz null`
- `metadata jsonb null`
- `created_at timestamptz not null default now()`

Index:
- index `(order_id, status)`
- index `(provider_ref)`

#### `refunds`
Cột chính:
- `id uuid pk`
- `payment_id uuid not null fk -> payments.id`
- `refund_code varchar(40) unique not null`
- `amount numeric(12,2) not null`
- `status text not null check in ('pending','success','failed')`
- `reason text not null`
- `requested_by_user_id uuid not null fk -> users.id`
- `provider_ref text null`
- `created_at timestamptz not null default now()`

### 8. Voucher và loyalty
#### `vouchers`
Cột chính:
- `id uuid pk`
- `code varchar(50) unique not null`
- `name text not null`
- `description text null`
- `discount_type text not null check in ('percent','fixed_amount')`
- `discount_value numeric(12,2) not null`
- `min_order_total numeric(12,2) null`
- `max_discount_amount numeric(12,2) null`
- `valid_from timestamptz not null`
- `valid_until timestamptz not null`
- `usage_limit_total integer null`
- `usage_limit_per_customer integer not null default 1`
- `active boolean not null default true`
- `new_customer_only boolean not null default false`
- `registered_only boolean not null default true`
- `created_at timestamptz not null default now()`

#### `customer_vouchers`
Cột chính:
- `id uuid pk`
- `customer_profile_id uuid not null fk -> customer_profiles.id`
- `voucher_id uuid not null fk -> vouchers.id`
- `status text not null check in ('available','reserved','used','expired','revoked')`
- `granted_reason text not null`
- `granted_at timestamptz not null default now()`
- `used_order_id uuid null fk -> orders.id`
- `used_at timestamptz null`

Constraint:
- unique `(customer_profile_id, voucher_id, status)` chỉ nếu business muốn 1 voucher loại đó/khách; nếu không thì bỏ unique này và dùng nhiều bản ghi

#### `order_vouchers`
Cột chính:
- `id uuid pk`
- `order_id uuid not null unique fk -> orders.id on delete cascade`
- `customer_voucher_id uuid not null fk -> customer_vouchers.id`
- `voucher_code_snapshot varchar(50) not null`
- `discount_amount numeric(12,2) not null`
- `created_at timestamptz not null default now()`

### 9. Notification
#### `notifications`
Cột chính:
- `id uuid pk`
- `customer_profile_id uuid null fk -> customer_profiles.id`
- `order_id uuid null fk -> orders.id`
- `channel text not null check in ('email','sms','internal')`
- `template_code varchar(50) not null`
- `recipient text not null`
- `status text not null check in ('queued','sent','failed','cancelled')`
- `payload jsonb not null`
- `sent_at timestamptz null`
- `created_at timestamptz not null default now()`

Index:
- index `(status, created_at)`
- index `(order_id, channel)`

### 10. Reporting hỗ trợ
#### `customer_flags`
Tách riêng để audit tốt hơn thay vì chỉ boolean trong profile.

Cột chính:
- `id uuid pk`
- `customer_profile_id uuid not null fk -> customer_profiles.id`
- `flag_type text not null check in ('prepaid_required','blacklisted','vip','manual_review')`
- `is_active boolean not null default true`
- `reason text not null`
- `created_by_user_id uuid not null fk -> users.id`
- `created_at timestamptz not null default now()`
- `deactivated_at timestamptz null`

## Luồng dữ liệu chốt
### Guest booking
- FE gửi items + ảnh + contact + address + slot + handling mode + payment method
- BE gọi quote engine
- BE tạo/reuse `customer_profiles`
- BE insert `orders`
- BE insert `order_items`
- BE insert `order_images`
- BE tạo `payments` nếu online
- BE ghi `order_status_logs`

### Registered booking
- tương tự guest, nhưng `orders.customer_user_id` và `orders.customer_profile_id` trỏ vào account hiện có
- có thể áp voucher nếu hợp lệ
- address có thể lấy từ `customer_addresses`, nhưng vẫn snapshot vào `orders`

### Staff onsite confirm
- staff cập nhật khối lượng thực tế hoặc phụ phí
- BE insert `order_price_adjustments`
- BE update `orders.final_total`
- BE ghi `order_status_logs`

### No-show
- admin/staff set `orders.status='no_show'`
- tăng `customer_profiles.no_show_count`
- nếu vượt ngưỡng thì set `prepaid_required=true` và insert `customer_flags`

## Constraints và logic bắt buộc ở DB/service layer
- không cho tạo `cash` order nếu customer đang `prepaid_required=true`
- không cho `orders.status='confirmed'` với online payment nếu chưa có `payments.status='paid'`
- không cho `order_items.measurement_value` null với item `weight_based`
- không cho `stairs_floors` null nếu `handling_mode='stairs'`
- không cho `cash_policy_accepted=false` nếu `payment_method='cash'`
- `booking_capacity_overrides.is_blocked=true` thì reject slot
- count order active theo `booking_date + time_slot_id` để enforce capacity

## Indexing chiến lược
Index bắt buộc:
- `orders(order_code)`
- `orders(status, booking_date)`
- `orders(customer_phone_snapshot)`
- `orders(customer_email_snapshot)`
- `orders(customer_profile_id, created_at desc)`
- `order_items(order_id)`
- `payments(order_id, status)`
- `staff_assignments(staff_profile_id, assignment_status, assigned_at desc)`
- `order_status_logs(order_id, created_at desc)`
- `customer_profiles(primary_phone)`
- `customer_profiles(primary_email)`

Khuyến nghị:
- dùng `citext` cho email ở PostgreSQL
- dùng `jsonb` cho `metadata/payload` nhưng không nhét business-critical fields vào jsonb
- dùng `uuid` cho PK toàn hệ thống

## Seed dữ liệu ban đầu
Bắt buộc seed:
- service categories: `Nội thất`, `Điện tử`, `Khác`
- time slots: `08-10`, `10-12`, `12-14`, `14-16`, `16-18`, `18-20`
- services:
  - sofa đơn 150000/item
  - sofa đôi/góc L 250000/item
  - tủ quần áo with variants nhỏ 180000, tiêu chuẩn 260000, khổ lớn 420000
  - tủ bếp/tủ giày 120000/item
  - giường/nệm 220000/item
  - tivi 80000/item
  - tủ lạnh 200000/item
  - máy giặt 180000/item
  - máy lạnh cũ 160000/item
  - bàn/ghế văn phòng 100000/item
  - rác sinh hoạt đóng bao 60000/bag
  - phế thải xây dựng 7000/kg
  - hạng mục khác quote_only
- voucher mẫu cho member mới: ví dụ `WELCOME10_NEXT`

## Test cases cho thiết kế DB
- guest tạo 2 đơn bằng cùng phone phải reuse hoặc merge đúng `customer_profiles`
- registered user tạo đơn phải có `customer_user_id`
- `construction` item với `measurement_value=0` bị reject
- `custom` item không có `custom_item_name` bị reject
- cash order của customer có `prepaid_required=true` bị reject
- online payment callback thành công mới cho order sang `confirmed`
- assignment mới không được tạo nếu order đã có assignment active
- update `final_total` phải có `order_price_adjustments`
- set `no_show` phải tăng `no_show_count`
- apply voucher quá hạn hoặc không đủ min order phải reject
- xóa order phải cascade `order_items`, `order_images`, `order_status_logs`, nhưng không xóa payment lịch sử nếu cần audit; khuyến nghị không hard-delete order trong production

## Assumptions
- Engine chốt là `PostgreSQL`
- Chưa dùng multi-warehouse hay multi-tenant
- Một order chỉ có một địa chỉ thu gom
- Một order chỉ có một assignment active tại một thời điểm
- V1 chưa cần route optimization hay GPS tracking table
- Reporting ban đầu chạy trực tiếp từ OLTP + index; khi scale lớn mới tách warehouse/materialized view


