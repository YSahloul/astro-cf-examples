// src/components/QuoteApp.tsx
import { useState } from 'react';
import { actions } from 'astro:actions';
import VehicleIntakeForm from './VehicleIntakeForm';
import RecommendationsGrid from './RecommendationsGrid';
import ChatWidget from './ChatWidget';

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

interface RecommendationsData {
  recommendations: Recommendation[];
  vehicle: { year: number; make: string; model: string };
  intent: string;
  totalBuilds: number;
}

interface QuoteResult {
  quoteId: string;
  qrCodeUrl: string;
  leadId: number;
}

interface FormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

export default function QuoteApp() {
  const [recommendationsData, setRecommendationsData] = useState<RecommendationsData | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  
  // Form state for customer info
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  
  // Quote submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);

  const handleRecommendations = (data: RecommendationsData) => {
    setRecommendationsData(data);
    setSelectedRecommendation(null);
    // Scroll to recommendations
    setTimeout(() => {
      document.getElementById('recommendations')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectRecommendation = (rec: Recommendation) => {
    setSelectedRecommendation(rec);
    setShowQuoteModal(true);
  };

  const handleCloseModal = () => {
    setShowQuoteModal(false);
    // Reset form state when closing
    setFormData({ customerName: '', customerPhone: '', customerEmail: '' });
    setFormErrors({});
    setSubmitError(null);
    setQuoteResult(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (formErrors[name as keyof FormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};
    
    if (!formData.customerName.trim()) {
      errors.customerName = 'Name is required';
    }
    
    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      errors.customerEmail = 'Invalid email format';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedRecommendation || !recommendationsData) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const result = await actions.createQuote({
        vehicleYear: recommendationsData.vehicle.year,
        vehicleMake: recommendationsData.vehicle.make,
        vehicleModel: recommendationsData.vehicle.model,
        wheelSize: selectedRecommendation.wheelSize,
        tireSize: selectedRecommendation.tireSize,
        suspension: selectedRecommendation.suspension,
        priceRange: selectedRecommendation.priceRange,
        commonWheels: selectedRecommendation.commonWheels,
        commonTires: selectedRecommendation.commonTires,
        sampleBuildUrls: selectedRecommendation.sampleBuildUrls,
        evidenceBuilds: selectedRecommendation.confidence,
        rubbingStatus: selectedRecommendation.rubbingStatus,
        trimmingStatus: selectedRecommendation.trimmingStatus,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone || undefined,
        customerEmail: formData.customerEmail || undefined,
      });
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to generate quote');
      }
      
      setQuoteResult(result.data);
    } catch (error) {
      console.error('Error creating quote:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to generate quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    setRecommendationsData(null);
    setSelectedRecommendation(null);
  };

  return (
    <div className="space-y-8">
      {/* Vehicle Intake Form */}
      <VehicleIntakeForm 
        onRecommendations={handleRecommendations}
        onLoadingChange={setLoading}
      />

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/70">Analyzing real build data...</p>
          <p className="text-sm text-base-content/50">Finding the best setups for your vehicle</p>
        </div>
      )}

      {/* Recommendations */}
      {recommendationsData && !loading && (
        <div id="recommendations">
          <RecommendationsGrid
            recommendations={recommendationsData.recommendations}
            vehicle={recommendationsData.vehicle}
            totalBuilds={recommendationsData.totalBuilds}
            onSelectRecommendation={handleSelectRecommendation}
          />
          
          {/* Start Over Button */}
          <div className="mt-6 text-center">
            <button
              onClick={handleStartOver}
              className="btn btn-ghost btn-sm"
            >
              Search for a different vehicle
            </button>
          </div>
        </div>
      )}

      {/* ChatWidget */}
      <ChatWidget 
        vehicle={recommendationsData?.vehicle}
        intent={recommendationsData?.intent}
        recommendations={recommendationsData?.recommendations}
      />

      {/* Quote Modal */}
      {showQuoteModal && selectedRecommendation && recommendationsData && (
        <dialog className="modal modal-open">
          <div className="modal-backdrop bg-black/50" onClick={handleCloseModal}></div>
          <div className="modal-box max-w-lg">
            {/* Success State */}
            {quoteResult ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold">Quote Generated!</h2>
                  <p className="text-base-content/70 mt-1">Your personalized fitment quote is ready</p>
                </div>

                {/* Quote ID */}
                <div className="bg-base-200 rounded-box p-4 mb-4 text-center">
                  <p className="text-sm text-base-content/60">Quote ID</p>
                  <p className="text-lg font-mono font-semibold">{quoteResult.quoteId}</p>
                </div>

                {/* QR Code */}
                {quoteResult.qrCodeUrl && (
                  <div className="flex flex-col items-center mb-6">
                    <img 
                      src={quoteResult.qrCodeUrl} 
                      alt="Quote QR Code" 
                      className="w-40 h-40 border border-base-300 rounded-lg"
                    />
                    <p className="text-sm text-base-content/60 mt-2">Scan to view quote details</p>
                  </div>
                )}

                {/* Selected Setup Summary */}
                <div className="alert alert-info mb-6">
                  <div>
                    <h3 className="font-semibold">{selectedRecommendation.name}</h3>
                    <p className="text-sm opacity-80">
                      {recommendationsData.vehicle.year} {recommendationsData.vehicle.make} {recommendationsData.vehicle.model}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="opacity-70">Wheels:</span>
                        <span className="ml-1 font-medium">{selectedRecommendation.wheelSize}</span>
                      </div>
                      <div>
                        <span className="opacity-70">Tires:</span>
                        <span className="ml-1 font-medium">{selectedRecommendation.tireSize}</span>
                      </div>
                      <div>
                        <span className="opacity-70">Suspension:</span>
                        <span className="ml-1 font-medium">{selectedRecommendation.suspension}</span>
                      </div>
                      <div>
                        <span className="opacity-70">Est. Price:</span>
                        <span className="ml-1 font-medium text-success">{selectedRecommendation.priceRange}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <a
                    href={`/quote/${quoteResult.quoteId}`}
                    className="btn btn-primary flex-1"
                  >
                    View Full Quote
                  </a>
                  <button
                    onClick={handleCloseModal}
                    className="btn btn-outline flex-1"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Form State */}
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">Generate Quote</h2>
                  <button
                    onClick={handleCloseModal}
                    className="btn btn-ghost btn-sm btn-circle"
                    disabled={isSubmitting}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Selected Setup Summary */}
                <div className="bg-base-200 rounded-box p-4 mb-6">
                  <h3 className="font-semibold">{selectedRecommendation.name}</h3>
                  <p className="text-sm text-base-content/70">
                    {recommendationsData.vehicle.year} {recommendationsData.vehicle.make} {recommendationsData.vehicle.model}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-base-content/60">Wheels:</span>
                      <span className="ml-1 font-medium">{selectedRecommendation.wheelSize}</span>
                    </div>
                    <div>
                      <span className="text-base-content/60">Tires:</span>
                      <span className="ml-1 font-medium">{selectedRecommendation.tireSize}</span>
                    </div>
                    <div>
                      <span className="text-base-content/60">Suspension:</span>
                      <span className="ml-1 font-medium">{selectedRecommendation.suspension}</span>
                    </div>
                    <div>
                      <span className="text-base-content/60">Est. Price:</span>
                      <span className="ml-1 font-medium text-success">{selectedRecommendation.priceRange}</span>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {submitError && (
                  <div className="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Contact Form */}
                <form onSubmit={handleSubmitQuote} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Your Name <span className="text-error">*</span></span>
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className={`input input-bordered w-full ${formErrors.customerName ? 'input-error' : ''}`}
                      placeholder="John Smith"
                      disabled={isSubmitting}
                    />
                    {formErrors.customerName && (
                      <label className="label">
                        <span className="label-text-alt text-error">{formErrors.customerName}</span>
                      </label>
                    )}
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Phone Number</span>
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      placeholder="(555) 123-4567"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Email (optional)</span>
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      className={`input input-bordered w-full ${formErrors.customerEmail ? 'input-error' : ''}`}
                      placeholder="john@example.com"
                      disabled={isSubmitting}
                    />
                    {formErrors.customerEmail && (
                      <label className="label">
                        <span className="label-text-alt text-error">{formErrors.customerEmail}</span>
                      </label>
                    )}
                  </div>

                  <div className="modal-action mt-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="btn btn-outline flex-1"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Generating...
                        </>
                      ) : (
                        'Generate Quote'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
