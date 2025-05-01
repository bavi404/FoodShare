import React, { useState } from 'react';
import { getDatabase, ref, push, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const DonationForm = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    foodType: '',
    foodQuantity: '',
    foodWeight: '',
    pickupDateTime: '',
    expirationDate: '',
    locationInput: '',
  });

  const auth = getAuth();
  const user = auth.currentUser;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("User not authenticated.");
      return;
    }

    const [latStr, lngStr] = form.locationInput.split(',').map(s => s.trim());
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      alert("Please enter valid latitude and longitude.");
      return;
    }

    const donationData = {
      title: form.title,
      description: form.description,
      foodType: form.foodType,
      foodQuantity: form.foodQuantity,
      foodWeight: form.foodWeight,
      pickupDateTime: form.pickupDateTime,
      expirationDate: form.expirationDate,
      location: { lat, lng },
      status: 'available',
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
    };

    const db = getDatabase();
    const newRef = push(ref(db, 'donationRequests'));
    await set(newRef, donationData);

    alert("Donation submitted!");
    setForm({
      title: '',
      description: '',
      foodType: '',
      foodQuantity: '',
      foodWeight: '',
      pickupDateTime: '',
      expirationDate: '',
      locationInput: '',
    });
  };

  return (
    <div className="container my-4">
      <h3 className="mb-4">Submit a Food Donation</h3>
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="mb-3">
          <label htmlFor="title" className="form-label">Title</label>
          <input
            name="title"
            id="title"
            value={form.title}
            onChange={handleChange}
            className="form-control"
            placeholder="Donation Title"
            required
          />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            name="description"
            id="description"
            value={form.description}
            onChange={handleChange}
            className="form-control"
            placeholder="Describe the food item..."
            required
          />
        </div>

        {/* Food Type */}
        <div className="mb-3">
          <label htmlFor="foodType" className="form-label">Food Type</label>
          <input
            name="foodType"
            id="foodType"
            value={form.foodType}
            onChange={handleChange}
            className="form-control"
            placeholder="e.g. Fruits, Meals, Bakery"
            required
          />
        </div>

        {/* Quantity & Weight */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="foodQuantity" className="form-label">Quantity</label>
            <input
              name="foodQuantity"
              id="foodQuantity"
              value={form.foodQuantity}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g. 5 packs"
              required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="foodWeight" className="form-label">Weight (kg)</label>
            <input
              name="foodWeight"
              id="foodWeight"
              value={form.foodWeight}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g. 3.5"
              required
            />
          </div>
        </div>

        {/* Pickup Date & Time */}
        <div className="mb-3">
          <label htmlFor="pickupDateTime" className="form-label">Pickup Date & Time</label>
          <input
            name="pickupDateTime"
            id="pickupDateTime"
            type="datetime-local"
            value={form.pickupDateTime}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        {/* Expiration Date */}
        <div className="mb-3">
          <label htmlFor="expirationDate" className="form-label">Expiration Date</label>
          <input
            name="expirationDate"
            id="expirationDate"
            type="date"
            value={form.expirationDate}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        {/* Location */}
        <div className="mb-3">
          <label htmlFor="locationInput" className="form-label">Location (Latitude, Longitude)</label>
          <input
            name="locationInput"
            id="locationInput"
            value={form.locationInput}
            onChange={handleChange}
            className="form-control"
            placeholder="e.g. 12.9716, 77.5946"
            required
          />
          <small className="form-text text-muted">
            Format: latitude, longitude (e.g., 12.9716, 77.5946)
          </small>
        </div>

        {/* Submit */}
        <button type="submit" className="btn btn-success mt-3">
          Submit Donation
        </button>
      </form>
    </div>
  );
};

export default DonationForm;
