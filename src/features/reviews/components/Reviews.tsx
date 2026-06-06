'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type AuthUser } from '@/shared/lib/auth';
import { readHistory, type HistoryItem } from '@/shared/lib/store';
import apiClient from '@/shared/lib/apiClient';

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

interface ReviewApiItem {
  id: number | string;
  reviewer_name?: string | null;
  reviewer_email?: string | null;
  rating: number;
  comment?: string | null;
  created_at?: string | null;
}

interface ReviewsProps {
  currentUser: AuthUser | null;
}

const userReviewsStorageKey = 'ecocollect_user_reviews';

function getReviewFingerprint(review: ReviewItem) {
  return [
    review.name.trim().toLowerCase(),
    review.rating,
    review.comment.trim().toLowerCase(),
  ].join('|');
}

function dedupeReviews(reviews: ReviewItem[]) {
  const seen = new Set<string>();

  return reviews.filter((review) => {
    const fingerprint = getReviewFingerprint(review);
    if (seen.has(fingerprint)) {
      return false;
    }

    seen.add(fingerprint);
    return true;
  });
}

function readStoredUserReviews() {
  const savedReviews = localStorage.getItem(userReviewsStorageKey);

  if (!savedReviews) {
    return [] as ReviewItem[];
  }

  try {
    const parsedReviews = JSON.parse(savedReviews);
    return Array.isArray(parsedReviews) ? parsedReviews : [];
  } catch {
    return [];
  }
}

function writeStoredUserReviews(reviews: ReviewItem[]) {
  localStorage.setItem(userReviewsStorageKey, JSON.stringify(dedupeReviews(reviews)));
}

function removeServerBackedLocalReviews(serverReviews: ReviewItem[], userReviews: ReviewItem[]) {
  const serverFingerprints = new Set(serverReviews.map(getReviewFingerprint));
  return userReviews.filter((review) => !serverFingerprints.has(getReviewFingerprint(review)));
}

function mapServerReview(review: ReviewApiItem, currentLang: string): ReviewItem {
  const name = review.reviewer_name || 'Anonymous';
  const createdAt = review.created_at ? new Date(review.created_at) : null;

  return {
    id: `server-${review.id}`,
    name,
    avatar: name.charAt(0).toUpperCase(),
    rating: review.rating,
    comment: review.comment || '',
    date: createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleDateString(currentLang === 'vi' ? 'vi-VN' : 'en-US')
      : '',
    service: currentLang === 'vi' ? 'Khách hàng' : 'Customer',
    isCustom: true,
  };
}

