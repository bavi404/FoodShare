import React, { useState, useRef, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import apiService from '../../services/apiService';
import wsService from '../../services/websocketService';
import LocationPicker from '../DashBoard/LocationPicker/LocationPicker';
import './EnhancedDonationForm.css';

const EnhancedDonationForm = ({ onDonationCreated }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    foodType: '',
    category: '',
    quantity: {
      amount: '',
      unit: 'pieces'
    },
    weight: '',
    pickupDateTime: '',
    expirationDate: '',
    location: {
      coordinates: [0, 0],
      address: '',
      city: '',
      state: ''
    }
  });

  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const auth = getAuth();
  const user = auth.currentUser;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      const newImages = imageFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        base64: null
      }));
      
      setImages(prev => [...prev, ...newImages]);
      
      // Auto-analyze the first image
      if (newImages.length > 0) {
        analyzeImage(newImages[0].file);
      }
    }
  };

  const removeImage = (index) => {
    const imageToRemove = images[index];
    URL.revokeObjectURL(imageToRemove.preview);
    
    setImages(prev => prev.filter((_, i) => i !== index));
    
    // Clear AI suggestions if removing the analyzed image
    if (index === 0 && aiSuggestions) {
      setAiSuggestions(null);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const analyzeImage = async (file) => {
    if (!file) return;

    setIsAnalyzing(true);
    setAiSuggestions(null);

    try {
      const base64 = await convertToBase64(file);
      
      const response = await apiService.analyzeImage(base64, {
        extractText: true,
        detectFood: true,
        suggestCategory: true
      });

      if (response.success) {
        setAiSuggestions(response.data);
        
        // Auto-fill form with AI suggestions
        if (response.data.suggestedFormData) {
          const suggestions = response.data.suggestedFormData;
          setForm(prev => ({
            ...prev,
            title: suggestions.title || prev.title,
            foodType: suggestions.foodType || prev.foodType,
            category: suggestions.category || prev.category,
            quantity: {
              amount: suggestions.quantity?.amount || prev.quantity.amount,
              unit: suggestions.quantity?.unit || prev.quantity.unit
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setErrors(prev => ({ ...prev, ai: 'Failed to analyze image' }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLocationChange = (location) => {
    setForm(prev => ({
      ...prev,
      location: {
        coordinates: [location.longitude, location.latitude],
        address: location.address || '',
        city: location.city || '',
        state: location.state || ''
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.foodType.trim()) newErrors.foodType = 'Food type is required';
    if (!form.quantity.amount || form.quantity.amount <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!form.weight || form.weight <= 0) newErrors.weight = 'Valid weight is required';
    if (!form.pickupDateTime) newErrors.pickupDateTime = 'Pickup date/time is required';
    if (!form.expirationDate) newErrors.expirationDate = 'Expiration date is required';
    if (!form.location.coordinates[0] || !form.location.coordinates[1]) newErrors.location = 'Location is required';

    // Validate dates
    if (form.pickupDateTime && form.expirationDate) {
      const pickupDate = new Date(form.pickupDateTime);
      const expirationDate = new Date(form.expirationDate);
      
      if (expirationDate <= pickupDate) {
        newErrors.expirationDate = 'Expiration date must be after pickup date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please log in to create a donation');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert images to base64
      const imagePromises = images.map(img => convertToBase64(img.file));
      const base64Images = await Promise.all(imagePromises);

      const donationData = {
        title: form.title,
        description: form.description,
        foodType: form.foodType,
        category: form.category || form.foodType,
        quantity: {
          amount: parseFloat(form.quantity.amount),
          unit: form.quantity.unit
        },
        weight: parseFloat(form.weight),
        images: base64Images,
        location: {
          coordinates: form.location.coordinates,
          address: form.location.address,
          city: form.location.city,
          state: form.location.state
        },
        pickupDateTime: new Date(form.pickupDateTime).toISOString(),
        expirationDate: new Date(form.expirationDate).toISOString()
      };

      const response = await apiService.createDonation(donationData);

      if (response.success) {
        // Reset form
        setForm({
          title: '',
          description: '',
          foodType: '',
          category: '',
          quantity: { amount: '', unit: 'pieces' },
          weight: '',
          pickupDateTime: '',
          expirationDate: '',
          location: { coordinates: [0, 0], address: '', city: '', state: '' }
        });
        setImages([]);
        setAiSuggestions(null);
        setErrors({});

        // Notify parent component
        onDonationCreated?.(response.data);

        alert('Donation created successfully!');
      }
    } catch (error) {
      console.error('Error creating donation:', error);
      alert('Failed to create donation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyAiSuggestion = (suggestion) => {
    setForm(prev => ({
      ...prev,
      title: suggestion.title || prev.title,
      foodType: suggestion.foodType || prev.foodType,
      category: suggestion.category || prev.category,
      quantity: {
        amount: suggestion.quantity?.amount || prev.quantity.amount,
        unit: suggestion.quantity?.unit || prev.quantity.unit
      }
    }));
  };

  return (
    <div className="enhanced-donation-form">
      <h3 className="form-title">🍽️ Create Food Donation</h3>
      
      <form onSubmit={handleSubmit} className="donation-form">
        {/* Image Upload Section */}
        <div className="form-section">
          <label className="section-label">📸 Food Images</label>
          <div className="image-upload-area">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="upload-btn"
            >
              📷 Add Images
            </button>
            <p className="upload-hint">Upload photos to automatically identify food items</p>
          </div>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="image-preview-container">
              {images.map((img, index) => (
                <div key={index} className="image-preview">
                  <img src={img.preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="remove-image-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* AI Analysis Results */}
          {isAnalyzing && (
            <div className="ai-analysis-loading">
              <div className="spinner"></div>
              <span>Analyzing image with AI...</span>
            </div>
          )}

          {aiSuggestions && (
            <div className="ai-suggestions">
              <h4>🤖 AI Suggestions</h4>
              <div className="suggestion-content">
                <div className="suggestion-item">
                  <strong>Detected Food:</strong> {aiSuggestions.foodItems?.[0]?.name || 'Unknown'}
                  <span className="confidence">
                    ({Math.round((aiSuggestions.foodItems?.[0]?.confidence || 0) * 100)}% confidence)
                  </span>
                </div>
                {aiSuggestions.suggestedFormData && (
                  <div className="suggestion-actions">
                    <button
                      type="button"
                      onClick={() => applyAiSuggestion(aiSuggestions.suggestedFormData)}
                      className="apply-suggestion-btn"
                    >
                      Apply AI Suggestions
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <label className="section-label">📝 Basic Information</label>
          
          <div className="form-group">
            <label htmlFor="title" className="form-label">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="e.g., Fresh Organic Apples"
              required
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description *</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              placeholder="Describe the food item, condition, and any special notes..."
              rows="3"
              required
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>
        </div>

        {/* Food Details */}
        <div className="form-section">
          <label className="section-label">🍎 Food Details</label>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="foodType" className="form-label">Food Type *</label>
              <input
                type="text"
                id="foodType"
                name="foodType"
                value={form.foodType}
                onChange={handleChange}
                className={`form-input ${errors.foodType ? 'error' : ''}`}
                placeholder="e.g., Apples, Bread, Pizza"
                required
              />
              {errors.foodType && <span className="error-message">{errors.foodType}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="category" className="form-label">Category</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select category</option>
                <option value="fruits">Fruits</option>
                <option value="vegetables">Vegetables</option>
                <option value="meals">Meals</option>
                <option value="bakery">Bakery</option>
                <option value="dairy">Dairy</option>
                <option value="meat">Meat</option>
                <option value="seafood">Seafood</option>
                <option value="grains">Grains</option>
                <option value="beverages">Beverages</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity.amount" className="form-label">Quantity *</label>
              <div className="quantity-input-group">
                <input
                  type="number"
                  id="quantity.amount"
                  name="quantity.amount"
                  value={form.quantity.amount}
                  onChange={handleChange}
                  className={`form-input ${errors.quantity ? 'error' : ''}`}
                  placeholder="5"
                  min="0"
                  step="0.1"
                  required
                />
                <select
                  name="quantity.unit"
                  value={form.quantity.unit}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="pieces">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="lbs">Pounds</option>
                  <option value="liters">Liters</option>
                  <option value="gallons">Gallons</option>
                  <option value="boxes">Boxes</option>
                  <option value="bags">Bags</option>
                </select>
              </div>
              {errors.quantity && <span className="error-message">{errors.quantity}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="weight" className="form-label">Weight (kg) *</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                className={`form-input ${errors.weight ? 'error' : ''}`}
                placeholder="3.5"
                min="0"
                step="0.1"
                required
              />
              {errors.weight && <span className="error-message">{errors.weight}</span>}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="form-section">
          <label className="section-label">📅 Schedule</label>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pickupDateTime" className="form-label">Pickup Date & Time *</label>
              <input
                type="datetime-local"
                id="pickupDateTime"
                name="pickupDateTime"
                value={form.pickupDateTime}
                onChange={handleChange}
                className={`form-input ${errors.pickupDateTime ? 'error' : ''}`}
                required
              />
              {errors.pickupDateTime && <span className="error-message">{errors.pickupDateTime}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="expirationDate" className="form-label">Expiration Date *</label>
              <input
                type="date"
                id="expirationDate"
                name="expirationDate"
                value={form.expirationDate}
                onChange={handleChange}
                className={`form-input ${errors.expirationDate ? 'error' : ''}`}
                required
              />
              {errors.expirationDate && <span className="error-message">{errors.expirationDate}</span>}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="form-section">
          <label className="section-label">📍 Location</label>
          <LocationPicker
            onLocationChange={handleLocationChange}
            initialLocation={form.location}
            error={errors.location}
          />
          {errors.location && <span className="error-message">{errors.location}</span>}
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Donation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedDonationForm;
