'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { type AuthMode, type AuthUser } from './AuthModal';

interface BookingPrefill {
  address?: string;
  handlingGoal?: string;
  selectedWaste?: string;
}

interface BookingModalProps {
  currentUser: AuthUser | null;
  isOpen: boolean;
  onAuthClick: (mode: AuthMode) => void;
  onClose: () => void;
  prefill?: BookingPrefill | null;
}

type PricingMode = 'fixed' | 'estimate' | 'quote';
type HandlingMode = 'inside' | 'outside' | 'stairs';
type PaymentMethod = 'cash' | 'online';

interface ServiceOption {
  id: string;
  label: string;
  price: number;
  unitLabel?: string;
}

interface WasteService {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  pricingMode: PricingMode;
  basePrice?: number;
  unitLabel?: string;
  options?: ServiceOption[];
  note?: string;
}

interface SelectedWasteItem {
  id: string;
  name: string;
  icon: string;
  pricingMode: PricingMode;
  quantity: number;
  measurementValue?: number;
  basePrice: number;
  unitLabel: string;
  selectedOptionId?: string;
  selectedOptionLabel?: string;
}

const priceFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const wasteServices: WasteService[] = [
  {
    id: 'sofa-single',
    name: 'Sofa đơn',
    icon: '🛋️',
    description: 'Thu gom sofa đơn, ghế đơn cỡ lớn.',
    category: 'Nội thất',
    pricingMode: 'fixed',
    basePrice: 150000,
    unitLabel: '/món',
  },
  {
    id: 'sofa-large',
    name: 'Sofa đôi / góc L',
    icon: '🛋️',
    description: 'Phù hợp với sofa đôi, sofa góc hoặc bộ ghế lớn.',
    category: 'Nội thất',
    pricingMode: 'fixed',
    basePrice: 250000,
    unitLabel: '/món',
  },
  {
    id: 'wardrobe',
    name: 'Tủ quần áo',
    icon: '🗄️',
    description: 'Có phân loại theo kích thước để phản ánh đúng tải trọng vận chuyển.',
    category: 'Nội thất',
    pricingMode: 'fixed',
    options: [
      { id: 'small', label: 'Nhỏ', price: 180000, unitLabel: '/món' },
      { id: 'standard', label: 'Tiêu chuẩn', price: 260000, unitLabel: '/món' },
      { id: 'oversize', label: 'Khổ lớn', price: 420000, unitLabel: '/món' },
    ],
  },
  {
    id: 'kitchen-cabinet',
    name: 'Tủ bếp / tủ giày',
    icon: '🗃️',
    description: 'Nhóm tủ nhỏ, kệ thấp hoặc tủ giày.',
    category: 'Nội thất',
    pricingMode: 'fixed',
    basePrice: 120000,
    unitLabel: '/món',
  },
  {
    id: 'bed',
    name: 'Giường / nệm',
    icon: '🛏️',
    description: 'Áp dụng cho khung giường, nệm đơn hoặc nệm đôi.',
    category: 'Nội thất',
    pricingMode: 'fixed',
    basePrice: 220000,
    unitLabel: '/món',
  },
  {
    id: 'tv',
    name: 'Tivi',
    icon: '📺',
    description: 'Tivi, màn hình hoặc thiết bị hiển thị cỡ vừa.',
    category: 'Điện tử',
    pricingMode: 'fixed',
    basePrice: 80000,
    unitLabel: '/món',
  },
  {
    id: 'fridge',
    name: 'Tủ lạnh',
    icon: '🧊',
    description: 'Thiết bị điện lạnh cồng kềnh cần xử lý riêng.',
    category: 'Điện tử',
    pricingMode: 'fixed',
    basePrice: 200000,
    unitLabel: '/món',
  },
  {
    id: 'washer',
    name: 'Máy giặt',
    icon: '🫧',
    description: 'Áp dụng cho máy giặt gia đình phổ biến.',
    category: 'Điện tử',
    pricingMode: 'fixed',
    basePrice: 180000,
    unitLabel: '/món',
  },
  {
    id: 'aircon',
    name: 'Máy lạnh cũ',
    icon: '❄️',
    description: 'Máy lạnh cũ hoặc thiết bị điều hòa treo tường.',
    category: 'Điện tử',
    pricingMode: 'fixed',
    basePrice: 160000,
    unitLabel: '/món',
  },
  {
    id: 'office-furniture',
    name: 'Bàn / ghế văn phòng',
    icon: '🪑',
    description: 'Bàn làm việc, ghế văn phòng hoặc ghế xoay.',
    category: 'Khác',
    pricingMode: 'fixed',
    basePrice: 100000,
    unitLabel: '/món',
  },
  {
    id: 'household-bag',
    name: 'Rác sinh hoạt đóng bao',
    icon: '🗑️',
    description: 'Dành cho bao rác đã đóng kín và có thể bốc xếp nhanh.',
    category: 'Khác',
    pricingMode: 'fixed',
    basePrice: 60000,
    unitLabel: '/bao',
  },
  {
    id: 'construction',
    name: 'Phế thải xây dựng',
    icon: '🧱',
    description: 'Hạng mục này nhập trực tiếp theo kg thay vì theo món.',
    category: 'Khác',
    pricingMode: 'estimate',
    basePrice: 7000,
    unitLabel: '/kg',
    note: 'Người dùng nhập khối lượng thực tế theo kg để hệ thống tạm tính chi phí.',
  },
  {
    id: 'custom',
    name: 'Hạng mục khác',
    icon: '✨',
    description: 'Dùng khi khách muốn chuyển món không có sẵn trong danh sách hiện tại.',
    category: 'Khác',
    pricingMode: 'quote',
    note: 'Ví dụ: bàn ăn, cũi trẻ em, xe máy điện, biển quảng cáo, máy cắt cỏ...',
  },
];

const categories = ['Tất cả', 'Nội thất', 'Điện tử', 'Khác'];

const districtSuggestions = [
  'Quận 1',
  'Quận 3',
  'Quận 7',
  'Phú Nhuận',
  'Bình Thạnh',
  'Thủ Đức',
];

const citySuggestions = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'];
const stairsBaseFee = 50000;
const stairsPerFloorFee = 30000;

