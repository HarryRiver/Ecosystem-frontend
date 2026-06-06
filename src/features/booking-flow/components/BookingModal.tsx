'use client';

import { useEffect, useRef, useState, useMemo, useCallback, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { type AuthMode, type AuthUser } from '@/shared/lib/auth';
import { HERO_OPTION_TO_CATEGORY, isHeroQuickOption, useSyncStore, STORAGE_KEYS, defaultPricing } from '@/shared/lib/store';
import { getServices } from '@/features/booking-flow/services/catalog.service';
import { getQuote } from '@/features/booking-flow/services/orders.service';
import { getPublicVouchers } from '@/shared/services/vouchers.service';
import type { ApiService, ServiceVariant, Voucher } from '@/shared/types/api';

interface BookingPrefill {
  address?: string;
  selectedWaste?: string;
}

export type BookingSubmitHandler = (payload: BookingSubmissionPayload) => Promise<string | void>;

interface BookingModalProps {
  currentUser: AuthUser | null;
  isOpen: boolean;
  onAuthClick: (mode: AuthMode) => void;
  onClose: () => void;
  onSubmit: BookingSubmitHandler;
  prefill?: BookingPrefill | null;
}

type PricingMode = 'fixed' | 'estimate' | 'quote';
type HandlingMode = 'inside' | 'outside' | 'stairs';
type PaymentMethod = 'cash' | 'transfer';

export interface BookingSubmissionItem {
  id: string;
  serviceId?: string;
  name: string;
  icon: string;
  pricingMode: PricingMode;
  quantity: number;
  measurementValue?: number;
  basePrice: number;
  unitLabel: string;
  selectedOptionId?: string;
  selectedOptionLabel?: string;
  billingAmount: number;
  estimatedLineTotal: number | null;
}

export interface BookingSubmissionPayload {
  submittedAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    notes: string;
    address: {
      streetAddress: string;
      district: string;
      city: string;
      fullAddress: string;
    };
    isGuest: boolean;
  };
  schedule: {
    date: string;
    timeSlot: string;
  };
  services: {
    items: BookingSubmissionItem[];
    handlingMode: HandlingMode;
    handlingLabel: string;
    stairsFloors: number | null;
    handlingFee: number;
    subtotal: number;
    total: number;
    hasQuoteItems: boolean;
    voucherCode?: string;
    discountAmount?: number;
  };
  payment: {
    method: PaymentMethod;
    cashPolicyAccepted: boolean;
  };
  attachments: {
    imageFile: File | null;
    imagePreviewUrl: string | null;
    imageFileName: string | null;
    imageFileSize: number | null;
    imageFileType: string | null;
  };
}



interface AvailableDateOption {
  value: string;
  label: string;
  weekdayLabel: string;
  dayLabel: string;
  monthLabel: string;
}

interface Province {
  code: number;
  name: string;
}

interface District {
  code: number;
  name: string;
}

interface UploadedImage {
  file: File;
  previewUrl: string;
}

interface ServiceOption {
  id: string;
  label: string;
  price: number;
  unitLabel?: string;
}

interface WasteService {
  id: string;
  serviceId?: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  pricingMode: PricingMode;
  basePrice?: number;
  maxPrice?: number;
  unitLabel?: string;
  options?: ServiceOption[];
  note?: string;
}

