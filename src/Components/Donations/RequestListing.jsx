import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, push, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import ClaimFlowButtons from '../PublicFeed/ClaimFlowButtons';
import Footer from '../Footer/footer';

const RequestListing = () => {
  const [donations, setDonations] = useState([]);
  const [userId, setUserId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    postType: 'donation',
    title: '',
    description: '',
    foodType: '',
    foodQuantity: '',
    foodWeight: '',
    pickupDateTime: '',
    expirationDate: '',
    location: '',
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const db = getDatabase();
    const donationRef = ref(db, 'donationRequests');
    onValue(donationRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setDonations(list.reverse());
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const [lat, lng] = formData.location.split(',').map(Number);
    if (isNaN(lat) || isNaN(lng)) {
      alert('Invalid location format.');
      return;
    }
    const donation = {
      ...formData,
      location: { lat, lng },
      createdBy: userId,
      status: 'available',
      createdAt: new Date().toISOString(),
    };
    const db = getDatabase();
    const id = push(ref(db, 'donationRequests')).key;
    await set(ref(db, `donationRequests/${id}`), donation);

    setFormData({
      postType: 'donation',
      title: '',
      description: '',
      foodType: '',
      foodQuantity: '',
      foodWeight: '',
      pickupDateTime: '',
      expirationDate: '',
      location: '',
    });
    setShowForm(false);
  };

  return (
    <div className="container my-4">
      <h5 className="text-muted">Add a New Post</h5>
      <h3 className="text-center my-4">
        Submit a Food {formData.postType === 'request' ? 'Request' : 'Donation'}
      </h3>

      <button className="btn btn-primary my-3" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Close Form' : 'Add New Post'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="row">
            <div className="col-md-6 mb-2">
              <select
                className="form-control"
                name="postType"
                value={formData.postType}
                onChange={handleInputChange}
                required
              >
                <option value="donation">Donation</option>
                <option value="request">Request</option>
              </select>
            </div>
            <div className="col-md-6 mb-2">
              <input className="form-control" placeholder="Title" name="title" value={formData.title} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6 mb-2">
              <input className="form-control" placeholder="Expiration Date" name="expirationDate" type="date" value={formData.expirationDate} onChange={handleInputChange} required />
            </div>
            <div className="col-md-12 mb-2">
              <textarea className="form-control" rows="2" placeholder="Description" name="description" value={formData.description} onChange={handleInputChange} required />
            </div>
            <div className="col-md-4 mb-2">
              <input className="form-control" placeholder="Food Type" name="foodType" value={formData.foodType} onChange={handleInputChange} required />
            </div>
            <div className="col-md-4 mb-2">
              <input className="form-control" placeholder="Quantity" name="foodQuantity" value={formData.foodQuantity} onChange={handleInputChange} required />
            </div>
            <div className="col-md-4 mb-2">
              <input className="form-control" placeholder="Weight (kg)" name="foodWeight" value={formData.foodWeight} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6 mb-2">
              <input className="form-control" placeholder="Pickup Date & Time" name="pickupDateTime" type="datetime-local" value={formData.pickupDateTime} onChange={handleInputChange} required />
            </div>
            <div className="col-md-6 mb-2">
              <input className="form-control" placeholder="Location (lat,lng)" name="location" value={formData.location} onChange={handleInputChange} required />
            </div>
            <div className="col-12 text-end">
              <button type="submit" className="btn btn-success">Submit</button>
            </div>
          </div>
        </form>
      )}

      {donations.map((d) => (
        <div key={d.id} className="card mb-3">
          <div className="card-body">
            <h5>{d.title}</h5>
            <p>{d.description}</p>
            <p><strong>Type:</strong> {d.postType || 'donation'}</p>
            <p><strong>Quantity:</strong> {d.foodQuantity}, <strong>Weight:</strong> {d.foodWeight}kg</p>
            <p><strong>Status:</strong> {d.status}</p>
            {userId && <ClaimFlowButtons donationId={d.id} currentUserId={userId} />}
          </div>
        </div>
      ))}
      <Footer />
    </div>
  );
};

export default RequestListing;
