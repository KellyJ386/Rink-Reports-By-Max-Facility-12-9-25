'use client';

import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { submitReview } from '@/lib/customer-portal';
import type { Review } from '@/lib/customer-portal';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  facilityId: string;
  facilityName: string;
  customerId: string;
  customerName: string;
  bookingId?: string;
  onSuccess?: (review: Review) => void;
  onCancel?: () => void;
}

const aspectLabels = {
  iceQuality: 'Ice Quality',
  cleanliness: 'Cleanliness',
  staff: 'Staff',
  value: 'Value for Money',
  amenities: 'Amenities',
};

export function ReviewForm({
  facilityId,
  facilityName,
  customerId,
  customerName,
  bookingId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [aspects, setAspects] = useState({
    iceQuality: 0,
    cleanliness: 0,
    staff: 0,
    value: 0,
    amenities: 0,
  });
  const [showAspects, setShowAspects] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters in your review');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const review = await submitReview({
        customerId,
        customerName,
        facilityId,
        facilityName,
        bookingId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        aspects: showAspects ? aspects : undefined,
        isPublic: true,
      });

      onSuccess?.(review);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({
    value,
    onChange,
    size = 'lg',
    interactive = true,
  }: {
    value: number;
    onChange?: (rating: number) => void;
    size?: 'sm' | 'lg';
    interactive?: boolean;
  }) => {
    const [hover, setHover] = useState(0);

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= (interactive ? (hover || value) : value);

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => interactive && setHover(star)}
              onMouseLeave={() => interactive && setHover(0)}
              className={cn(
                'focus:outline-none',
                interactive && 'cursor-pointer hover:scale-110 transition-transform'
              )}
            >
              {isFilled ? (
                <StarIconSolid className={cn(
                  'text-yellow-400',
                  size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'
                )} />
              ) : (
                <StarIcon className={cn(
                  'text-gray-300 dark:text-gray-600',
                  size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'
                )} />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Write a Review
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Share your experience at {facilityName}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Overall Rating
          </p>
          <div className="flex justify-center">
            <StarRating value={rating} onChange={setRating} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </p>
        </div>

        {/* Review Title */}
        <Input
          label="Review Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
        />

        {/* Review Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your Review *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
            placeholder="Tell us about your experience..."
            required
            minLength={10}
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/500 characters
          </p>
        </div>

        {/* Detailed Ratings Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAspects(!showAspects)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {showAspects ? 'Hide detailed ratings' : 'Add detailed ratings (optional)'}
          </button>

          {showAspects && (
            <div className="mt-4 space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {Object.entries(aspectLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  <StarRating
                    value={aspects[key as keyof typeof aspects]}
                    onChange={(value) => setAspects({ ...aspects, [key]: value })}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// Display a single review
interface ReviewCardProps {
  review: Review;
  showResponse?: boolean;
}

export function ReviewCard({ review, showResponse = true }: ReviewCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {review.customerName}
            </span>
            {review.isVerified && (
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded">
                Verified
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {review.createdAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            star <= review.rating ? (
              <StarIconSolid key={star} className="w-4 h-4 text-yellow-400" />
            ) : (
              <StarIcon key={star} className="w-4 h-4 text-gray-300" />
            )
          ))}
        </div>
      </div>

      {review.title && (
        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
          {review.title}
        </h4>
      )}

      <p className="text-sm text-gray-600 dark:text-gray-400">
        {review.comment}
      </p>

      {review.aspects && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(review.aspects).map(([key, value]) => (
            value && (
              <span
                key={key}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
              >
                {aspectLabels[key as keyof typeof aspectLabels]}: {value}/5
              </span>
            )
          ))}
        </div>
      )}

      {showResponse && review.response && (
        <div className="mt-4 pl-4 border-l-2 border-primary-500">
          <p className="text-xs font-medium text-primary-600 mb-1">
            Response from {review.response.respondedBy}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {review.response.text}
          </p>
        </div>
      )}
    </Card>
  );
}
