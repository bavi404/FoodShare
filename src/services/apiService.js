// API Service for FoodShare Backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Remove authentication token
  removeToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Get headers with authentication
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Donation endpoints
  async getDonationsNear(lat, lng, radius = 10, options = {}) {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
      ...options,
    });

    return this.request(`/donations/near?${params}`);
  }

  async createDonation(donationData) {
    return this.request('/donations', {
      method: 'POST',
      body: JSON.stringify(donationData),
    });
  }

  async claimDonation(donationId) {
    return this.request(`/donations/${donationId}/claim`, {
      method: 'POST',
    });
  }

  async updateDonationStatus(donationId, status, notes = '') {
    return this.request(`/donations/${donationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  async getDonationById(donationId) {
    return this.request(`/donations/${donationId}`);
  }

  async getUserDonations(type = 'all', limit = 20, page = 1) {
    const params = new URLSearchParams({
      type,
      limit: limit.toString(),
      page: page.toString(),
    });

    return this.request(`/donations/user?${params}`);
  }

  // User endpoints
  async updateUserLocation(locationData) {
    return this.request('/users/me/location', {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  }

  async getUserProfile() {
    return this.request('/users/me');
  }

  async updateUserProfile(profileData) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getUserPreferences() {
    return this.request('/users/me/preferences');
  }

  async updateUserPreferences(preferences) {
    return this.request('/users/me/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // AI endpoints
  async analyzeImage(imageData, options = {}) {
    return this.request('/ai/analyze-image', {
      method: 'POST',
      body: JSON.stringify({
        image: imageData,
        options: {
          extractText: true,
          detectFood: true,
          suggestCategory: true,
          ...options,
        },
      }),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