export default function Reviews({ currentUser }: ReviewsProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // State for all reviews
  const [allReviews, setAllReviews] = useState<ReviewItem[]>([]);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  // Task 5: completed order cần review
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingOrderLabel, setPendingOrderLabel] = useState<string | null>(null);

  // Initialize reviews + Task 5: from completed orders
  useEffect(() => {
    let userReviews = readStoredUserReviews();

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

    // Lấy reviews từ DB và gộp vào (Real DB + LocalStorage Auto)
    apiClient.get('/reviews').then((res) => {
      const serverReviews = (res.data as ReviewApiItem[]).map((review) => mapServerReview(review, currentLang));
      const unsyncedUserReviews = removeServerBackedLocalReviews(serverReviews, userReviews);
      if (unsyncedUserReviews.length !== userReviews.length) {
        writeStoredUserReviews(unsyncedUserReviews);
      }
      setAllReviews(dedupeReviews([...serverReviews, ...unsyncedUserReviews]));
    }).catch(() => {
      setAllReviews(dedupeReviews([...userReviews]));
    });

  }, [currentUser, currentLang]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);

    const finalName = currentUser ? currentUser.name : (reviewerName || 'Khách');
    const finalEmail = currentUser ? currentUser.email : reviewerEmail;

    let shouldPersistLocally = false;

    try {
      const response = await apiClient.post<ReviewApiItem>('/reviews', {
        rating: newRating,
        comment: newComment,
        reviewer_name: finalName,
        reviewer_email: finalEmail,
      });
      const savedReview = mapServerReview(response.data, currentLang);
      setAllReviews((prev) => dedupeReviews([savedReview, ...prev]));
    } catch (error) {
      shouldPersistLocally = true;
      console.error('Failed to submit review to backend:', error);
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      orderId: pendingOrderId ?? undefined,
      name: finalName,
      avatar: finalName.charAt(0).toUpperCase(),
      rating: newRating,
      comment: newComment,
      date: currentLang === 'vi' ? 'Vừa xong' : currentLang === 'sv' ? 'Alldeles nyss' : 'Just now',
      service: currentLang === 'vi' ? 'Khách hàng' : 'Customer',
      isCustom: true,
    };

    if (shouldPersistLocally) {
      const updatedUserReviews = [newReview, ...readStoredUserReviews()];
      writeStoredUserReviews(updatedUserReviews);
      setAllReviews((prev) => dedupeReviews([newReview, ...prev]));
    }

    setNewComment('');
    setNewRating(5);
    setReviewerName('');
    setReviewerEmail('');
    setIsSubmitting(false);
    setShowForm(false);
    setPendingOrderId(null);
    setPendingOrderLabel(null);
  };

  const averageRating = allReviews.length > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : '5.0';

  return (
    <section id="reviews" className="py-20 bg-light-gray">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            {t('reviews.badge')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#303030] mb-4">
            {t('reviews.title')}
          </h2>
        </div>

        {/* Write Review Action or Prompt */}
        <div className="max-w-6xl mx-auto mb-12">
          {!showForm ? (
            <div className="text-center">
              {currentUser && pendingOrderId ? (
                <div className="bg-white/50 backdrop-blur-md border border-primary/10 rounded-3xl p-8 text-center animate-fadeIn inline-block w-full">
                  <h3 className="text-xl font-bold text-secondary mb-2">{t('reviews.shareExperience')}</h3>
                  <p className="text-gray-500 mb-2">{t('reviews.shareSubtitle')}</p>
                  {pendingOrderLabel && (
                    <p className="text-sm text-primary font-semibold mb-6">
                      {mounted && (currentLang === 'vi' ? 'Đánh giá đơn hàng: ' : 'Rate order: ')}
                      <span className="font-bold">{pendingOrderLabel}</span>
                    </p>
                  )}
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-primary text-white px-8 py-3.5 rounded-full font-semibold hover:bg-primary-hover transition-all hover:shadow-lg active:scale-95"
                  >
                    {t('reviews.writeBtn')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-primary text-white px-8 py-3.5 rounded-full font-semibold hover:bg-primary-hover transition-all hover:shadow-lg active:scale-95"
                >
                  {mounted ? t('reviews.writeBtn') : ''}
                </button>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSubmitReview}
              className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 animate-fadeInUp relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-secondary tracking-tight">{t('reviews.yourReview')}</h3>
                  <div className="h-0.5 w-8 bg-[#8BBFA3] mt-1" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-sm tracking-wide transition-colors"
                >
                  HỦY
                </button>
              </div>

              {!currentUser && (
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                      Họ tên
                    </label>
                    <input
                      type="text"
                      required
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="Nhập họ tên của bạn..."
                      className="w-full bg-light-gray border border-transparent focus:border-primary/30 rounded-[16px] px-5 py-4 text-sm text-secondary font-medium outline-none transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={reviewerEmail}
                      onChange={(e) => setReviewerEmail(e.target.value)}
                      placeholder="Nhập email của bạn..."
                      className="w-full bg-light-gray border border-transparent focus:border-primary/30 rounded-[16px] px-5 py-4 text-sm text-secondary font-medium outline-none transition-all placeholder:text-gray-300"
                    />
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left: Star Rating */}
                <div className="flex flex-col">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    ĐÁNH GIÁ SAO
                  </label>
                  <div className="bg-light-gray rounded-[20px] flex-1 min-h-[140px] flex flex-col items-center justify-center p-6 border-transparent border transition-all hover:border-primary/20 cursor-pointer">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          onMouseEnter={() => !isSubmitting && setNewRating(star)}
                          className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                        >
                          <span className={star <= newRating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-sm font-bold text-primary mt-4 min-h-5">
                      {newRating === 5 ? 'Tuyệt vời' : newRating >= 4 ? t('reviews.rating4') : t('reviews.ratingLow')}
                    </p>
                  </div>
                </div>

                {/* Right: Comment */}
                <div className="flex flex-col">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    NHẬN XÉT
                  </label>
                  <div className="relative group flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Chia sẻ cảm nhận của bạn..."
                      className="w-full h-full min-h-[140px] bg-light-gray border border-transparent rounded-[20px] p-6 text-sm text-secondary font-medium placeholder:text-gray-300 outline-none focus:border-primary/30 transition-all resize-none leading-relaxed"
                      required
                    />
                    <div className="absolute bottom-4 right-5 text-[10px] font-bold text-gray-300 uppercase tracking-widest pointer-events-none">
                      {newComment.length} CHARS
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim() || (!currentUser && (!reviewerName || !reviewerEmail))}
                  className="bg-sidebar-muted text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-primary hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {isSubmitting ? t('common.loading') : 'GỬI ĐÁNH GIÁ'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {Array.isArray(allReviews) && allReviews.map((review, index) => (
            <div
              key={review.id || index}
              className={`bg-white rounded-[28px] p-7 shadow-[0_10px_30px_rgba(47,133,90,0.08)] border border-primary/5 hover:shadow-[0_20px_50px_rgba(47,133,90,0.12)] transition-all duration-500 hover:-translate-y-2 group ${review.isCustom ? 'ring-2 ring-primary/20 bg-linear-to-b from-white to-bg-light' : ''}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner bg-secondary-light text-primary">
                    <svg className="w-6 h-6" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary group-hover:text-primary transition-colors">{review.name}</h4>
                    <p className="text-xs text-gray-400 font-medium">{review.date}</p>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xl transition-transform hover:scale-110 ${i < review.rating ? 'text-yellow-400' : 'text-gray-100'}`}>★</span>
                ))}
              </div>

              {/* Comment */}
              <p className="text-text-dark/80 leading-relaxed mb-6 italic min-h-18">"{review.comment}"</p>


            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 flex flex-wrap justify-center items-center gap-8">
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="font-bold text-text-dark">{averageRating}/5</div>
              <div className="text-xs">{t('reviews.ratingLabel')}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="font-bold text-text-dark">{t('reviews.topServiceValue')}</div>
              <div className="text-xs">{t('reviews.topService')}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-bold text-text-dark">{t('reviews.greenBizValue')}</div>
              <div className="text-xs">{t('reviews.greenBiz')}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <span className="text-2xl">🔒</span>
            <div>
              <div className="font-bold text-text-dark">{t('reviews.securePayValue')}</div>
              <div className="text-xs">{t('reviews.securePay')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
