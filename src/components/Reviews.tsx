'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type AuthUser } from '@/lib/auth';
import { readHistory, type HistoryItem } from '@/lib/store';

interface ReviewItem {
  id?: string;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
  orderId?: string;    // Task 5: gắn vào completed order
  isCustom?: boolean;
}

interface ReviewsProps {
  currentUser: AuthUser | null;
}

export default function Reviews({ currentUser }: ReviewsProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  // State for all reviews
  const [allReviews, setAllReviews] = useState<ReviewItem[]>([]);

  // Task 5: new review form — chỉ hiện cho user có completed order chưa đánh giá
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  // Task 5: completed order cần review
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingOrderLabel, setPendingOrderLabel] = useState<string | null>(null);

  // Initialize reviews from translations + Task 5: from completed orders
  useEffect(() => {
    const defaultReviews = t('reviews.items', { returnObjects: true }) as ReviewItem[];
    const savedReviews = localStorage.getItem('ecocollect_user_reviews');

    let userReviews: ReviewItem[] = [];
    if (savedReviews) {
      try {
        userReviews = JSON.parse(savedReviews);
      } catch {
        userReviews = [];
      }
    }

    // Task 5: Pull completed orders từ history của user hiện tại
    // và tự động tạo review nếu user đã rate trong HistoryModal
    if (currentUser) {
      const historyItems: HistoryItem[] = readHistory();
      const ratedCompletedOrders = historyItems.filter(
        (item) => item.status === 'completed' && item.rating && item.rating > 0,
      );

      const autoReviews: ReviewItem[] = ratedCompletedOrders
        .filter((order) => !userReviews.find((r) => r.orderId === order.id))
        .map((order) => ({
          id: `auto-${order.id}`,
          orderId: order.id,
          name: order.customerName,
          avatar: order.customerName.charAt(0).toUpperCase(),
          rating: order.rating!,
          comment: currentLang === 'vi'
            ? `Đơn hàng #${order.id} đã được xử lý tốt. Rất hài lòng với dịch vụ!`
            : `Order #${order.id} was handled well. Very satisfied with the service!`,
          date: order.date,
          service: currentLang === 'vi' ? 'Khách hàng thành viên' : 'Member customer',
          isCustom: true,
        }));

      userReviews = [...autoReviews, ...userReviews];

      // Task 5: Tìm completed order chưa được review → hiện prompt
      const unreviewed = historyItems.find(
        (item) =>
          item.status === 'completed' &&
          !item.rating &&
          !userReviews.find((r) => r.orderId === item.id),
      );
      if (unreviewed) {
        setPendingOrderId(unreviewed.id);
        const label = unreviewed.items.map((i) => i.name).join(', ').slice(0, 40);
        setPendingOrderLabel(label || unreviewed.id);
      }
    }

    setAllReviews([...userReviews, ...defaultReviews]);
  }, [t, currentUser, currentLang]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      orderId: pendingOrderId ?? undefined,
      name: currentUser.name,
      avatar: currentUser.name.charAt(0).toUpperCase(),
      rating: newRating,
      comment: newComment,
      date: currentLang === 'vi' ? 'Vừa xong' : currentLang === 'sv' ? 'Alldeles nyss' : 'Just now',
      service: currentLang === 'vi' ? 'Khách hàng thành viên' : 'Member customer',
      isCustom: true,
    };

    const savedReviews = localStorage.getItem('ecocollect_user_reviews');
    let existingUserReviews: ReviewItem[] = [];
    if (savedReviews) {
      try { existingUserReviews = JSON.parse(savedReviews); } catch { /* ignore */ }
    }
    const updatedUserReviews = [newReview, ...existingUserReviews];
    localStorage.setItem('ecocollect_user_reviews', JSON.stringify(updatedUserReviews));

    setAllReviews((prev) => [newReview, ...prev]);
    setNewComment('');
    setNewRating(5);
    setIsSubmitting(false);
    setShowForm(false);
    setPendingOrderId(null);
    setPendingOrderLabel(null);
  };

  return (
    <section id="reviews" className="py-20 bg-[#F5FBF6]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block bg-[#2F855A]/10 text-[#2F855A] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            {t('reviews.badge')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#303030] mb-4">
            {t('reviews.title')}
          </h2>
        </div>

        {/* Task 5: Review prompt chỉ hiện khi có completed order chưa đánh giá */}
        {currentUser && pendingOrderId && (
          <div className="max-w-6xl mx-auto mb-12">
            {!showForm ? (
              <div className="bg-white/50 backdrop-blur-md border border-[#2F855A]/10 rounded-3xl p-8 text-center animate-fadeIn">
                <h3 className="text-xl font-bold text-[#103B2D] mb-2">{t('reviews.shareExperience')}</h3>
                <p className="text-gray-500 mb-2">{t('reviews.shareSubtitle')}</p>
                {pendingOrderLabel && (
                  <p className="text-sm text-[#2F855A] font-semibold mb-6">
                    {currentLang === 'vi' ? 'Đánh giá đơn hàng: ' : 'Rate order: '}
                    <span className="font-bold">{pendingOrderLabel}</span>
                  </p>
                )}
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-[#2F855A] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-[#236746] transition-all hover:shadow-lg active:scale-95"
                >
                  {t('reviews.writeBtn')}
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitReview}
                className="bg-white rounded-[40px] p-10 shadow-[0_30px_100px_rgba(16,59,45,0.12)] border border-[#2F855A]/5 animate-fadeInUp relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#2F855A]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                <div className="relative flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-bold text-[#103B2D] tracking-tight">{t('reviews.yourReview')}</h3>
                    <div className="h-1 w-8 bg-[#2F855A] rounded-full mt-1.5 opacity-60" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="group flex items-center gap-2 text-gray-400 hover:text-red-500 transition-all font-bold text-sm uppercase tracking-widest"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">✕</span>
                    {t('common.cancel')}
                  </button>
                </div>

                <div className="relative grid lg:grid-cols-12 gap-12">
                  {/* Left: Star Rating */}
                  <div className="lg:col-span-5 space-y-6">
                    <label className="block text-[11px] font-bold text-[#103B2D]/60 uppercase tracking-[0.15em] font-sans">{t('reviews.selectRating')}</label>
                    <div className="bg-[#F7FCF8] rounded-[32px] p-8 border border-[#D6EEDD]/50 flex flex-col items-center justify-center space-y-4 shadow-inner">
                      <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            onMouseEnter={() => !isSubmitting && setNewRating(star)}
                            className="text-4xl transition-all hover:scale-125 focus:outline-none filter drop-shadow-sm"
                          >
                            <span className={star <= newRating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-sm font-bold text-[#2F855A] animate-fadeIn min-h-[1.25rem]">
                        {newRating === 5 ? t('reviews.rating5') : newRating >= 4 ? t('reviews.rating4') : t('reviews.ratingLow')}
                      </p>
                    </div>
                  </div>

                  {/* Right: Comment */}
                  <div className="lg:col-span-7 space-y-6">
                    <label className="block text-[11px] font-bold text-[#103B2D]/60 uppercase tracking-[0.15em] font-sans">{t('reviews.commentLabel')}</label>
                    <div className="relative group">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t('reviews.placeholder')}
                        className="w-full h-44 bg-[#F7FCF8] border-2 border-[#D6EEDD]/50 rounded-[32px] p-6 text-[#103B2D] font-medium placeholder:text-gray-300 outline-none focus:border-[#2F855A] focus:bg-white focus:shadow-[0_15px_40px_rgba(47,133,90,0.1)] transition-all resize-none leading-relaxed"
                        required
                      />
                      <div className="absolute bottom-4 right-6 text-[10px] font-black text-gray-300 uppercase tracking-widest pointer-events-none">
                        {newComment.length} chars
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative mt-12 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="relative group bg-[#103B2D] text-white px-14 py-4 rounded-full font-bold uppercase tracking-[0.1em] text-sm shadow-[0_15px_35px_rgba(16,59,45,0.15)] hover:bg-[#18543F] hover:shadow-[0_20px_45px_rgba(16,59,45,0.25)] transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none flex items-center gap-3 overflow-hidden"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>{t('common.loading')}</span>
                      </>
                    ) : (
                      <span className="relative z-10">{t('reviews.submitBtn')}</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {Array.isArray(allReviews) && allReviews.map((review, index) => (
            <div
              key={review.id || index}
              className={`bg-white rounded-[28px] p-7 shadow-[0_10px_30px_rgba(47,133,90,0.08)] border border-[#2F855A]/5 hover:shadow-[0_20px_50px_rgba(47,133,90,0.12)] transition-all duration-500 hover:-translate-y-2 group ${review.isCustom ? 'ring-2 ring-[#2F855A]/20 bg-gradient-to-b from-white to-[#F7FCF8]' : ''}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner ${review.isCustom ? 'bg-[#103B2D] text-white' : 'bg-[#EAF8EE] text-[#2F855A]'}`}>
                    {review.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#103B2D] group-hover:text-[#2F855A] transition-colors">{review.name}</h4>
                    <p className="text-xs text-gray-400 font-medium">{review.date}</p>
                  </div>
                </div>
                {review.isCustom && (
                  <span className="bg-[#2F855A] text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-tighter shadow-sm">Your feedback</span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xl transition-transform hover:scale-110 ${i < review.rating ? 'text-yellow-400' : 'text-gray-100'}`}>★</span>
                ))}
              </div>

              {/* Comment */}
              <p className="text-[#303030]/80 leading-relaxed mb-6 italic min-h-[4.5rem]">"{review.comment}"</p>

              {/* Service Tag */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${review.isCustom ? 'bg-[#103B2D] text-white' : 'bg-[#2F855A]/8 text-[#2F855A]'}`}>
                <span className="opacity-70">📦</span> {review.service}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 flex flex-wrap justify-center items-center gap-8">
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="font-bold text-[#303030]">4.9/5</div>
              <div className="text-xs">{t('reviews.ratingLabel')}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="font-bold text-[#303030]">Top 1</div>
              <div className="text-xs">{t('reviews.topService')}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-bold text-[#303030]">Verified</div>
              <div className="text-xs">{t('reviews.greenBiz')}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="text-2xl">🔒</span>
            <div>
              <div className="font-bold text-[#303030]">Secure</div>
              <div className="text-xs">{t('reviews.securePay')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
