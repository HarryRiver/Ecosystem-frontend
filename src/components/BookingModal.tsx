'use client';

import { useEffect, useRef, useState, useMemo, useCallback, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { type AuthMode, type AuthUser } from '@/lib/auth';

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
  onSubmit: BookingSubmitHandler;
  prefill?: BookingPrefill | null;
}

type PricingMode = 'fixed' | 'estimate' | 'quote';
type HandlingMode = 'inside' | 'outside' | 'stairs';
type PaymentMethod = 'cash' | 'transfer';

export interface BookingSubmissionItem {
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

export type BookingSubmitHandler = (payload: BookingSubmissionPayload) => Promise<void> | void;

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

const wasteServiceDefs = [
  { id: 'sofa-single', icon: '🛋️', categoryKey: 'furniture', pricingMode: 'fixed' as const, basePrice: 150000, unitLabelKey: 'perItem' },
  { id: 'sofa-large',  icon: '🛋️', categoryKey: 'furniture', pricingMode: 'fixed' as const, basePrice: 250000, unitLabelKey: 'perItem' },
  { id: 'wardrobe',    icon: '🗄️', categoryKey: 'furniture', pricingMode: 'fixed' as const,
    optionDefs: [
      { id: 'small',    price: 180000, unitLabelKey: 'perItem' },
      { id: 'standard', price: 260000, unitLabelKey: 'perItem' },
      { id: 'oversize', price: 420000, unitLabelKey: 'perItem' },
    ],
  },
  { id: 'kitchen-cabinet', icon: '🗃️', categoryKey: 'furniture',    pricingMode: 'fixed' as const, basePrice: 120000, unitLabelKey: 'perItem' },
  { id: 'bed',         icon: '🛏️', categoryKey: 'furniture',    pricingMode: 'fixed' as const, basePrice: 220000, unitLabelKey: 'perItem' },
  { id: 'tv',          icon: '📺', categoryKey: 'electronics', pricingMode: 'fixed' as const, basePrice: 80000,  unitLabelKey: 'perItem' },
  { id: 'fridge',      icon: '🧣', categoryKey: 'electronics', pricingMode: 'fixed' as const, basePrice: 200000, unitLabelKey: 'perItem' },
  { id: 'washer',      icon: '🪧', categoryKey: 'electronics', pricingMode: 'fixed' as const, basePrice: 180000, unitLabelKey: 'perItem' },
  { id: 'aircon',      icon: '❄️', categoryKey: 'electronics', pricingMode: 'fixed' as const, basePrice: 160000, unitLabelKey: 'perItem' },
  { id: 'office-furniture', icon: '🪑', categoryKey: 'other', pricingMode: 'fixed' as const,    basePrice: 100000, unitLabelKey: 'perItem' },
  { id: 'household-bag',    icon: '🗑️', categoryKey: 'other', pricingMode: 'fixed' as const,    basePrice: 60000,  unitLabelKey: 'perBag'  },
  { id: 'construction',     icon: '🧱', categoryKey: 'other', pricingMode: 'estimate' as const, basePrice: 7000,   unitLabelKey: 'perKg'  },
  { id: 'custom',           icon: '✨', categoryKey: 'other', pricingMode: 'quote' as const },
];

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

function getCategoryFromPrefill(selectedWaste?: string) {
  if (!selectedWaste) {
    return 'all';
  }

  const waste = selectedWaste.toLowerCase();
  
  if (waste.includes('nội thất')) {
    return 'furniture';
  }

  if (waste.includes('điện tử')) {
    return 'electronics';
  }

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

export default function BookingModal({ currentUser, isOpen, onAuthClick, onClose, onSubmit, prefill }: BookingModalProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const contentRef = useRef<HTMLDivElement | null>(null);

  const wasteServices = useMemo<WasteService[]>(() => {
    return wasteServiceDefs.map((def) => {
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
        basePrice: def.basePrice,
        unitLabel,
        options,
        note: svcT?.note,
      };
    });
  }, [t]);

  const categories = useMemo(() => [
    { key: 'all',         label: t('booking.categoryAll') },
    { key: 'furniture',   label: t('booking.categories.furniture') },
    { key: 'electronics', label: t('booking.categories.electronics') },
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
  const [stairsFloors, setStairsFloors] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      return `Từ ${formatPrice(total, currentLang)}`;
    }

    if (hasQuoteItems) {
      return t('booking.quoteLabel');
    }

    return formatPrice(total, currentLang);
  };

  const getLineItemLabel = (item: SelectedWasteItem) => {
    if (item.pricingMode === 'quote') {
      return t('booking.quoteLabel');
    }

    const lineTotal = item.basePrice * getBillingAmount(item);
    return item.pricingMode === 'estimate' ? `Tạm tính ${formatPrice(lineTotal, currentLang)}` : formatPrice(lineTotal, currentLang);
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
    const total = subtotal + serviceHandlingFee;

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
      await onSubmit(buildSubmissionPayload());

      if (!isMountedRef.current || activeSubmitIdRef.current !== submitId) {
        return;
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

        const waste = prefill.selectedWaste.toLowerCase();
        const isGeneric = waste.includes('nội thất') || waste.includes('điện tử') || waste.includes('món khác');
        
        if (!isGeneric) {
          setSearchQuery(prefill.selectedWaste);
        } else {
          setSearchQuery('');
        }
        
        const targetService = wasteServices.find((s) => s.id === prefill.selectedWaste);
        if (targetService) {
          setSelectedItems([createSelectedItem(targetService)]);
        }
      }

      if (prefill.address) {
        setStreetAddress(prefill.address);
        setCity('');
        setDistrict('');
      }

      if (prefill.handlingGoal) {
        setNotes(`Yêu cầu từ form nhanh: ${prefill.handlingGoal}.`);
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
            <div className="py-10 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF8EE]">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="mb-2 text-3xl font-bold text-[#103B2D]">{t('booking.success.title')}</h3>
              <p className="mx-auto mb-8 max-w-xl text-gray-600">
                {t('booking.success.desc', { email })}
              </p>
              <div className="mx-auto mb-8 max-w-2xl rounded-[28px] bg-[#F5FBF6] p-5 text-left">
                <h4 className="mb-4 font-semibold text-[#103B2D]">{t('booking.summary.title')}</h4>
                <div className="space-y-2 text-sm text-[#476458]">
                  <p>👤 {customerName}</p>
                  <p>📞 {phone}</p>
                  <p>📧 {email}</p>
                  <p>📍 {fullAddress}</p>
                  <p>📅 {selectedDateLabel} • {selectedTime}</p>
                  <p>🚚 {handlingLabel}</p>
                  <p>💳 {paymentMethod === 'cash' ? (t('booking.payment.cash') === 'booking.payment.cash' ? 'Tiền mặt' : t('booking.payment.cash')) : (t('booking.payment.transfer') === 'booking.payment.transfer' ? 'Chuyển khoản' : t('booking.payment.transfer'))}</p>
                  <p>💰 {getTotalLabel()}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-[#103B2D] px-8 py-3 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
              >
                {t('common.close')}
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
                          <h3 className="text-xl font-bold text-[#103B2D]">{t('booking.steps.items')}</h3>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[#476458]">
                          {t('booking.selectedCount', { count: selectedItems.length })}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder={t('booking.searchPlaceholder')}
                          className="w-full rounded-2xl border border-[#D6EEDD] bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#789185] focus:border-[#22C55E]"
                        />
                        <div className="flex flex-wrap gap-2">
                          {categories.map((cat) => (
                            <button
                              key={cat.key}
                              type="button"
                              onClick={() => setActiveCategory(cat.key)}
                              className={`rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                                activeCategory === cat.key
                                  ? 'bg-[#103B2D] text-white'
                                  : 'bg-white text-[#476458] hover:bg-[#EAF8EE]'
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
                            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2F855A]">
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
                                        </div>
                                        <p className="mt-1 text-sm leading-6 text-[#476458]">
                                          {service.description}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="rounded-full bg-[#F7FCF8] px-3 py-1 text-xs font-semibold text-[#2F855A]">
                                      {getDisplayPrice(service, currentLang, t)}
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
                                        <span className="font-medium text-[#103B2D]">
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
                                            className="w-24 rounded-2xl border border-[#D6EEDD] bg-white px-3 py-2 text-right text-sm font-semibold text-[#103B2D] outline-none"
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

                  <aside className="lg:sticky lg:top-0 lg:h-fit space-y-5">
                    <div className="rounded-[28px] border border-[#D6EEDD] bg-[#F7FCF8] p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-semibold text-[#103B2D]">{t('booking.summary.items')}</h4>
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
                                    {item.selectedOptionLabel ?? 'Default'}
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
                          {t('booking.noItems', 'Chưa có hạng mục nào được chọn.')}
                        </p>
                      )}
                    </div>

                    <div className="rounded-[28px] border border-[#D6EEDD] bg-[#F7FCF8] p-5">
                      <div className="mb-4">
                        <h4 className="font-semibold text-[#103B2D]">{t('booking.labels.photo')}</h4>
                        <p className="mt-1 text-xs text-[#476458]">{t('booking.labels.photoDesc')}</p>
                      </div>

                      {uploadedImage ? (
                        <div className="relative group">
                          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[#D6EEDD] bg-white">
                            <img
                              src={uploadedImage.previewUrl}
                              alt="Upload preview"
                              className="h-full w-full object-cover"
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
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D6EEDD] bg-white py-8 transition-colors hover:border-[#103B2D] hover:bg-[#F0FBF3]">
                          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#F7FCF8] text-2xl">
                            📸
                          </div>
                          <span className="text-sm font-medium text-[#103B2D]">
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

                    <div className="rounded-[28px] border border-[#D6EEDD] bg-[#F5FBF6] p-5">
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#103B2D] px-6 py-4 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                      >
                        <span>{t('booking.next')}</span>
                      </button>
                    </div>
                  </aside>
                </div>
              )}

              {step === 2 && (
                <div className="mx-auto max-w-3xl">
                  <h3 className="mb-2 text-2xl font-bold text-[#103B2D]">{t('booking.steps.address')}</h3>
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

                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#103B2D] px-6 py-4 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      <span>{t('booking.next')}</span>
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="mx-auto max-w-3xl">
                  <h3 className="mb-8 text-2xl font-bold text-[#103B2D]">{t('booking.steps.schedule')}</h3>
                  <div className="mb-8">
                    <label className="mb-3 block text-sm font-semibold text-[#24483A]">{t('booking.labels.date')} *</label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {availableDates.slice(0, 8).map((date) => (
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
                              ? 'border-[#2F855A] bg-[#2F855A] text-white'
                              : 'border-[#D6EEDD] bg-[#F7FCF8] text-[#103B2D] hover:border-[#A7E8B6]'
                          }`}
                        >
                          🕐 {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="mt-10 flex w-full items-center justify-center gap-2 rounded-full bg-[#103B2D] px-6 py-4 font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    <span>{t('booking.next')}</span>
                  </button>
                </div>
              )}

              {step === 4 && (
                <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
                  <div className="rounded-[28px] bg-[#F5FBF6] p-5">
                    <h3 className="mb-4 text-2xl font-bold text-[#103B2D]">{t('booking.steps.confirm')}</h3>
                    <div className="space-y-3">
                      {selectedItems.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-white p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                               <p className="font-semibold text-[#103B2D]">
                                {item.icon} {item.id === 'custom' && customItemName.trim() !== '' ? customItemName : item.name}
                              </p>
                              <p className="mt-1 text-sm text-[#476458]">
                                {item.selectedOptionLabel ?? 'Default'}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-[#2F855A]">
                              {getLineItemLabel(item)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl bg-[#103B2D] p-4 text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Total</span>
                        <span className="text-2xl font-bold">{getTotalLabel()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="rounded-[28px] border border-[#D6EEDD] bg-white p-5">
                      <h4 className="mb-3 text-xl font-bold text-[#103B2D]">Handling Mode</h4>
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
                              handlingMode === option.id ? 'border-[#2F855A] bg-[#F0FBF3]' : 'border-[#D6EEDD]'
                            }`}
                          >
                            <div className="flex justify-between">
                              <span className="font-semibold">{option.title}</span>
                              <span className="text-sm text-[#2F855A]">{option.price}đ</span>
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
                                ? 'border-[#103B2D] bg-[#F5FBF6] text-[#103B2D]' 
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
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#2F855A] px-6 py-4 font-semibold text-white transition-transform duration-300 shadow-[0_4px_14px_rgba(47,133,90,0.39)] hover:shadow-[0_6px_20px_rgba(47,133,90,0.23)] hover:scale-[1.02]"
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
                <div className="text-2xl font-bold text-[#103B2D]">{getTotalLabel()}</div>
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
                    className="rounded-full bg-[#103B2D] px-10 py-3.5 font-semibold text-white transition-all hover:bg-[#18543F] shadow-[0_10px_20px_rgba(16,59,45,0.15)]"
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