function getCategoryFromPrefill(selectedWaste?: string) {
  if (!selectedWaste) {
    return 'Tất cả';
  }

  if (selectedWaste.includes('Nội thất')) {
    return 'Nội thất';
  }

  if (selectedWaste.includes('điện tử') || selectedWaste.includes('Điện tử')) {
    return 'Điện tử';
  }

  return 'Khác';
}

function formatPrice(amount: number) {
  return priceFormatter.format(amount);
}

function getDisplayPrice(service: WasteService) {
  if (service.pricingMode === 'quote') {
    return 'Cần báo giá';
  }

  const price = service.options?.[0]?.price ?? service.basePrice ?? 0;
  if (service.unitLabel === '/kg') {
    return `${formatPrice(price)}/kg`;
  }

  return `Từ ${formatPrice(price)}`;
}

function createSelectedItem(service: WasteService, optionId?: string): SelectedWasteItem {
  const selectedOption = service.options?.find((option) => option.id === optionId) ?? service.options?.[0];
  const unitLabel = selectedOption?.unitLabel ?? service.unitLabel ?? '';

  return {
    id: service.id,
    name: service.name,
    icon: service.icon,
    pricingMode: service.pricingMode,
    quantity: 1,
    measurementValue: unitLabel === '/kg' ? 1 : undefined,
    basePrice: selectedOption?.price ?? service.basePrice ?? 0,
    unitLabel,
    selectedOptionId: selectedOption?.id,
    selectedOptionLabel: selectedOption?.label,
  };
}

function isWeightBasedItem(item: SelectedWasteItem) {
  return item.unitLabel === '/kg';
}

function getBillingAmount(item: SelectedWasteItem) {
  if (isWeightBasedItem(item)) {
    return item.measurementValue ?? 0;
  }

  return item.quantity;
}

function getSelectionMeta(item: SelectedWasteItem) {
  if (isWeightBasedItem(item)) {
    return `${item.measurementValue ?? 0} kg`;
  }

  return `x${item.quantity}`;
}

function isLikelyValidAddress(streetAddress: string, district: string, city: string) {
  const hasStreetNumber = /\d/.test(streetAddress);
  const hasStreetName = /[a-zA-ZÀ-ỹ]/.test(streetAddress);
  const hasDistrict = district.trim().length >= 2;
  const hasCity = city.trim().length >= 2;

  return hasStreetNumber && hasStreetName && hasDistrict && hasCity;
}