interface SelectedWasteItem {
  id: string;
  serviceId?: string;
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

const getLocale = (lang: string) => {
  switch (lang) {
    case 'en': return 'en-US';
    case 'sv': return 'sv-SE';
    default: return 'vi-VN';
  }
};

const getCurrency = (lang: string) => {
  switch (lang) {
    case 'en': return 'USD';
    case 'sv': return 'SEK';
    default: return 'VND';
  }
};

const getPriceFormatter = (lang: string) => new Intl.NumberFormat(getLocale(lang), {
  style: 'currency',
  currency: getCurrency(lang),
  maximumFractionDigits: 0,
});

const getBookingDateWeekdayFormatter = (lang: string) => new Intl.DateTimeFormat(getLocale(lang), {
  weekday: 'short',
});

const getBookingDateDayFormatter = (lang: string) => new Intl.DateTimeFormat(getLocale(lang), {
  day: 'numeric',
});

const getBookingDateMonthFormatter = (lang: string) => new Intl.DateTimeFormat(getLocale(lang), {
  month: 'short',
});

const getBookingDateLabelFormatter = (lang: string) => new Intl.DateTimeFormat(getLocale(lang), {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const maxUploadImageSizeBytes = 5 * 1024 * 1024;



const stairsBaseFee = 50000;
const stairsPerFloorFee = 30000;

const swedenLocationData = {
  provinces: [
    { code: 1001, name: "Stockholm" },
    { code: 1002, name: "Uppsala" },
    { code: 1003, name: "Södermanland" },
    { code: 1004, name: "Östergötland" },
    { code: 1005, name: "Jönköping" },
    { code: 1006, name: "Kronoberg" },
    { code: 1007, name: "Kalmar" },
    { code: 1008, name: "Gotland" },
    { code: 1009, name: "Blekinge" },
    { code: 1010, name: "Skåne" },
    { code: 1011, name: "Halland" },
    { code: 1012, name: "Västra Götaland" },
    { code: 1013, name: "Värmland" },
    { code: 1014, name: "Örebro" },
    { code: 1015, name: "Västmanland" },
    { code: 1016, name: "Dalarna" },
    { code: 1017, name: "Gävleborg" },
    { code: 1018, name: "Västernorrland" },
    { code: 1019, name: "Jämtland" },
    { code: 1020, name: "Västerbotten" },
    { code: 1021, name: "Norrbotten" }
  ],
  districts: {
    1001: [
      { code: 100101, name: "Stockholm City" },
      { code: 100102, name: "Solna" },
      { code: 100103, name: "Sundbyberg" },
      { code: 100104, name: "Nacka" },
      { code: 100105, name: "Huddinge" },
      { code: 100106, name: "Täby" },
      { code: 100107, name: "Södertälje" }
    ],
    1010: [
      { code: 101001, name: "Malmö" },
      { code: 101002, name: "Lund" },
      { code: 101003, name: "Helsingborg" },
      { code: 101004, name: "Kristianstad" }
    ],
    1012: [
      { code: 101201, name: "Göteborg" },
      { code: 101202, name: "Borås" },
      { code: 101203, name: "Mölndal" },
      { code: 101204, name: "Trollhättan" }
    ],
    1002: [
      { code: 100201, name: "Uppsala City" },
      { code: 100202, name: "Enköping" }
    ]
  }
};


/**
 * Task 3: Map lang-agnostic hero option key → BookingModal category.
 * Nếu Hero truyền đúng key ('furniture', 'electronics'...) → dùng map trong store.
 * Fallback: dùng chính giá trị đó nếu nó đã là category id hợp lệ.
 */
function getCategoryFromPrefill(selectedWaste?: string): string {
  if (!selectedWaste) return 'all';
  const validCategories = ['furniture', 'electronics', 'metals', 'plastics', 'paper', 'clothes', 'vehicles', 'other'];
  if (validCategories.includes(selectedWaste)) {
    return selectedWaste;
  }
  if (isHeroQuickOption(selectedWaste)) {
    return HERO_OPTION_TO_CATEGORY[selectedWaste];
  }
  // Legacy fallback: nếu vẫn còn code cũ truyền Vietnamese text
  const waste = selectedWaste.toLowerCase();
  if (waste.includes('nội thất')) return 'furniture';
  if (waste.includes('điện tử')) return 'electronics';
  return 'other';
}

function formatPrice(amount: number, lang: string) {
  return getPriceFormatter(lang).format(amount);
}

function getDisplayPrice(service: WasteService, lang: string, t: any) {
  if (service.pricingMode === 'quote') {
    return t('booking.quoteLabel');
  }

  const price = service.options?.[0]?.price ?? service.basePrice ?? 0;
  
  if (service.maxPrice) {
    return `${formatPrice(price, lang)} - ${formatPrice(service.maxPrice, lang)}${service.unitLabel ?? ''}`;
  }

  if (service.unitLabel === '/kg') {
    return `${formatPrice(price, lang)}/kg`;
  }

  return `Từ ${formatPrice(price, lang)}`;
}

function createSelectedItem(service: WasteService, optionId?: string): SelectedWasteItem {
  const selectedOption = service.options?.find((option) => option.id === optionId) ?? service.options?.[0];
  const unitLabel = selectedOption?.unitLabel ?? service.unitLabel ?? '';

  return {
    id: service.id,
    serviceId: service.serviceId,
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

function formatLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createAvailableDateOption(date: Date, lang: string): AvailableDateOption {
  return {
    value: formatLocalDateValue(date),
    label: getBookingDateLabelFormatter(lang).format(date),
    weekdayLabel: getBookingDateWeekdayFormatter(lang).format(date),
    dayLabel: getBookingDateDayFormatter(lang).format(date),
    monthLabel: getBookingDateMonthFormatter(lang).format(date),
  };
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BookingModal({ currentUser, isOpen, onAuthClick: _onAuthClick, onClose, onSubmit, prefill }: BookingModalProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [livePricing] = useSyncStore(STORAGE_KEYS.pricing, defaultPricing);

  const [apiServices, setApiServices] = useState<ApiService[]>([]);
  
  useEffect(() => {
    if (!isOpen) return;
    getServices()
      .then((data) => {
        if (Array.isArray(data)) setApiServices(data);
      })
      .catch((err) => console.error('Failed to fetch services:', err));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    setIsLoadingVouchers(true);

    getPublicVouchers()
      .then((data) => {
        if (!ignore && Array.isArray(data)) {
          setPublicVouchers(data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch vouchers:', err);
        if (!ignore) {
          setPublicVouchers([]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingVouchers(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  const serviceIconMap: Record<string, string> = {
    furniture: '🛋️',
    electronics: '📺',
    metals: '🔩',
    plastics: '🪣',
    paper: '📦',
    clothes: '👕',
    vehicles: '🛵',
    other: '🧱',
  };


  const wasteServices = useMemo<WasteService[]>(() => {
    // If API data is available, parse it
    if (apiServices.length > 0) {
      const result: WasteService[] = [];
      
      apiServices.forEach(apiService => {
        const groups = new Map<string, ServiceVariant[]>();
        
        apiService.variants?.forEach(v => {
          if (!v.active) return;
          const existing = groups.get(v.label) || [];
          existing.push(v);
          groups.set(v.label, existing);
        });
        
        groups.forEach((items, label) => {
          const hasSizes = items.some(i => i.size && i.size.trim() !== '');
          const minPrice = Math.min(...items.map(i => i.price));
          const maxPriceCandidate = Math.max(...items.map(i => i.price));
          const maxPrice = minPrice !== maxPriceCandidate ? maxPriceCandidate : undefined;
          
          let options: ServiceOption[] | undefined;
          if (hasSizes && items.length > 1) {
            options = items.map(i => ({
              id: i.id,
              label: i.size || i.label,
              price: i.price,
              unitLabel: i.unit === 'kg' ? '/kg' : i.unit === 'bag' ? '/bag' : '',
            })).sort((a, b) => a.price - b.price);
          }
          
          const unitL = items[0].unit === 'kg' ? '/kg' : items[0].unit === 'bag' ? '/bag' : '';
          const pricingMode = apiService.pricing_type === 'quote' ? 'quote' : 
                              (items[0].unit === 'kg' || items[0].price === 0 ? 'estimate' : 'fixed');
          
          result.push({
            id: items[0].id,
            serviceId: apiService.id,
            name: label,
            icon: items[0].icon || serviceIconMap[apiService.code] || '📦',
            description: '',
            category: apiService.code === 'bao_gia' ? 'other' : apiService.code,
            pricingMode: pricingMode as PricingMode,
            basePrice: minPrice,
            maxPrice: maxPrice,
            unitLabel: unitL,
            options,
          });
        });
      });

      result.push({ id: 'custom', name: t('booking.services.custom.name', 'Mô tả riêng'), icon: '✨', description: t('booking.services.custom.desc', 'Khác, Xây dựng...'), category: 'other', pricingMode: 'quote' as const });
      return result;
    }

    // Fallback static data
    // Fallback static data
    /*
    return wasteServiceDefs.map((def) => {
      const livePriceRec = livePricing.find(p => p.id === def.id);
      const svcT = t(`booking.services.${def.id}`, { returnObjects: true }) as Record<string, any>;
      const unitLabel = def.unitLabelKey ? t(`booking.unitLabels.${def.unitLabelKey}`) : '';
      const options = def.optionDefs?.map((opt) => ({
        id: opt.id,
        label: t(`booking.services.wardrobe.options.${opt.id}`, opt.id),
        price: opt.price,
        unitLabel: t(`booking.unitLabels.${opt.unitLabelKey}`),
      }));
      return {
        id: def.id,
        name: svcT?.name ?? def.id,
        icon: def.icon,
        description: svcT?.desc ?? '',
        category: def.categoryKey,
        pricingMode: def.pricingMode,
        basePrice: livePriceRec?.price ?? def.basePrice,
        maxPrice: (def as any).maxPrice,
        unitLabel,
        options,
        note: svcT?.note,
      };
    });
    */
    return [];
  }, [t, livePricing, apiServices]);

  const categories = useMemo(() => [
    { key: 'all',         label: t('booking.categoryAll') },
    { key: 'furniture',   label: t('booking.categories.furniture') },
    { key: 'electronics', label: t('booking.categories.electronics') },
    { key: 'metals',      label: t('booking.categories.metals') },
    { key: 'plastics',    label: t('booking.categories.plastics') },
    { key: 'paper',       label: t('booking.categories.paper') },
    { key: 'clothes',     label: t('booking.categories.clothes') },
    { key: 'vehicles',    label: t('booking.categories.vehicles') },
    { key: 'other',       label: t('booking.categories.other') },
  ], [t]);

  const hasPrefilled = useRef(false);
  const activeSubmitIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<SelectedWasteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [customItemName, setCustomItemName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('TP. Hồ Chí Minh');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [handlingMode, setHandlingMode] = useState<HandlingMode>('inside');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [stairsFloors, _setStairsFloors] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderCodeFromApi, setOrderCodeFromApi] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ discount_amount: number; voucher_code: string } | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [publicVouchers, setPublicVouchers] = useState<Voucher[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  const [nameTouched, setNameTouched] = useState(false);
  const [streetTouched, setStreetTouched] = useState(false);
  const [districtTouched, setDistrictTouched] = useState(false);
  const [cityTouched, setCityTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [serviceStepTouched, setServiceStepTouched] = useState(false);
  const [scheduleStepTouched, setScheduleStepTouched] = useState(false);

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
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() + index + 1);

      return createAvailableDateOption(date, currentLang);
    });
  };

  const availableDates = getAvailableDates();
  const selectedCustomItem = selectedItems.find((item) => item.id === 'custom');
  const hasQuoteItems = selectedItems.some((item) => item.pricingMode === 'quote');

  const fullAddress = `${streetAddress}, ${district}, ${city}`.replace(/^,\s*|,\s*$/g, '');
  const isCustomerNameValid = customerName.trim().length >= 2;
  const isStreetAddressValid = streetAddress.trim().length >= 5;
  const isDistrictValid = district.trim().length >= 2;
  const isCityValid = city.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const normalizedPhone = phone.replace(/\s+/g, '');
  const selectedDateLabel = availableDates.find((date) => date.value === selectedDate)?.label ?? selectedDate;
  const isPhoneValid = /^(0|\+84)\d{9,10}$/.test(normalizedPhone);

  const canProceedStep1 =
    selectedItems.length > 0 &&
    selectedItems.every((item) => !isWeightBasedItem(item) || (item.measurementValue ?? 0) > 0) &&
    (!selectedCustomItem || customItemName.trim().length >= 3);
  const canProceedStep2 =
    isCustomerNameValid &&
    isStreetAddressValid &&
    isDistrictValid &&
    isCityValid &&
    isPhoneValid &&
    isEmailValid;
  const canProceedStep3 = selectedDate !== '' && selectedTime !== '';
  const canSubmit = canProceedStep2 && canProceedStep3;

  const serviceHandlingFee =
    handlingMode === 'outside'
      ? -30000
      : handlingMode === 'stairs'
        ? stairsBaseFee + Math.max(0, stairsFloors - 1) * stairsPerFloorFee
        : 0;

  const handlingLabel =
    handlingMode === 'outside'
      ? t('booking.handling.outside')
      : handlingMode === 'stairs'
        ? `${t('booking.handling.stairs')} (${stairsFloors} tầng)`
        : t('booking.handling.inside');

  const calculateTotal = () => {
    const rawTotal = selectedItems.reduce((total, item) => {
      if (item.pricingMode === 'quote') {
        return total;
      }
      return total + item.basePrice * getBillingAmount(item);
    }, 0);
    return rawTotal; // The raw total before discount
  };

  const voucherEligibleAmount = Math.max(0, calculateTotal() + serviceHandlingFee);

  const getDiscountAmount = () => appliedVoucher?.discount_amount || 0;

  const calculateFinalTotal = () => {
    return Math.max(0, calculateTotal() + serviceHandlingFee - getDiscountAmount());
  };

  const getTotalLabel = () => {
    const finalTotal = calculateFinalTotal();

    if (hasQuoteItems && calculateTotal() + serviceHandlingFee > 0) {
      return `Từ ${formatPrice(finalTotal, currentLang)}`;
    }

    if (hasQuoteItems) {
      return t('booking.quoteLabel');
    }

    return formatPrice(finalTotal, currentLang);
  };

  const getLineItemLabel = (item: SelectedWasteItem) => {
    if (item.pricingMode === 'quote') {
      return t('booking.quoteLabel');
    }

    const lineTotal = item.basePrice * getBillingAmount(item);
    return item.pricingMode === 'estimate' ? `Tạm tính ${formatPrice(lineTotal, currentLang)}` : formatPrice(lineTotal, currentLang);
  };

  const getVoucherDiscountLabel = (voucher: Voucher) => {
    if (voucher.type === 'percent') {
      const maxText = voucher.max_discount
        ? ` tối đa ${formatPrice(voucher.max_discount, currentLang)}`
        : '';
      return `Giảm ${voucher.value}%${maxText}`;
    }

    return `Giảm ${formatPrice(voucher.value, currentLang)}`;
  };

  const getVoucherRequirementLabel = (voucher: Voucher) => {
    if (voucher.min_order_value <= 0) {
      return 'Áp dụng cho mọi đơn';
    }

    return `Đơn từ ${formatPrice(voucher.min_order_value, currentLang)}`;
  };

  const canUsePublicVoucher = (voucher: Voucher) => {
    return !hasQuoteItems && voucherEligibleAmount >= voucher.min_order_value;
  };

  const filteredServices = useMemo(() => {
    return wasteServices.filter((service) => {
      const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const haystack = `${service.name} ${service.description}`.toLowerCase();
      return matchesCategory && (normalizedQuery === '' || haystack.includes(normalizedQuery));
    });
  }, [wasteServices, activeCategory, searchQuery]);

  const groupedServices = useMemo(() => {
    return categories
      .filter((cat) => cat.key !== 'all')
      .map((cat) => ({
        categoryKey: cat.key,
        categoryLabel: cat.label,
        items: filteredServices.filter((service) => service.category === cat.key),
      }))
      .filter((group) => group.items.length > 0);
  }, [categories, filteredServices]);

  const selectService = useCallback((service: WasteService) => {
    setSelectedItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === service.id);

      if (existingItem) {
        return currentItems.filter((item) => item.id !== service.id);
      }

      return [...currentItems, createSelectedItem(service)];
    });
  }, []);

  const selectServiceOption = useCallback((service: WasteService, option: ServiceOption) => {
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
  }, []);

  const updateQuantity = useCallback((id: string, change: number) => {
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
  }, []);

  const updateMeasurementValue = useCallback((id: string, value: number) => {
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
  }, []);

  const handleImageUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const fileName = file.name.toLowerCase();
    const hasImageMimeType = file.type.startsWith('image/');
    const hasImageExtension = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'].some((extension) =>
      fileName.endsWith(extension),
    );

    if (!hasImageMimeType && !hasImageExtension) {
      setImageError('Chỉ hỗ trợ file ảnh cho phần đính kèm tham khảo.');
      return;
    }

    if (file.size > maxUploadImageSizeBytes) {
      setImageError(`Ảnh vượt quá ${formatFileSize(maxUploadImageSizeBytes)}. Vui lòng chọn file nhỏ hơn.`);
      return;
    }

    setImageError(null);
    setUploadedImage({
      file,
      previewUrl: URL.createObjectURL(file),
    });
  }, []);

  const buildSubmissionPayload = (): BookingSubmissionPayload => {
    const subtotal = calculateTotal();
    const total = calculateFinalTotal();

    return {
      submittedAt: new Date().toISOString(),
      customer: {
        name: customerName.trim(),
        email: email.trim(),
        phone: normalizedPhone,
        notes: notes.trim(),
        address: {
          streetAddress: streetAddress.trim(),
          district: district.trim(),
          city: city.trim(),
          fullAddress,
        },
        isGuest: currentUser === null,
      },
      schedule: {
        date: selectedDate,
        timeSlot: selectedTime,
      },
      services: {
        items: selectedItems.map((item) => ({
          id: item.id,
          serviceId: item.serviceId,
          name: item.name,
          icon: item.icon,
          pricingMode: item.pricingMode,
          quantity: item.quantity,
          measurementValue: item.measurementValue,
          basePrice: item.basePrice,
          unitLabel: item.unitLabel,
          selectedOptionId: item.selectedOptionId,
          selectedOptionLabel: item.selectedOptionLabel,
          billingAmount: getBillingAmount(item),
          estimatedLineTotal: item.pricingMode === 'quote' ? null : item.basePrice * getBillingAmount(item),
        })),
        handlingMode,
        handlingLabel,
        stairsFloors: handlingMode === 'stairs' ? stairsFloors : null,
        handlingFee: serviceHandlingFee,
        subtotal,
        total,
        hasQuoteItems,
        voucherCode: appliedVoucher?.voucher_code || undefined,
        discountAmount: appliedVoucher?.discount_amount || undefined,
      },
      payment: {
        method: paymentMethod,
        cashPolicyAccepted: true,
      },
      attachments: {
        imageFile: uploadedImage?.file ?? null,
        imagePreviewUrl: uploadedImage?.previewUrl ?? null,
        imageFileName: uploadedImage?.file.name ?? null,
        imageFileSize: uploadedImage?.file.size ?? null,
        imageFileType: uploadedImage?.file.type ?? null,
      },
    };
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setEmailTouched(true);
    setPhoneTouched(true);

    if (!canSubmit) {
      return;
    }

    const submitId = activeSubmitIdRef.current + 1;
    activeSubmitIdRef.current = submitId;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const returnedCode = await onSubmit(buildSubmissionPayload());

      if (!isMountedRef.current || activeSubmitIdRef.current !== submitId) {
        return;
      }

      if (typeof returnedCode === 'string') {
        setOrderCodeFromApi(returnedCode);
      }


      setIsSuccess(true);
    } catch (error) {
      if (!isMountedRef.current || activeSubmitIdRef.current !== submitId) {
        return;
      }

      setSubmitError(error instanceof Error ? error.message : 'Khong the gui booking. Vui long thu lai.');
    } finally {
      if (isMountedRef.current && activeSubmitIdRef.current === submitId) {
        setIsSubmitting(false);
      }
    }
  };

  const getSubmitError = () => {
    if (submitError) return submitError;
    if (serviceStepTouched && !canProceedStep1) return "Vui lòng chọn ít nhất một hạng mục.";
    if (scheduleStepTouched && !canProceedStep3) return "Vui lòng chọn ngày và giờ thu gom.";
    return null;
  };

  const resetForm = () => {
    setStep(1);
    setSelectedItems([]);
    setSearchQuery('');
    setActiveCategory('all');
    setCustomItemName('');
    setCustomerName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setHandlingMode('inside');
    setPaymentMethod('cash');
    setStreetAddress('');
    setDistrict('');
    setCity('TP. Hồ Chí Minh');
    setSelectedDate('');
    setSelectedTime('');
    setUploadedImage(null);
    setImageError(null);
    setIsSubmitting(false);
    setIsSuccess(false);
    setSubmitError(null);
    setVoucherCodeInput('');
    setAppliedVoucher(null);
    setVoucherError(null);
    setNameTouched(false);
    setStreetTouched(false);
    setDistrictTouched(false);
    setCityTouched(false);
    setEmailTouched(false);
    setPhoneTouched(false);
    setServiceStepTouched(false);
    setScheduleStepTouched(false);
    hasPrefilled.current = false;
  };

  const handleApplyVoucher = async (codeOverride?: string) => {
    const normalizedCode = (codeOverride ?? voucherCodeInput).trim().toUpperCase();
    if (!normalizedCode || hasQuoteItems) return;
    setVoucherCodeInput(normalizedCode);
    setIsApplyingVoucher(true);
    setVoucherError(null);
    try {
      const result = await getQuote({
        items: selectedItems.map((item) => ({
          service_id: item.serviceId || item.id,
          service_variant_id: item.selectedOptionId,
          quantity: item.quantity,
          measurement_value: item.measurementValue,
        })),
        handling_mode: handlingMode,
        stairs_floors: handlingMode === 'stairs' ? stairsFloors : undefined,
        voucher_code: normalizedCode,
      });
      
      if (result.discount_amount > 0) {
        setAppliedVoucher({
          discount_amount: result.discount_amount,
          voucher_code: normalizedCode,
        });
      } else {
        setVoucherError('Mã không hợp lệ hoặc không đủ điều kiện đơn hàng.');
        setAppliedVoucher(null);
      }
    } catch (e: any) {
      console.error(e);
      setVoucherError('Lỗi kiểm tra mã giảm giá!');
      setAppliedVoucher(null);
    } finally {
      setIsApplyingVoucher(false);
    }
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

    if (step === 3) {
      setScheduleStepTouched(true);
      if (!canProceedStep3) {
        return;
      }
    }

    setStep((currentStep) => currentStep + 1);
  };

  useEffect(() => {
    if (isOpen) {
      return;
    }

    activeSubmitIdRef.current += 1;
    resetForm();
  }, [isOpen]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      activeSubmitIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage.previewUrl);
      }
    };
  }, [uploadedImage]);

  useEffect(() => {
    if (!currentUser || !isOpen) {
      return;
    }

    setCustomerName((currentName) => currentName || currentUser.name);
    setEmail((currentEmail) => currentEmail || currentUser.email);
    setPhone((currentPhone) => currentPhone || currentUser.phone);
    setStreetAddress((currentStreet) => currentStreet || currentUser.streetAddress || '');
    setDistrict((currentDistrict) => currentDistrict || currentUser.district || '');
    setCity((currentCity) => (currentCity === 'TP. Hồ Chí Minh' || !currentCity) ? (currentUser.city || currentCity) : currentCity);
  }, [currentUser, isOpen]);

  useEffect(() => {
    if (!isOpen || !prefill) {
      return;
    }

    if (!hasPrefilled.current) {
      if (prefill.selectedWaste) {
        const category = getCategoryFromPrefill(prefill.selectedWaste);
        setActiveCategory(category);
        // Task 3: chỉ set search query nếu selectedWaste là service ID cụ thể,
        // không phải category-level option (hero quick options luôn là category-level)
        const isQuickOption = isHeroQuickOption(prefill.selectedWaste);
        const validCategories = ['furniture', 'electronics', 'metals', 'plastics', 'paper', 'clothes', 'vehicles', 'other'];
        const isCategoryKey = validCategories.includes(prefill.selectedWaste);

        if (!isQuickOption && !isCategoryKey) {
          // service id cụ thể: tìm và pre-select
          const targetService = wasteServices.find((s) => s.id === prefill.selectedWaste);
          if (targetService) {
            setSelectedItems([createSelectedItem(targetService)]);
          } else {
            setSearchQuery(prefill.selectedWaste);
          }
        } else {
          // category-level quick option: chỉ set category, clear search
          setSearchQuery('');
        }
      }

      if (prefill.address) {
        setStreetAddress(prefill.address);
        setCity('');
        setDistrict('');
      }


      
      hasPrefilled.current = true;
    }
  }, [isOpen, prefill, wasteServices]);

  useEffect(() => {
    const fetchProvinces = async () => {
      if (currentLang === 'sv') {
        setProvinces(swedenLocationData.provinces);
        setCity('');
        setDistrict('');
        return;
      }

      setIsLoadingProvinces(true);
      try {
        const response = await fetch('https://provinces.open-api.vn/api/p/');
        if (response.ok) {
          const data = await response.json();
          setProvinces(data || []);
        }
      } catch (error) {
        console.error('Error fetching provinces:', error);
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, [currentLang]);

  useEffect(() => {
    if (!city || provinces.length === 0) {
      setDistricts([]);
      return;
    }

    const province = provinces.find((p) => p.name === city);
    if (!province) {
      setDistricts([]);
      return;
    }

    const fetchDistricts = async () => {
      if (currentLang === 'sv') {
        const swedishDistricts = (swedenLocationData.districts as any)[province.code] || [];
        setDistricts(swedishDistricts);
        return;
      }

      setIsLoadingDistricts(true);
      try {
        const response = await fetch(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`);
        if (response.ok) {
          const data = await response.json();
          setDistricts(data.districts || []);
        }
      } catch (error) {
        console.error('Error fetching districts:', error);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [city, provinces, currentLang]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, isSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 [perspective:1000px]">
      <div 
        className="absolute inset-0 bg-[#0B1511]/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />
      
      <div className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-[0_20px_80px_rgba(0,0,0,0.25)] animate-fadeInUp flex flex-col transform-gpu [backface-visibility:hidden]">
        <div className="shrink-0 bg-[linear-gradient(135deg,#103B2D_0%,#18543F_55%,#1D6B4E_100%)] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#A7E8B6]">
                {t('booking.badge')}
              </p>
              <h2 className="text-3xl font-bold">{t('booking.title')}</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/75">
                {t('booking.subtitle')}
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
                { stepNumber: 1, label: t('booking.steps.items') },
                { stepNumber: 2, label: t('booking.steps.address') },
                { stepNumber: 3, label: t('booking.steps.schedule') },
                { stepNumber: 4, label: t('booking.steps.confirm') },
              ].map((progress) => (
                <div
                  key={progress.stepNumber}
                  className={`rounded-2xl border px-4 py-3 text-sm transition-colors ${
                    step >= progress.stepNumber
                      ? 'border-[#8DE0A6]/40 bg-[#8DE0A6]/12 text-white'
                      : 'border-white/10 bg-white/6 text-white/60'
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
          className="flex-1 overflow-y-auto overflow-x-hidden p-6 [scrollbar-gutter:stable] [scroll-behavior:auto] [-webkit-overflow-scrolling:touch] [contain:content] transform-gpu"
        >
          {isSuccess ? (
            <div className="py-8 px-2">
              {/* ── Animated success badge ── */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="h-24 w-24 rounded-full bg-secondary-light flex items-center justify-center shadow-[0_0_0_8px_rgba(47,133,90,0.08)]">
                    <svg className="h-12 w-12 text-primary" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="absolute -right-1 -top-1 text-2xl">🎉</span>
                </div>

                <h3 className="text-3xl font-bold text-secondary">{t('booking.success.title')}</h3>
                <p className="mt-2 max-w-md text-[#5D776A]">
                  {t('booking.success.desc', { email })}
                </p>

                {/* Order code pill */}
                <div className="mt-4 flex items-center gap-2 rounded-full border border-[#C3E5CE] bg-[#F3FBF5] px-5 py-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#6D877A]">Mã đơn hàng</span>
                  <span className="font-mono text-lg font-bold text-secondary">
                    {orderCodeFromApi || `EC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`}
                  </span>
                </div>
              </div>

              {/* ── Order summary card ── */}
              <div className="mt-8 rounded-[28px] border border-[#D7ECDD] bg-[#F9FCF9] p-6 space-y-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8AA89A]">Chi tiết đơn hàng</p>

                {/* Items */}
                <div className="space-y-2">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <p className="font-semibold text-secondary text-sm">{item.name}</p>
                          <p className="text-xs text-[#8AA89A]">×{item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-primary text-sm">
                        {item.pricingMode === 'quote'
                          ? 'Báo giá'
                          : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
                              item.basePrice * getBillingAmount(item)
                            )}
                      </p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between rounded-[18px] bg-secondary px-4 py-3">
                    <p className="text-sm font-bold text-[#A7E8B6]">Tổng cộng</p>
                    <p className="text-lg font-bold text-white">{getTotalLabel()}</p>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: '👤', label: 'Khách hàng', value: customerName },
                    { icon: '📞', label: 'Số điện thoại', value: phone },
                    { icon: '📧', label: 'Email', value: email },
                    { icon: '📅', label: 'Lịch hẹn', value: `${selectedDateLabel} • ${selectedTime}` },
                    { icon: '📍', label: 'Địa chỉ', value: fullAddress },
                    { icon: '🚚', label: 'Hình thức', value: handlingLabel },
                    {
                      icon: '💳',
                      label: 'Thanh toán',
                      value: paymentMethod === 'cash' ? 'Thanh toán khi thu gom' : 'Chuyển khoản ngân hàng',
                    },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="rounded-[18px] bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8AA89A]">{label}</p>
                      <p className="mt-1 flex items-start gap-2 text-sm font-semibold text-secondary">
                        <span>{icon}</span>
                        <span>{value || '—'}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── CTA buttons ── */}
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={onClose}
                  className="rounded-full bg-secondary px-10 py-3.5 font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(16,59,45,0.25)]"
                >
                  Về trang chủ
                </button>
                <button
                  onClick={() => { resetForm(); setStep(1); }}
                  className="rounded-full border border-[#C3E5CE] bg-white px-10 py-3.5 font-semibold text-primary transition-all hover:bg-[#F3FBF5]"
                >
                  Đặt thêm đơn
                </button>
              </div>
            </div>

          ) : (
            <>
              {step === 1 && (
                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <div className="mb-5 rounded-[28px] border border-[#D6EEDD] bg-[#F7FCF8] p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-secondary">{t('booking.steps.items')}</h3>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[#476458]">
                          {t('booking.selectedCount', { count: selectedItems.length })}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-4">
                        <div className="relative">
                          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#789185]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder={t('booking.searchPlaceholder')}
                            className="w-full rounded-2xl border border-[#D6EEDD] bg-white pl-11 pr-4 py-3.5 text-sm outline-none transition-colors placeholder:text-[#789185] hover:border-[#22C55E]/50 focus:border-[#22C55E] focus:ring-4 focus:ring-[#22C55E]/10"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((cat) => (
                            <button
                              key={cat.key}
                              type="button"
                              onClick={() => setActiveCategory(cat.key)}
                              className={`rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                                activeCategory === cat.key
                                  ? 'bg-secondary text-white'
                                  : 'bg-white text-[#476458] hover:bg-secondary-light'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {groupedServices.map((group) => (
                        <section key={group.categoryKey}>
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                              {group.categoryLabel}
                            </h4>
                            <span className="text-xs text-[#789185]">{group.items.length} {t('booking.choices')}</span>
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
                                      ? 'border-primary bg-[#F0FBF3] shadow-[0_16px_40px_rgba(15,61,46,0.08)]'
                                      : 'border-[#E3ECE6] bg-white hover:border-[#A7E8B6] hover:shadow-[0_12px_30px_rgba(15,61,46,0.05)]'
                                  }`}
                                >
                                  <div className="mb-3 flex items-start gap-3">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F7FCF8] text-3xl">
                                      {service.icon}
                                    </div>
                                    <div className="flex min-h-14 flex-col justify-center gap-1">
                                      <h5 className="text-lg font-semibold leading-tight text-secondary">{service.name}</h5>
                                      <div className="w-fit rounded-full border border-[#D6EEDD] bg-[#F7FCF8] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary">
                                        {getDisplayPrice(service, currentLang, t)}
                                      </div>
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
                                              ? 'bg-secondary text-white'
                                              : 'bg-[#F1F4F2] text-[#476458] hover:bg-secondary-light'
                                          }`}
                                        >
                                          {option.label} • {formatPrice(option.price, currentLang)}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {isSelected && selectedItem && (
                                    <div
                                      className="mt-4 flex items-center justify-between border-t border-[#D6EEDD] pt-4"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      <div className="text-sm text-[#476458]">
                                        <span className="font-medium text-secondary">
                                          {selectedItem.selectedOptionLabel ?? 'Default'}
                                        </span>
                                      </div>
                                      {isWeightBasedItem(selectedItem) ? (
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            min="0"
                                            value={selectedItem.measurementValue ?? 0}
                                            onChange={(event) =>
                                              updateMeasurementValue(
                                                service.id,
                                                Number(event.target.value),
                                              )
                                            }
                                            className="w-24 rounded-2xl border border-[#D6EEDD] bg-white px-3 py-2 text-right text-sm font-semibold text-secondary outline-none"
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
                                          <span className="min-w-6 text-center font-semibold text-secondary">
                                            {selectedItem.quantity}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => updateQuantity(service.id, 1)}
                                            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-lg text-white"
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

                  <aside className="lg:sticky lg:top-0 lg:h-fit space-y-5">
                    <div className="rounded-[28px] border border-[#D6EEDD] bg-[#F7FCF8] p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-semibold text-secondary">{t('booking.summary.items')}</h4>
                      </div>

                      {selectedItems.length > 0 ? (
                        <div className="space-y-3">
                          {selectedItems.map((item) => (
                            <div key={item.id} className="rounded-2xl bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-secondary">
                                    {item.icon} {item.id === 'custom' && customItemName.trim() !== '' ? customItemName : item.name}
                                  </p>
                                  <p className="mt-1 text-sm text-[#476458]">
                                    {item.selectedOptionLabel ?? 'Default'}
                                    {` • ${getSelectionMeta(item)}`}
                                  </p>
                                </div>
                                <span className="text-sm font-semibold text-primary">
                                  {getLineItemLabel(item)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm leading-6 text-[#476458]">
                          {t('booking.noItems', 'Chưa có hạng mục nào được chọn.')}
                        </p>
                      )}
                    </div>

                    <div className="rounded-[28px] border border-[#D6EEDD] bg-[#F7FCF8] p-5">
                      <div className="mb-4">
                        <h4 className="font-semibold text-secondary">{t('booking.labels.photo')}</h4>
                        <p className="mt-1 text-xs text-[#476458]">{t('booking.labels.photoDesc')}</p>
                      </div>

                      {uploadedImage ? (
                        <div className="relative group">
                          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[#D6EEDD] bg-white">
                            <img
                              src={uploadedImage.previewUrl}
                              alt="Upload preview"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setUploadedImage(null)}
                            className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-110"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D6EEDD] bg-white py-8 transition-colors hover:border-secondary hover:bg-[#F0FBF3]">
                          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#F7FCF8] text-2xl">
                            📸
                          </div>
                          <span className="text-sm font-medium text-secondary">
                            {t('booking.labels.choosePhoto', 'Chọn hoặc chụp ảnh')}
                          </span>
                          <span className="mt-1 text-xs text-[#789185]">JPG, PNG, WEBP (Max 5MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}

                      {imageError && (
                        <p className="mt-2 text-xs font-medium text-red-500">{imageError}</p>
                      )}
                    </div>


                  </aside>
                </div>
              )}

              {step === 2 && (
                <div className="mx-auto max-w-3xl">
                  <h3 className="mb-2 text-2xl font-bold text-secondary">{t('booking.steps.address')}</h3>
                  <div className="space-y-5 mt-6">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                        {t('booking.labels.name')} *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        onBlur={() => setNameTouched(true)}
                        className={`w-full rounded-[24px] border px-4 py-4 text-base outline-none transition-colors ${
                          nameTouched && !isCustomerNameValid
                            ? 'border-red-500 bg-red-50 focus:border-red-600'
                            : 'border-[#D6EEDD] bg-[#F7FCF8] focus:border-[#22C55E]'
                        }`}
                      />
                      {nameTouched && !isCustomerNameValid && (
                        <p className="mt-1.5 ml-4 text-sm font-medium text-red-500 animate-fadeIn">
                          {t('booking.errors.name')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                        {t('booking.labels.street')} *
                      </label>
                      <input
                        type="text"
                        value={streetAddress}
                        onChange={(event) => setStreetAddress(event.target.value)}
                        onBlur={() => setStreetTouched(true)}
                        className={`w-full rounded-[24px] border px-4 py-4 text-base outline-none transition-colors ${
                          streetTouched && !isStreetAddressValid
                            ? 'border-red-500 bg-red-50 focus:border-red-600'
                            : 'border-[#D6EEDD] bg-[#F7FCF8] focus:border-[#22C55E]'
                        }`}
                      />
                      {streetTouched && !isStreetAddressValid && (
                        <p className="mt-1.5 ml-4 text-sm font-medium text-red-500 animate-fadeIn">
                          {t('booking.errors.street')}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                          {t('booking.labels.city')} *
                        </label>
                        <select
                          value={city}
                          onChange={(event) => {
                            setCity(event.target.value);
                            setDistrict('');
                          }}
                          onBlur={() => setCityTouched(true)}
                          className={`w-full rounded-[24px] border px-4 py-4 text-base outline-none appearance-none transition-colors ${
                            cityTouched && !isCityValid
                              ? 'border-red-500 bg-red-50 focus:border-red-600'
                              : 'border-[#D6EEDD] bg-[#F7FCF8] focus:border-[#22C55E]'
                          }`}
                        >
                          <option value="">{isLoadingProvinces ? 'Đang tải...' : t('booking.labels.selectCity', 'Chọn Thành phố')}</option>
                          {provinces.map((p) => (
                            <option key={p.code} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        {cityTouched && !isCityValid && (
                          <p className="mt-1.5 ml-4 text-sm font-medium text-red-500 animate-fadeIn">
                            {t('booking.errors.city')}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                          {t('booking.labels.district')} *
                        </label>
                        <select
                          value={district}
                          onChange={(event) => setDistrict(event.target.value)}
                          onBlur={() => setDistrictTouched(true)}
                          disabled={!city || isLoadingDistricts}
                          className={`w-full rounded-[24px] border px-4 py-4 text-base outline-none appearance-none disabled:opacity-50 transition-colors ${
                            districtTouched && !isDistrictValid
                              ? 'border-red-500 bg-red-50 focus:border-red-600'
                              : 'border-[#D6EEDD] bg-[#F7FCF8] focus:border-[#22C55E]'
                          }`}
                        >
                          <option value="">{isLoadingDistricts ? 'Đang tải...' : t('booking.labels.selectDistrict', 'Chọn Quận/Huyện')}</option>
                          {districts.map((d) => (
                            <option key={d.code} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                        {districtTouched && !isDistrictValid && (
                          <p className="mt-1.5 ml-4 text-sm font-medium text-red-500 animate-fadeIn">
                            {t('booking.errors.district')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                          {t('booking.labels.phone')} *
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          onBlur={() => setPhoneTouched(true)}
                          className={`w-full rounded-[24px] border px-4 py-4 text-base outline-none transition-colors ${
                            phoneTouched && !isPhoneValid
                              ? 'border-red-500 bg-red-50 focus:border-red-600'
                              : 'border-[#D6EEDD] bg-[#F7FCF8] focus:border-[#22C55E]'
                          }`}
                        />
                        {phoneTouched && !isPhoneValid && (
                          <p className="mt-1.5 ml-4 text-sm font-medium text-red-500 animate-fadeIn">
                            {t('booking.errors.phone')}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#24483A]">
                          {t('booking.labels.email')} *
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          onBlur={() => setEmailTouched(true)}
                          className={`w-full rounded-[24px] border px-4 py-4 text-base outline-none transition-colors ${
                            emailTouched && !isEmailValid
                              ? 'border-red-500 bg-red-50 focus:border-red-600'
                              : 'border-[#D6EEDD] bg-[#F7FCF8] focus:border-[#22C55E]'
                          }`}
                        />
                        {emailTouched && !isEmailValid && (
                          <p className="mt-1.5 ml-4 text-sm font-medium text-red-500 animate-fadeIn">
                            {t('booking.errors.email')}
                          </p>
                        )}
                      </div>
                    </div>


                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="mx-auto max-w-3xl">
                  <h3 className="mb-8 text-2xl font-bold text-secondary">{t('booking.steps.schedule')}</h3>
                  <div className="mb-8">
                    <label className="mb-3 block text-sm font-semibold text-[#24483A]">{t('booking.labels.date')} *</label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {availableDates.slice(0, 8).map((date) => (
                        <button
                          key={date.value}
                          onClick={() => setSelectedDate(date.value)}
                          className={`rounded-[24px] border p-4 text-left transition-colors ${
                            selectedDate === date.value
                              ? 'border-secondary bg-secondary text-white'
                              : 'border-[#D6EEDD] bg-[#F7FCF8] text-secondary hover:border-[#A7E8B6]'
                          }`}
                        >
                          <div className="text-xs uppercase tracking-[0.16em] opacity-70">
                            {date.weekdayLabel}
                          </div>
                          <div className="mt-2 text-lg font-semibold">{date.dayLabel}</div>
                          <div className="mt-1 text-xs opacity-70">{date.monthLabel}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-semibold text-[#24483A]">{t('booking.labels.time')} *</label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-[24px] border p-4 text-sm font-semibold transition-colors ${
                            selectedTime === time
                              ? 'border-primary bg-primary text-white'
                              : 'border-[#D6EEDD] bg-[#F7FCF8] text-secondary hover:border-[#A7E8B6]'
                          }`}
                        >
                          🕐 {time}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {step === 4 && (
                <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
                  <div className="rounded-[28px] bg-light-gray p-5">
                    <h3 className="mb-4 text-2xl font-bold text-secondary">{t('booking.steps.confirm')}</h3>
                    <div className="space-y-3">
                      {selectedItems.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-white p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                               <p className="font-semibold text-secondary">
                                {item.icon} {item.id === 'custom' && customItemName.trim() !== '' ? customItemName : item.name}
                              </p>
                              <p className="mt-1 text-sm text-[#476458]">
                                {item.selectedOptionLabel ?? 'Default'}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-primary">
                              {getLineItemLabel(item)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-[28px] border border-[#D6EEDD] bg-[#F7FCF8] p-5">
                      <h4 className="mb-3 text-sm font-semibold text-[#24483A]">Khuyến mãi</h4>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={voucherCodeInput}
                          onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                          placeholder="Nhập mã giảm giá..."
                          disabled={hasQuoteItems}
                          className="flex-1 rounded-[16px] border border-[#D6EEDD] px-4 py-2.5 text-sm text-secondary placeholder:text-[#8AA89A] outline-none focus:border-[#22C55E] disabled:opacity-50"
                        />
                        <button
                          type="button"
                          disabled={isApplyingVoucher || !voucherCodeInput || hasQuoteItems}
                          onClick={() => handleApplyVoucher()}
                          className="rounded-[16px] bg-secondary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-[#1A573F] transition-colors"
                        >
                          {isApplyingVoucher ? 'Đang kiểm tra...' : 'Áp dụng'}
                        </button>
                      </div>
                      {hasQuoteItems && (
                        <p className="text-xs text-[#8AA89A] mb-1">Mã giảm giá không áp dụng cùng các dịch vụ cần báo giá.</p>
                      )}
                      {voucherError && <p className="text-red-500 text-xs font-semibold">{voucherError}</p>}
                      {appliedVoucher && <p className="text-primary text-xs font-bold">Đã áp dụng thẻ {appliedVoucher.voucher_code}. Giảm {formatPrice(appliedVoucher.discount_amount, currentLang)}</p>}
                      {(isLoadingVouchers || publicVouchers.length > 0) && (
                        <div className="mt-4">
                          <p className="mb-2 text-xs font-semibold uppercase text-[#789185]">
                            Mã đang phát hành
                          </p>
                          {isLoadingVouchers ? (
                            <div className="rounded-[8px] border border-[#D6EEDD] bg-white px-3 py-2 text-xs font-medium text-[#789185]">
                              Đang tải mã khuyến mãi...
                            </div>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {publicVouchers.map((voucher) => {
                                const isApplied = appliedVoucher?.voucher_code === voucher.code;
                                const isUsable = canUsePublicVoucher(voucher);
                                const helperText = hasQuoteItems
                                  ? 'Không áp dụng với dịch vụ báo giá'
                                  : isUsable
                                    ? getVoucherRequirementLabel(voucher)
                                    : `Cần đơn từ ${formatPrice(voucher.min_order_value, currentLang)}`;

                                return (
                                  <button
                                    key={voucher.id}
                                    type="button"
                                    disabled={!isUsable || isApplyingVoucher}
                                    onClick={() => handleApplyVoucher(voucher.code)}
                                    className={`min-h-[72px] rounded-[8px] border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed ${
                                      isApplied
                                        ? 'border-primary bg-secondary-light text-secondary'
                                        : isUsable
                                          ? 'border-[#BFE8CB] bg-white text-secondary hover:border-primary hover:bg-[#F0FBF3]'
                                          : 'border-[#E2ECE6] bg-white/60 text-[#789185] opacity-70'
                                    }`}
                                  >
                                    <span className="block text-sm font-bold">{voucher.code}</span>
                                    <span className="mt-1 block text-xs font-semibold text-primary">
                                      {getVoucherDiscountLabel(voucher)}
                                    </span>
                                    <span className="mt-1 block text-xs text-[#789185]">{helperText}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-[28px] bg-secondary p-5 text-white">
                      <div className="space-y-2 mb-3 border-b border-white/20 pb-3">
                         <div className="flex items-center justify-between text-white/70 text-sm">
                           <span>Tổng tạm tính</span>
                           <span>{formatPrice(calculateTotal() + serviceHandlingFee, currentLang)}</span>
                         </div>
                         {appliedVoucher && (
                           <div className="flex items-center justify-between text-[#8DE0A6] text-sm font-bold">
                             <span>Khuyến mãi ({appliedVoucher.voucher_code})</span>
                             <span>- {formatPrice(appliedVoucher.discount_amount, currentLang)}</span>
                           </div>
                         )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white/80">Thành tiền</span>
                        <span className="text-2xl font-bold">{getTotalLabel()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="rounded-[28px] border border-[#D6EEDD] bg-white p-5">
                      <h4 className="mb-3 text-xl font-bold text-secondary">Handling Mode</h4>
                      <div className="space-y-3">
                        {[
                          { id: 'inside' as const, title: t('booking.handling.inside'), price: '0' },
                          { id: 'outside' as const, title: t('booking.handling.outside'), price: '-30.000' },
                          { id: 'stairs' as const, title: t('booking.handling.stairs'), price: '+50.000' },
                        ].map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setHandlingMode(option.id)}
                            className={`w-full rounded-[24px] border p-4 text-left ${
                              handlingMode === option.id ? 'border-primary bg-[#F0FBF3]' : 'border-[#D6EEDD]'
                            }`}
                          >
                            <div className="flex justify-between">
                              <span className="font-semibold">{option.title}</span>
                              <span className="text-sm text-primary">{option.price}đ</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 rounded-[28px] border border-[#D6EEDD] bg-white p-5">
                      <h4 className="mb-3 text-sm font-semibold text-[#24483A]">{t('booking.labels.payment', 'Phương thức thanh toán')}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'cash' as const, title: t('booking.payment.cash', 'Tiền mặt'), icon: '💵' },
                          { id: 'transfer' as const, title: t('booking.payment.transfer', 'Chuyển khoản'), icon: '🏦' },
                        ].map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setPaymentMethod(option.id)}
                            className={`flex flex-col items-center justify-center gap-1 rounded-[24px] border p-4 transition-all ${
                              paymentMethod === option.id 
                                ? 'border-secondary bg-light-gray text-secondary' 
                                : 'border-[#D6EEDD] bg-[#F7FCF8] text-[#476458] hover:border-[#A7E8B6]'
                            }`}
                          >
                            <span className="text-xl">{option.icon}</span>
                            <span className="text-xs font-bold">{option.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                      {getSubmitError() && (
                        <p className="mt-2 text-center text-sm font-medium text-red-500 animate-fadeIn">
                          {getSubmitError()}
                        </p>
                      )}
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-semibold text-white transition-transform duration-300 shadow-[0_4px_14px_rgba(47,133,90,0.39)] hover:shadow-[0_6px_20px_rgba(47,133,90,0.23)] hover:scale-[1.02]"
                    >
                      {isSubmitting ? t('common.loading') : t('booking.submit')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!isSuccess && (
          <div className="border-t border-[#E7EFE9] bg-[#FBFDFC] p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#789185] mb-1">Total Amount</p>
                <div className="text-2xl font-bold text-secondary">{getTotalLabel()}</div>
              </div>
              <div className="flex gap-4">
                {step > 1 && (
                  <button
                    onClick={() => setStep((currentStep) => currentStep - 1)}
                    className="rounded-full border border-[#C9D9CF] px-8 py-3.5 font-semibold text-[#476458] transition-colors hover:bg-[#F0FBF3]"
                  >
                    {t('booking.back')}
                  </button>
                )}
                {step < 4 && (
                  <button
                    onClick={handleNext}
                    className="rounded-full bg-secondary px-10 py-3.5 font-semibold text-white transition-all hover:bg-[#18543F] shadow-[0_10px_20px_rgba(16,59,45,0.15)]"
                  >
                    {t('booking.next')}
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
