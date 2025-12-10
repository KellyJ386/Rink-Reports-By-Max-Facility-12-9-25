'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  StarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ReviewForm, ReviewCard } from '@/components/customer-portal';
import { getFacilityReviews, getFacilityInfo } from '@/lib/customer-portal';
import type { Review, FacilityInfo } from '@/lib/customer-portal';
import { cn } from '@/lib/utils';

export default function ReviewsPage() {
  const [facility, setFacility] = useState<FacilityInfo | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const facilityId = 'fac-1';

  useEffect(() => {
    loadData();
  }, [sortBy]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [facilityData, reviewsData] = await Promise.all([
        getFacilityInfo(facilityId),
        getFacilityReviews(facilityId, { sortBy }),
      ]);

      setFacility(facilityData);
      setReviews(reviewsData.reviews);
      setAverageRating(reviewsData.averageRating);
      setTotalReviews(reviewsData.total);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSuccess = (review: Review) => {
    setReviews([review, ...reviews]);
    setShowForm(false);
  };

  const filteredReviews = filterRating
    ? reviews.filter((r) => r.rating === filterRating)
    : reviews;

  // Calculate rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100 || 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/portal"
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Portal
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Reviews
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                See what our customers are saying about {facility?.name}
              </p>
            </div>
            <Button onClick={() => setShowForm(true)}>
              Write a Review
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {showForm ? (
          <div className="mb-8">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="mb-4">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Reviews
            </Button>
            <ReviewForm
              facilityId={facilityId}
              facilityName={facility?.name || 'Central Ice Arena'}
              customerId="customer-1"
              customerName="Guest User"
              onSuccess={handleReviewSuccess}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : (
          <>
            {/* Rating Summary */}
            <Card className="p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Average Rating */}
                <div className="text-center md:text-left md:pr-8 md:border-r dark:border-gray-700">
                  <div className="text-5xl font-bold text-gray-900 dark:text-white mb-1">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      star <= Math.round(averageRating) ? (
                        <StarIconSolid key={star} className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <StarIcon key={star} className="w-5 h-5 text-gray-300" />
                      )
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Based on {totalReviews} reviews</p>
                </div>

                {/* Rating Distribution */}
                <div className="flex-1">
                  {ratingCounts.map(({ rating, count, percentage }) => (
                    <button
                      key={rating}
                      onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                      className={cn(
                        'w-full flex items-center gap-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors',
                        filterRating === rating && 'bg-primary-50 dark:bg-primary-900/20'
                      )}
                    >
                      <span className="w-8 text-sm text-gray-600 dark:text-gray-400">
                        {rating}
                        <StarIconSolid className="w-3 h-3 text-yellow-400 inline ml-0.5" />
                      </span>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-sm text-gray-500">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {filterRating && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterRating(null)}
                  >
                    Clear filter
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating')}
                  className="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                >
                  <option value="recent">Most Recent</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Reviews List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : filteredReviews.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {filterRating
                    ? `No ${filterRating}-star reviews yet.`
                    : 'No reviews yet. Be the first to write one!'}
                </p>
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  Write a Review
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}

            {/* Load More */}
            {filteredReviews.length > 0 && filteredReviews.length < totalReviews && (
              <div className="text-center mt-8">
                <Button variant="secondary">
                  Load More Reviews
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
