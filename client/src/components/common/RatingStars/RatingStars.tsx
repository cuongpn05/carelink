import React from 'react';
import { Star } from 'lucide-react';
import './RatingStars.css';

export interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: number;
  showScore?: boolean;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  reviewCount,
  size = 15,
  showScore = true,
  className = '',
}) => {
  const normalized = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(normalized);
  const hasHalfStar = normalized - fullStars >= 0.5;

  return (
    <div className={`cds-rating ${className}`} aria-label={`Đánh giá ${normalized.toFixed(1)} trên 5 sao`}>
      <div className="cds-rating-stars" aria-hidden="true">
        {[...Array(5)].map((_, i) => {
          const isFilled = i < fullStars || (i === fullStars && hasHalfStar);
          return (
            <Star
              key={i}
              size={size}
              fill={isFilled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
            />
          );
        })}
      </div>
      {showScore && <span className="cds-rating-score">{normalized.toFixed(1)}</span>}
      {reviewCount !== undefined && (
        <span className="cds-rating-count">({reviewCount})</span>
      )}
    </div>
  );
};

export default RatingStars;