export default function BookingModal({ currentUser, isOpen, onAuthClick, onClose, prefill }: BookingModalProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<SelectedWasteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [customItemName, setCustomItemName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('TP. Hồ Chí Minh');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [handlingMode, setHandlingMode] = useState<HandlingMode>('inside');
  const [stairsFloors, setStairsFloors] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashPolicyAccepted, setCashPolicyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [streetTouched, setStreetTouched] = useState(false);
  const [districtTouched, setDistrictTouched] = useState(false);
  const [cityTouched, setCityTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [serviceStepTouched, setServiceStepTouched] = useState(false);

  const timeSlots = [
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
    '18:00 - 20:00',
  ];

  const getAvailableDates = () => {
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index + 1);

      return {
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('vi-VN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
      };
    });
  };

  const selectedCustomItem = selectedItems.find((item) => item.id === 'custom');
  const hasQuoteItems = selectedItems.some((item) => item.pricingMode === 'quote');

  const fullAddress = `${streetAddress}, ${district}, ${city}`.replace(/^,\s*|,\s*$/g, '');
  const isCustomerNameValid = customerName.trim().length >= 2;
  const isStreetAddressValid = streetAddress.trim().length >= 5;
  const isDistrictValid = district.trim().length >= 2;
  const isCityValid = city.trim().length >= 2;
  const isAddressValid = isLikelyValidAddress(streetAddress, district, city);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const normalizedPhone = phone.replace(/\s+/g, '');
  const isPhoneValid = /^(0|\+84)\d{9,10}$/.test(normalizedPhone);
  const canProceedStep1 =
    selectedItems.length > 0 &&
    uploadedImage !== null &&
    selectedItems.every((item) => !isWeightBasedItem(item) || (item.measurementValue ?? 0) > 0) &&
    (!selectedCustomItem || customItemName.trim().length >= 3);
  const canProceedStep2 =
    isCustomerNameValid &&
    isStreetAddressValid &&
    isDistrictValid &&
    isCityValid &&
    isAddressValid &&
    isPhoneValid &&
    isEmailValid;
  const canProceedStep3 = selectedDate !== '' && selectedTime !== '';
  const canSubmit = canProceedStep2 && canProceedStep3 && (paymentMethod !== 'cash' || cashPolicyAccepted);

  const serviceHandlingFee =
    handlingMode === 'outside'
      ? -30000
      : handlingMode === 'stairs'
        ? stairsBaseFee + Math.max(0, stairsFloors - 1) * stairsPerFloorFee
        : 0;

  const handlingLabel =
    handlingMode === 'outside'
      ? 'Để đồ bên ngoài'
      : handlingMode === 'stairs'
        ? `Vác thang bộ (${stairsFloors} tầng)`
        : 'Vào tận nhà bê đồ';

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      if (item.pricingMode === 'quote') {
        return total;
      }

      return total + item.basePrice * getBillingAmount(item);
    }, 0);
  };

  const getTotalLabel = () => {
    const total = calculateTotal() + serviceHandlingFee;

    if (hasQuoteItems && total > 0) {
      return `Từ ${formatPrice(total)}`;
    }

    if (hasQuoteItems) {
      return 'Cần báo giá';
    }

    return formatPrice(total);
  };

  const getLineItemLabel = (item: SelectedWasteItem) => {
    if (item.pricingMode === 'quote') {
      return 'Cần báo giá';
    }

    const lineTotal = item.basePrice * getBillingAmount(item);
    return item.pricingMode === 'estimate' ? `Tạm tính ${formatPrice(lineTotal)}` : formatPrice(lineTotal);
  };

  const filteredServices = wasteServices.filter((service) => {
    const matchesCategory = activeCategory === 'Tất cả' || service.category === activeCategory;
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const haystack = `${service.name} ${service.description}`.toLowerCase();

    return matchesCategory && (normalizedQuery === '' || haystack.includes(normalizedQuery));
  });

  const groupedServices = categories
    .filter((category) => category !== 'Tất cả')
    .map((category) => ({
      category,
      items: filteredServices.filter((service) => service.category === category),
    }))
    .filter((group) => group.items.length > 0);

  const selectService = (service: WasteService) => {
    setSelectedItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === service.id);

      if (existingItem) {
        return currentItems.filter((item) => item.id !== service.id);
      }

      return [...currentItems, createSelectedItem(service)];
    });
  };

  const selectServiceOption = (service: WasteService, option: ServiceOption) => {
    setSelectedItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === service.id);

      if (!existingItem) {
        return [...currentItems, createSelectedItem(service, option.id)];
      }

      return currentItems.map((item) =>
        item.id === service.id
          ? {
              ...item,
              basePrice: option.price,
              measurementValue: (option.unitLabel ?? service.unitLabel ?? '') === '/kg' ? item.measurementValue ?? 1 : undefined,
              unitLabel: option.unitLabel ?? service.unitLabel ?? '',
              selectedOptionId: option.id,
              selectedOptionLabel: option.label,
            }
          : item,
      );
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setSelectedItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          quantity: Math.max(1, item.quantity + change),
        };
      }),
    );
  };

  const updateMeasurementValue = (id: string, value: number) => {
    setSelectedItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          measurementValue: Number.isFinite(value) ? Math.max(0, value) : 0,
        };
      }),
    );
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setEmailTouched(true);
    setPhoneTouched(true);

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const resetForm = () => {
    setStep(1);
    setSelectedItems([]);
    setSearchQuery('');
    setActiveCategory('Tất cả');
    setCustomItemName('');
    setCustomerName('');
    setStreetAddress('');
    setDistrict('');
    setCity('TP. Hồ Chí Minh');
    setSelectedDate('');
    setSelectedTime('');
    setUploadedImage(null);
    setEmail('');
    setPhone('');
    setNotes('');
    setHandlingMode('inside');
    setStairsFloors(2);
    setPaymentMethod('cash');
    setCashPolicyAccepted(false);
    setIsSuccess(false);
    setNameTouched(false);
    setStreetTouched(false);
    setDistrictTouched(false);
    setCityTouched(false);
    setEmailTouched(false);
    setPhoneTouched(false);
    setServiceStepTouched(false);
  };

  const handleNext = () => {
    if (step === 1) {
      setServiceStepTouched(true);
      if (!canProceedStep1) {
        return;
      }
    }

    if (step === 2) {
      setNameTouched(true);
      setStreetTouched(true);
      setDistrictTouched(true);
      setCityTouched(true);
      setPhoneTouched(true);
      setEmailTouched(true);
      if (!canProceedStep2) {
        return;
      }
    }

    if (step === 3 && !canProceedStep3) {
      return;
    }

    setStep((currentStep) => currentStep + 1);
  };

  useEffect(() => {
    if (!isOpen) {
      setTimeout(resetForm, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!currentUser || !isOpen) {
      return;
    }

    setCustomerName((currentName) => currentName || currentUser.name);
    setEmail((currentEmail) => currentEmail || currentUser.email);
    setPhone((currentPhone) => currentPhone || currentUser.phone);
  }, [currentUser, isOpen]);

  useEffect(() => {
    if (!isOpen || !prefill) {
      return;
    }

    if (prefill.selectedWaste && searchQuery === '') {
      setSearchQuery(prefill.selectedWaste);
      setActiveCategory(getCategoryFromPrefill(prefill.selectedWaste));
    }

    if (prefill.address && streetAddress === '') {
      setStreetAddress(prefill.address);
    }

    if (prefill.handlingGoal && notes === '') {
      setNotes(`Yêu cầu từ form nhanh: ${prefill.handlingGoal}.`);
    }
  }, [isOpen, notes, prefill, searchQuery, streetAddress]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, isSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1511]/70 p-4 backdrop-blur-md">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-[0_30px_120px_rgba(0,0,0,0.32)] animate-fadeInUp">
        <div className="bg-[linear-gradient(135deg,_#103B2D_0%,_#18543F_55%,_#1D6B4E_100%)] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#A7E8B6]">
                EcoCollect booking flow
              </p>
              <h2 className="text-3xl font-bold">Đặt lịch thu gom thông minh</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/75">
                Chọn đúng loại rác và số lượng. Một số món cồng kềnh có phân loại kích thước, còn phế thải xây dựng sẽ nhập trực tiếp theo kg.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!isSuccess && (
            <div className="mt-6 grid gap-2 sm:grid-cols-4">
              {[
                { stepNumber: 1, label: 'Chọn dịch vụ' },
                { stepNumber: 2, label: 'Địa chỉ' },
                { stepNumber: 3, label: 'Lịch hẹn' },
                { stepNumber: 4, label: 'Xác nhận' },
              ].map((progress) => (
                <div
                  key={progress.stepNumber}
                  className={`rounded-2xl border px-4 py-3 text-sm transition-colors ${
                    step >= progress.stepNumber
                      ? 'border-[#8DE0A6]/40 bg-[#8DE0A6]/12 text-white'
                      : 'border-white/10 bg-white/[0.06] text-white/60'
                  }`}
                >
                  <div className="mb-1 text-xs uppercase tracking-[0.18em] text-white/50">
                    Step {progress.stepNumber}
                  </div>
                  <div className="font-semibold">{progress.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          ref={contentRef}
          className="overflow-y-auto p-6"
          style={{ maxHeight: 'calc(92vh - 226px)' }}
        >
          {isSuccess ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF8EE]">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="mb-2 text-3xl font-bold text-[#103B2D]">Đặt lịch thành công</h3>
              <p className="mx-auto mb-8 max-w-xl text-gray-600">
                Chúng tôi đã gửi email xác nhận đến {email}. Đơn hàng sẽ tiếp tục được phân tuyến để ưu tiên xử lý xanh và tối ưu chuyến xe.
              </p>
              <div className="mx-auto mb-8 max-w-2xl rounded-[28px] bg-[#F5FBF6] p-5 text-left">
                <h4 className="mb-4 font-semibold text-[#103B2D]">Tóm tắt đơn hàng</h4>
                <div className="space-y-2 text-sm text-[#476458]">
                  <p>👤 {customerName}</p>
                  <p>📞 {phone}</p>
                  <p>📧 {email}</p>
                  <p>📍 {fullAddress}</p>
                  <p>📅 {selectedDate} • {selectedTime}</p>
                  <p>🚚 {handlingLabel}</p>
                  <p>💰 {getTotalLabel()}</p>
                  {hasQuoteItems && (
                    <p className="text-[#2F855A]">Một số hạng mục sẽ được đội vận hành xác nhận báo giá thủ công.</p>
                  )}
                </div>
              </div>
              {!currentUser && (
                <div className="mx-auto mb-8 max-w-2xl rounded-[28px] border border-[#D6EEDD] bg-white p-5 text-left shadow-[0_16px_40px_rgba(15,61,46,0.05)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">
                    Tạo tài khoản sau đơn đầu tiên
                  </p>
                  <h4 className="mt-2 text-2xl font-bold text-[#103B2D]">
                    Lưu thông tin đơn này và nhận voucher cho lần tiếp theo
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-[#476458]">
                    Bạn vừa đặt lịch thành công với chế độ guest checkout. Nếu tạo tài khoản ngay bây giờ,
                    hệ thống sẽ lưu email này làm hồ sơ thành viên, giúp các lần đặt sau nhanh hơn và có ưu đãi riêng.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => onAuthClick('register')}
                      className="rounded-full bg-[#103B2D] px-6 py-3 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      Tạo tài khoản nhận voucher
                    </button>
                    <button
                      type="button"
                      onClick={() => onAuthClick('login')}
                      className="rounded-full border border-[#D6EEDD] px-6 py-3 font-semibold text-[#103B2D] transition-colors hover:bg-[#F5FBF6]"
                    >
                      Tôi đã có tài khoản
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={onClose}
                className="rounded-full bg-[#103B2D] px-8 py-3 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
              >
                Đóng
              </button>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <div className="mb-5 rounded-[28px] border border-[#D6EEDD] bg-[#F7FCF8] p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-[#103B2D]">Chọn loại rác cần thu gom</h3>
                          <p className="mt-1 text-sm text-[#476458]">
                            Giữ cách chọn sản phẩm đơn giản như ban đầu, nhưng thêm phân loại kích thước cho món cồng kềnh và mục riêng cho hạng mục ngoài danh sách.
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[#476458]">
                          Tổng món đã chọn: <span className="font-semibold text-[#103B2D]">{selectedItems.length}</span>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder="Tìm vật phẩm: sofa, tủ quần áo, xe máy điện..."
                          className="w-full rounded-2xl border border-[#D6EEDD] bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#789185] focus:border-[#22C55E]"
                        />
                        <div className="flex flex-wrap gap-2">
                          {categories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setActiveCategory(category)}
                              className={`rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                                activeCategory === category
                                  ? 'bg-[#103B2D] text-white'
                                  : 'bg-white text-[#476458] hover:bg-[#EAF8EE]'
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>

                      {serviceStepTouched && !canProceedStep1 && (
                        <p className="mt-4 text-sm font-medium text-red-500">
                          Vui lòng chọn ít nhất một dịch vụ và tải ảnh vật cần chuyển trước khi sang bước 2. Với phế thải xây dựng, hãy nhập khối lượng lớn hơn 0 kg. Với hạng mục khác, hãy nhập tên món rõ ràng.
                        </p>
                      )}
                    </div>

                    <div className="space-y-6">
                      {groupedServices.map((group) => (
                        <section key={group.category}>
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2F855A]">
                              {group.category}
                            </h4>
                            <span className="text-xs text-[#789185]">{group.items.length} lựa chọn</span>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            {group.items.map((service) => {
                              const selectedItem = selectedItems.find((item) => item.id === service.id);
                              const isSelected = Boolean(selectedItem);

                              return (
                                <article
                                  key={service.id}
                                  onClick={() => selectService(service)}
                                  className={`cursor-pointer rounded-[28px] border p-5 transition-all duration-300 ${
                                    isSelected
                                      ? 'border-[#2F855A] bg-[#F0FBF3] shadow-[0_16px_40px_rgba(15,61,46,0.08)]'
                                      : 'border-[#E3ECE6] bg-white hover:border-[#A7E8B6] hover:shadow-[0_12px_30px_rgba(15,61,46,0.05)]'
                                  }`}
                                >
                                  <div className="mb-4 flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7FCF8] text-3xl">
                                        {service.icon}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h5 className="text-lg font-semibold text-[#103B2D]">{service.name}</h5>
                                          <span
                                            className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                              isSelected
                                                ? 'bg-[#DFF5E5] text-[#2F855A]'
                                                : 'bg-[#F1F4F2] text-[#6C8378]'
                                            }`}
                                          >
                                            {isSelected ? 'Đã chọn' : 'Chưa chọn'}
                                          </span>
                                        </div>
                                        <p className="mt-1 text-sm leading-6 text-[#476458]">
                                          {service.description}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="rounded-full bg-[#F7FCF8] px-3 py-1 text-xs font-semibold text-[#2F855A]">
                                      {getDisplayPrice(service)}
                                    </div>
                                  </div>

                                  {service.options && (
                                    <div
                                      className="mb-4 flex flex-wrap gap-2"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      {service.options.map((option) => (
                                        <button
                                          key={option.id}
                                          type="button"
                                          onClick={() => selectServiceOption(service, option)}
                                          className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                                            selectedItem?.selectedOptionId === option.id
                                              ? 'bg-[#103B2D] text-white'
                                              : 'bg-[#F1F4F2] text-[#476458] hover:bg-[#EAF8EE]'
                                          }`}
                                        >
                                          {option.label} • {formatPrice(option.price)}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {service.note && (
                                    <p className="rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-[#476458]">
                                      {service.note}
                                    </p>
                                  )}

                                  {service.id === 'custom' && isSelected && (
                                    <div className="mt-4" onClick={(event) => event.stopPropagation()}>
                                      <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                                        Tên hạng mục cần chuyển *
                                      </label>
                                      <input
                                        type="text"
                                        value={customItemName}
                                        onChange={(event) => setCustomItemName(event.target.value)}
                                        placeholder="Ví dụ: bàn ăn, cũi trẻ em, xe máy điện..."
                                        className="w-full rounded-2xl border border-[#D6EEDD] bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#789185] focus:border-[#22C55E]"
                                      />
                                    </div>
                                  )}

                                  {isSelected && selectedItem && (
                                    <div
                                      className="mt-4 flex items-center justify-between border-t border-[#D6EEDD] pt-4"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      <div className="text-sm text-[#476458]">
                                        <span className="font-medium text-[#103B2D]">
                                          {selectedItem.selectedOptionLabel ?? 'Mặc định'}
                                        </span>
                                        {selectedItem.unitLabel && <span> • {selectedItem.unitLabel}</span>}
                                      </div>
                                      {isWeightBasedItem(selectedItem) ? (
                                        <div className="flex items-center gap-2">
                                          <label className="text-sm font-medium text-[#24483A]">
                                            Số kg
                                          </label>
                                          <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={selectedItem.measurementValue ?? 0}
                                            onChange={(event) =>
                                              updateMeasurementValue(
                                                service.id,
                                                Number(event.target.value),
                                              )
                                            }
                                            className="w-24 rounded-2xl border border-[#D6EEDD] bg-white px-3 py-2 text-right text-sm font-semibold text-[#103B2D] outline-none focus:border-[#22C55E]"
                                          />
                                          <span className="text-sm text-[#476458]">kg</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-3">
                                          <button
                                            type="button"
                                            onClick={() => updateQuantity(service.id, -1)}
                                            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F1EB] text-lg text-[#24483A]"
                                          >
                                            -
                                          </button>
                                          <span className="min-w-6 text-center font-semibold text-[#103B2D]">
                                            {selectedItem.quantity}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => updateQuantity(service.id, 1)}
                                            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#103B2D] text-lg text-white"
                                          >
                                            +
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </article>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>

                  <aside className="space-y-5">
                    <div className="rounded-[28px] border border-[#D6EEDD] bg-[#103B2D] p-5 text-white">
                      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#A7E8B6]">
                        Quick guidance
                      </p>
                      <div className="space-y-3 text-sm leading-6 text-white/78">
                        <p>1. Các món thông thường vẫn chọn theo từng sản phẩm như trước.</p>
                        <p>2. Tủ quần áo có thêm lựa chọn kích thước để phản ánh đúng tải trọng.</p>
                        <p>3. Riêng phế thải xây dựng sẽ nhập theo kg để hệ thống tạm tính đúng hơn.</p>
                        <p>4. Nếu món không có trong list, chọn “Hạng mục khác” và nhập tên cụ thể.</p>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-[#D6EEDD] bg-[#F7FCF8] p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-semibold text-[#103B2D]">Tóm tắt lựa chọn</h4>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2F855A]">
                          {selectedItems.length} mục
                        </span>
                      </div>

                      {selectedItems.length > 0 ? (
                        <div className="space-y-3">
                          {selectedItems.map((item) => (
                            <div key={item.id} className="rounded-2xl bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-[#103B2D]">
                                    {item.icon} {item.id === 'custom' && customItemName.trim() !== '' ? customItemName : item.name}
                                  </p>
                                  <p className="mt-1 text-sm text-[#476458]">
                                    {item.selectedOptionLabel ?? 'Mặc định'}
                                    {item.unitLabel ? ` • ${item.unitLabel}` : ''}
                                    {` • ${getSelectionMeta(item)}`}
                                  </p>
                                </div>
                                <span className="text-sm font-semibold text-[#2F855A]">
                                  {getLineItemLabel(item)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm leading-6 text-[#476458]">
                          Chưa có hạng mục nào được chọn. Hãy chọn ít nhất một dịch vụ để tiếp tục.
                        </p>
                      )}
                    </div>

                    <div className="rounded-[28px] border border-dashed border-[#C6DBCC] bg-white p-5 text-center">
                      {uploadedImage ? (
                        <div className="relative">
                          <img src={uploadedImage} alt="Preview" className="mx-auto max-h-48 rounded-2xl" />
                          <button
                            onClick={() => setUploadedImage(null)}
                            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#103B2D] text-white"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className="block cursor-pointer">
                          <div className="mb-3 text-4xl">📷</div>
                          <p className="font-semibold text-[#103B2D]">Thêm ảnh để báo giá chính xác hơn</p>
                          <p className="mt-1 text-sm text-[#789185]">
                            Đặc biệt hữu ích với món ngoài danh sách hoặc phế thải xây dựng.
                          </p>
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      )}
                    </div>

                    <div className="rounded-[28px] border border-[#D6EEDD] bg-[#F5FBF6] p-5">
                      <p className="mb-3 text-sm font-medium text-[#476458]">
                        Chỉ khi đã chọn dịch vụ và tải ảnh vật cần chuyển thì mới sang được bước nhập địa chỉ.
                      </p>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canProceedStep1}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#103B2D] px-6 py-4 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#9EB8A7] disabled:hover:translate-y-0"
                      >
                        <span>Tiếp tục sang bước 2</span>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </aside>
                </div>
              )}

              {step === 2 && (
                <div className="mx-auto max-w-3xl">
                  <h3 className="mb-2 text-2xl font-bold text-[#103B2D]">Bước 2: Thông tin khách hàng và địa chỉ</h3>
                  <p className="mb-6 text-[#476458]">
                    Điền đầy đủ thông tin để tạo hồ sơ khách hàng, gửi email xác nhận và kiểm tra địa chỉ hợp lệ trước khi sang bước tiếp theo.
                  </p>

                  <div className="mb-6 rounded-[28px] border border-[#D6EEDD] bg-[#F5FBF6] p-5">
                    {currentUser ? (
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">
                            Tài khoản đã đăng nhập
                          </p>
                          <h4 className="mt-2 text-xl font-bold text-[#103B2D]">
                            Hệ thống đã tự điền một phần thông tin cho bạn
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-[#476458]">
                            Bạn có thể chỉnh lại dữ liệu trước khi xác nhận. Sau khi tạo đơn, lịch sử sẽ được lưu
                            vào cùng một hồ sơ khách hàng.
                          </p>
                        </div>
                        <div className="rounded-[24px] bg-white px-4 py-3 text-sm text-[#476458]">
                          <p className="font-semibold text-[#103B2D]">{currentUser.name}</p>
                          <p className="mt-1">{currentUser.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F855A]">
                            Guest checkout
                          </p>
                          <h4 className="mt-2 text-xl font-bold text-[#103B2D]">
                            Bạn vẫn đặt lịch được mà không cần tài khoản
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-[#476458]">
                            Nếu đăng nhập hoặc tạo tài khoản, hệ thống sẽ lưu địa chỉ, lịch sử đơn và gửi voucher
                            cho lần đặt tiếp theo.
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => onAuthClick('login')}
                            className="rounded-full border border-[#D6EEDD] px-4 py-3 text-sm font-semibold text-[#103B2D] transition-colors hover:bg-white"
                          >
                            Đăng nhập
                          </button>
                          <button
                            type="button"
                            onClick={() => onAuthClick('register')}
                            className="rounded-full bg-[#103B2D] px-4 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                          >
                            Tạo tài khoản
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                        Tên khách hàng *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        onBlur={() => setNameTouched(true)}
                        placeholder="Ví dụ: Nguyễn Văn A"
                        className={`w-full rounded-[24px] border px-4 py-4 text-base outline-none transition-colors ${
                          nameTouched && !isCustomerNameValid
                            ? 'border-red-300 bg-red-50'
                            : 'border-[#D6EEDD] bg-[#F7FCF8] focus:border-[#22C55E]'
                        }`}
                      />
                      {nameTouched && !isCustomerNameValid && (
                        <p className="mt-2 text-sm font-medium text-red-500">
                          Vui lòng nhập tên khách hàng hợp lệ.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                        Số nhà, tên đường *
                      </label>
                      <input
                        type="text"
                        value={streetAddress}
                        onChange={(event) => setStreetAddress(event.target.value)}
                        onBlur={() => setStreetTouched(true)}
                        placeholder="Ví dụ: T18 Times City"
                        className={`w-full rounded-[24px] border px-4 py-4 text-base outline-none transition-colors ${
                          streetTouched && !isStreetAddressValid
                            ? 'border-red-300 bg-red-50'
                            : 'border-[#D6EEDD] bg-[#F7FCF8] focus:border-[#22C55E]'
                        }`}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                          Quận / Huyện *
                        </label>
                        <input
                          type="text"
                          value={district}
                          onChange={(event) => setDistrict(event.target.value)}
                          onBlur={() => setDistrictTouched(true)}
                          placeholder="Ví dụ: Quận 1"
                          list="district-suggestions"
                          className={`w-full rounded-[24px] border px-4 py-4 text-base outline-none transition-colors ${
                            districtTouched && !isDistrictValid
                              ? 'border-red-300 bg-red-50'
                              : 'border-[#D6EEDD] bg-[#F7FCF8] focus:border-[#22C55E]'
                          }`}
                        />
                        <datalist id="district-suggestions">
                          {districtSuggestions.map((item) => (
                            <option key={item} value={item} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                          Thành phố *
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(event) => setCity(event.target.value)}
                          onBlur={() => setCityTouched(true)}
                          list="city-suggestions"
                          className={`w-full rounded-[24px] border px-4 py-4 text-base outline-none transition-colors ${
                            cityTouched && !isCityValid
                              ? 'border-red-300 bg-red-50'
                              : 'border-[#D6EEDD] bg-[#F7FCF8] focus:border-[#22C55E]'
                          }`}
                        />
                        <datalist id="city-suggestions">
                          {citySuggestions.map((item) => (
                            <option key={item} value={item} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                          Số điện thoại liên hệ *
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          onBlur={() => setPhoneTouched(true)}
                          placeholder="093633040"
                          className={`w-full rounded-[24px] border px-4 py-4 text-base outline-none transition-colors ${
                            phoneTouched && !isPhoneValid
                              ? 'border-red-300 bg-red-50'
                              : 'border-[#D6EEDD] bg-[#F7FCF8] focus:border-[#22C55E]'
                          }`}
                        />
                        {phoneTouched && !isPhoneValid && (
                          <p className="mt-2 text-sm font-medium text-red-500">
                            Số điện thoại không hợp lệ. Vui lòng kiểm tra lại trước khi tiếp tục.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                          Email xác nhận *
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          onBlur={() => setEmailTouched(true)}
                          placeholder="ban@company.com"
                          className={`w-full rounded-[24px] border px-4 py-4 text-base outline-none transition-colors ${
                            emailTouched && !isEmailValid
                              ? 'border-red-300 bg-red-50'
                              : 'border-[#D6EEDD] bg-[#F7FCF8] focus:border-[#22C55E]'
                          }`}
                        />
                        {emailTouched && !isEmailValid && (
                          <p className="mt-2 text-sm font-medium text-red-500">
                            Email không hợp lệ. Vui lòng nhập email để tạo database khách hàng và gửi xác nhận.
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                        Ghi chú thêm (tùy chọn)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="VD: Tầng 3, thang máy còn hoạt động, gọi trước 30 phút..."
                        rows={4}
                        className="w-full rounded-[24px] border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E]"
                      />
                    </div>

                    <div className="rounded-[28px] border border-dashed border-[#C6DBCC] bg-white p-5 text-center">
                      <div className="mb-3 text-4xl">📍</div>
                      <p className="font-semibold text-[#103B2D]">Bản đồ xác nhận địa chỉ</p>
                      <p className="mt-1 text-sm text-[#789185]">Google Maps integration</p>
                    </div>

                    {(nameTouched || streetTouched || districtTouched || cityTouched || phoneTouched || emailTouched) &&
                      !canProceedStep2 && (
                        <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                          {!isCustomerNameValid && <p>Vui lòng nhập tên khách hàng hợp lệ.</p>}
                          {!isStreetAddressValid && <p>Vui lòng nhập số nhà và tên đường.</p>}
                          {!isDistrictValid && <p>Vui lòng nhập quận/huyện hợp lệ.</p>}
                          {!isCityValid && <p>Vui lòng nhập thành phố hợp lệ.</p>}
                          {isStreetAddressValid && isDistrictValid && isCityValid && !isAddressValid && (
                            <p>Không tìm thấy địa chỉ phù hợp. Vui lòng kiểm tra lại địa chỉ trước khi tiếp tục.</p>
                          )}
                          {!isPhoneValid && <p>Số điện thoại không hợp lệ.</p>}
                          {!isEmailValid && <p>Email không hợp lệ.</p>}
                        </div>
                      )}

                    <div className="rounded-[28px] border border-[#D6EEDD] bg-[#F5FBF6] p-5">
                      <p className="mb-3 text-sm font-medium text-[#476458]">
                        Chỉ khi thông tin khách hàng và địa chỉ hợp lệ thì mới được sang bước 3.
                      </p>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canProceedStep2}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#103B2D] px-6 py-4 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#9EB8A7] disabled:hover:translate-y-0"
                      >
                        <span>Tiếp tục sang bước 3</span>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="mx-auto max-w-3xl">
                  <h3 className="mb-2 text-2xl font-bold text-[#103B2D]">Bước 3: Chọn ngày và khung giờ</h3>
                  <p className="mb-6 text-[#476458]">
                    Sau khi đặt lịch, khách hàng sẽ tiếp tục theo dõi trạng thái xử lý từ thu gom đến hoàn tất.
                  </p>

                  <div className="mb-8">
                    <label className="mb-3 block text-sm font-semibold text-[#24483A]">Ngày thu gom *</label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {getAvailableDates().slice(0, 8).map((date) => (
                        <button
                          key={date.value}
                          onClick={() => setSelectedDate(date.value)}
                          className={`rounded-[24px] border p-4 text-left transition-colors ${
                            selectedDate === date.value
                              ? 'border-[#103B2D] bg-[#103B2D] text-white'
                              : 'border-[#D6EEDD] bg-[#F7FCF8] text-[#103B2D] hover:border-[#A7E8B6]'
                          }`}
                        >
                          <div className="text-xs uppercase tracking-[0.16em] opacity-70">
                            {date.label.split(',')[0]}
                          </div>
                          <div className="mt-2 text-lg font-semibold">{date.label.split(' ')[1]}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-semibold text-[#24483A]">Khung giờ *</label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-[24px] border p-4 text-sm font-semibold transition-colors ${
                            selectedTime === time
                              ? 'border-[#2F855A] bg-[#2F855A] text-white'
                              : 'border-[#D6EEDD] bg-[#F7FCF8] text-[#103B2D] hover:border-[#A7E8B6]'
                          }`}
                        >
                          🕐 {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-[28px] border border-[#D6EEDD] bg-[#F5FBF6] p-5">
                    <p className="mb-3 text-sm font-medium text-[#476458]">
                      Chọn xong ngày và khung giờ thì sang bước xác nhận đơn hàng.
                    </p>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canProceedStep3}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#103B2D] px-6 py-4 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#9EB8A7] disabled:hover:translate-y-0"
                    >
                      <span>Tiếp tục sang bước 4</span>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
                  <div className="rounded-[28px] bg-[#F5FBF6] p-5">
                    <h3 className="mb-4 text-2xl font-bold text-[#103B2D]">Xác nhận đơn hàng</h3>

                    <div className="space-y-3">
                      {selectedItems.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-white p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-[#103B2D]">
                                {item.icon} {item.id === 'custom' && customItemName.trim() !== '' ? customItemName : item.name}
                              </p>
                              <p className="mt-1 text-sm text-[#476458]">
                                {item.selectedOptionLabel ?? 'Mặc định'}
                                {item.unitLabel ? ` • ${item.unitLabel}` : ''}
                                {` • ${getSelectionMeta(item)}`}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-[#2F855A]">
                              {getLineItemLabel(item)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-[#476458]">
                      <p>👤 {customerName}</p>
                      <p className="mt-2">📞 {phone}</p>
                      <p className="mt-2">📧 {email}</p>
                      <p className="mt-2">📍 {fullAddress}</p>
                      <p className="mt-2">📅 {selectedDate} • {selectedTime}</p>
                      <p className="mt-2">🚚 {handlingLabel}</p>
                      {notes.trim() !== '' && <p className="mt-2">📝 {notes}</p>}
                    </div>

                    <div className="mt-4 rounded-2xl bg-[#103B2D] p-4 text-white">
                      <div className="mb-3 space-y-2 border-b border-white/10 pb-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Tạm tính dịch vụ</span>
                          <span>{formatPrice(calculateTotal())}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Điều chỉnh bốc xếp</span>
                          <span>
                            {serviceHandlingFee >= 0 ? '+' : ''}
                            {formatPrice(serviceHandlingFee)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Tổng dự kiến</span>
                        <span className="text-2xl font-bold">{getTotalLabel()}</span>
                      </div>
                      {hasQuoteItems && (
                        <p className="mt-2 text-xs leading-5 text-white/75">
                          Có hạng mục cần báo giá riêng. Đội vận hành sẽ xác nhận lại trước khi chốt đơn.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="rounded-[28px] border border-[#D6EEDD] bg-white p-5">
                      <h4 className="mb-4 text-xl font-bold text-[#103B2D]">Thông tin khách hàng</h4>
                      <div className="space-y-3 text-sm text-[#476458]">
                        <div className="rounded-2xl bg-[#F7FCF8] p-4">
                          <p className="font-semibold text-[#103B2D]">{customerName}</p>
                          <p className="mt-1">📞 {phone}</p>
                          <p className="mt-1">📧 {email}</p>
                          <p className="mt-1">📍 {fullAddress}</p>
                        </div>
                        <p>
                          Email này sẽ được dùng để lưu hồ sơ khách hàng và gửi email xác nhận sau khi đặt lịch thành công.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[28px] border border-[#D6EEDD] bg-white p-5">
                      <h4 className="mb-3 text-xl font-bold text-[#103B2D]">Cách bốc xếp / tiếp cận hàng</h4>
                      <div className="space-y-3">
                        {[
                          {
                            id: 'inside' as const,
                            title: 'Vào tận nhà bê đồ',
                            description: 'Giá chuẩn, đội thu gom vào tận nơi lấy hàng.',
                            price: '0đ',
                          },
                          {
                            id: 'outside' as const,
                            title: 'Để đồ bên ngoài',
                            description: 'Khách tự mang đồ ra điểm lấy, giảm phí dịch vụ.',
                            price: '-30.000đ',
                          },
                          {
                            id: 'stairs' as const,
                            title: 'Vác đồ thang bộ',
                            description: 'Áp dụng khi không có thang máy hoặc cần vác qua cầu thang.',
                            price: '+50.000đ + 30.000đ/tầng thêm',
                          },
                        ].map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setHandlingMode(option.id)}
                            className={`w-full rounded-[24px] border p-4 text-left transition-colors ${
                              handlingMode === option.id
                                ? 'border-[#2F855A] bg-[#F0FBF3]'
                                : 'border-[#D6EEDD] bg-[#F7FCF8]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold text-[#103B2D]">{option.title}</p>
                                <p className="mt-1 text-sm text-[#476458]">{option.description}</p>
                              </div>
                              <span className="text-sm font-semibold text-[#2F855A]">{option.price}</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {handlingMode === 'stairs' && (
                        <div className="mt-4">
                          <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                            Số tầng cần vác *
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={stairsFloors}
                            onChange={(event) => setStairsFloors(Math.max(1, Number(event.target.value) || 1))}
                            className="w-full rounded-[24px] border border-[#D6EEDD] bg-[#F7FCF8] px-4 py-4 text-base outline-none transition-colors focus:border-[#22C55E]"
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-5 rounded-[28px] border border-[#D6EEDD] bg-[#F7FCF8] p-5">
                      <h4 className="mb-3 text-xl font-bold text-[#103B2D]">Phương thức thanh toán</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cash')}
                          className={`rounded-[24px] border p-4 text-left ${
                            paymentMethod === 'cash' ? 'border-[#2F855A] bg-white' : 'border-[#D6EEDD] bg-white'
                          }`}
                        >
                          <span className="mb-2 block text-2xl">💸</span>
                          <span className="font-semibold text-[#103B2D]">Thanh toán khi thu gom</span>
                          <span className="mt-1 block text-sm text-[#476458]">Thu tiền mặt khi staff hoàn tất thu gom</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('online')}
                          className={`rounded-[24px] border p-4 text-left ${
                            paymentMethod === 'online' ? 'border-[#2F855A] bg-white' : 'border-[#D6EEDD] bg-white'
                          }`}
                        >
                          <span className="mb-2 block text-2xl">💳</span>
                          <span className="font-semibold text-[#103B2D]">Thanh toán online</span>
                          <span className="mt-1 block text-sm text-[#476458]">Ưu tiên để giảm tỷ lệ hủy / bùng đơn</span>
                        </button>
                      </div>

                      {paymentMethod === 'cash' ? (
                        <div className="mt-4 rounded-[24px] border border-[#F4D7A4] bg-[#FFF9ED] p-4 text-sm text-[#7A5A18]">
                          <p className="font-semibold">Chính sách chống bùng đơn cho thanh toán tiền mặt</p>
                          <p className="mt-2">
                            Đơn tiền mặt sẽ cần xác nhận lại qua điện thoại trước khi chốt lịch. Nếu khách hủy sát giờ hoặc staff đến nơi nhưng không liên hệ được, hệ thống sẽ ghi nhận `no-show` và lần đặt tiếp theo bắt buộc chuyển sang thanh toán trước.
                          </p>
                          <label className="mt-3 flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={cashPolicyAccepted}
                              onChange={(event) => setCashPolicyAccepted(event.target.checked)}
                              className="mt-1"
                            />
                            <span>Tôi hiểu chính sách xác nhận đơn và xử lý trường hợp no-show đối với thanh toán tiền mặt.</span>
                          </label>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-[24px] border border-[#CFE7D7] bg-[#F0FBF3] p-4 text-sm text-[#2F855A]">
                          Thanh toán online giúp giữ lịch chắc chắn hơn và hạn chế phát sinh no-show.
                        </div>
                      )}
                    </div>

                    <div className="mt-5 rounded-[28px] border border-[#D6EEDD] bg-white p-5">
                      <h4 className="mb-3 text-xl font-bold text-[#103B2D]">
                        {currentUser ? 'Tài khoản thành viên' : 'Tài khoản là tùy chọn nhưng có lợi'}
                      </h4>
                      {currentUser ? (
                        <div className="rounded-[24px] bg-[#F5FBF6] p-4 text-sm leading-6 text-[#476458]">
                          <p className="font-semibold text-[#103B2D]">{currentUser.name}</p>
                          <p className="mt-1">
                            Đơn hiện tại sẽ được lưu vào lịch sử đặt lịch của tài khoản và dùng cho các voucher về sau.
                          </p>
                          <p className="mt-2 text-[#2F855A]">Email thành viên: {currentUser.email}</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {[
                              'Lưu tự động địa chỉ giao dịch',
                              'Nhận voucher hoặc discount thành viên',
                              'Theo dõi lịch sử đơn và trạng thái dễ hơn',
                            ].map((benefit) => (
                              <div key={benefit} className="rounded-[22px] bg-[#F5FBF6] p-4 text-sm leading-6 text-[#476458]">
                                {benefit}
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <button
                              type="button"
                              onClick={() => onAuthClick('register')}
                              className="rounded-full bg-[#103B2D] px-5 py-3 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                            >
                              Tạo tài khoản sau đơn này
                            </button>
                            <button
                              type="button"
                              onClick={() => onAuthClick('login')}
                              className="rounded-full border border-[#D6EEDD] px-5 py-3 font-semibold text-[#103B2D] transition-colors hover:bg-[#F5FBF6]"
                            >
                              Đăng nhập để lưu đơn
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!isSuccess && (
          <div className="border-t border-[#E7EFE9] bg-[#FBFDFC] p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm text-[#789185]">Tổng dự kiến</div>
                <div className="text-2xl font-bold text-[#103B2D]">{getTotalLabel()}</div>
                {hasQuoteItems && (
                  <div className="text-xs text-[#2F855A]">Có hạng mục cần báo giá thủ công</div>
                )}
              </div>

              <div className="flex gap-3">
                {step > 1 && (
                  <button
                    onClick={() => setStep((currentStep) => currentStep - 1)}
                    className="rounded-full border border-[#C9D9CF] px-6 py-3 font-semibold text-[#476458] transition-colors hover:bg-[#F1F6F3]"
                  >
                    Quay lại
                  </button>
                )}

                {step < 4 ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 rounded-full bg-[#103B2D] px-6 py-3 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    <span>
                      {step === 1
                        ? 'Tiếp tục tới bước 2'
                        : step === 2
                          ? 'Tiếp tục tới bước 3'
                          : 'Tiếp tục tới bước 4'}
                    </span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-full bg-[#2F855A] px-6 py-3 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#9EB8A7]"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <span>Xác nhận đặt lịch</span>
                        <span>✓</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
