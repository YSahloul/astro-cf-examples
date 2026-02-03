// src/components/RecommendationsGrid.tsx
import { useState } from 'react';

interface Recommendation {
  id: string;
  name: string;
  wheelSize: string;
  tireSize: string;
  suspension: string;
  priceRange: string;
  confidence: number;
  rubbingStatus: string;
  trimmingStatus: string;
  commonWheels: string[];
  commonTires: string[];
  sampleBuildUrls: string[];
  explanation: string;
}

interface RecommendationsGridProps {
  recommendations: Recommendation[];
  vehicle: { year: number; make: string; model: string };
  totalBuilds: number;
  onSelectRecommendation?: (recommendation: Recommendation) => void;
}

export default function RecommendationsGrid({ 
  recommendations, 
  vehicle, 
  totalBuilds,
  onSelectRecommendation 
}: RecommendationsGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12 bg-base-200 rounded-box">
        <p className="text-base-content/60">No recommendations found for this vehicle.</p>
        <p className="text-sm text-base-content/40 mt-2">Try adjusting your search criteria.</p>
      </div>
    );
  }

  const handleSelect = (rec: Recommendation) => {
    setSelectedId(rec.id);
    onSelectRecommendation?.(rec);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          Recommended Setups for Your {vehicle.year} {vehicle.make} {vehicle.model}
        </h2>
        {totalBuilds > 0 && (
          <p className="text-base-content/70 mt-1">
            Based on <span className="font-semibold text-primary">{totalBuilds}</span> verified builds
          </p>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`
              card bg-base-100 shadow-md hover:shadow-lg transition-all duration-200
              ${selectedId === rec.id ? 'ring-2 ring-primary' : 'border border-base-300'}
            `}
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 rounded-t-box">
              <h3 className="text-lg font-bold text-primary-content">{rec.name}</h3>
              {rec.confidence > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-primary-content/80">{rec.confidence} verified builds</span>
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="card-body p-4 space-y-4">
              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-base-content/60 block">Wheel Size</span>
                  <span className="font-semibold">{rec.wheelSize}</span>
                </div>
                <div>
                  <span className="text-base-content/60 block">Tire Size</span>
                  <span className="font-semibold">{rec.tireSize}</span>
                </div>
                <div>
                  <span className="text-base-content/60 block">Suspension</span>
                  <span className="font-semibold">{rec.suspension}</span>
                </div>
                <div>
                  <span className="text-base-content/60 block">Est. Price</span>
                  <span className="font-semibold text-success">{rec.priceRange}</span>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                {rec.rubbingStatus?.includes('No') && (
                  <span className="badge badge-success badge-sm gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    No Rubbing
                  </span>
                )}
                {(rec.trimmingStatus?.includes('No') || rec.trimmingStatus?.includes('None')) && (
                  <span className="badge badge-success badge-sm gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    No Trimming
                  </span>
                )}
              </div>

              {/* Common Options */}
              {rec.commonWheels.length > 0 && (
                <div>
                  <span className="text-xs text-base-content/60 block mb-1">Popular Wheels</span>
                  <div className="flex flex-wrap gap-1">
                    {rec.commonWheels.map((wheel, i) => (
                      <span key={i} className="badge badge-outline badge-xs">
                        {wheel}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {rec.commonTires.length > 0 && (
                <div>
                  <span className="text-xs text-base-content/60 block mb-1">Popular Tires</span>
                  <div className="flex flex-wrap gap-1">
                    {rec.commonTires.map((tire, i) => (
                      <span key={i} className="badge badge-outline badge-xs">
                        {tire}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              <p className="text-sm text-base-content/70 italic">
                {rec.explanation}
              </p>
            </div>

            {/* Card Footer */}
            <div className="card-actions p-4 pt-0">
              <button
                onClick={() => handleSelect(rec)}
                className={`btn btn-block ${selectedId === rec.id ? 'btn-success' : 'btn-primary'}`}
              >
                {selectedId === rec.id ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Selected
                  </>
                ) : (
                  'Select This Setup'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
