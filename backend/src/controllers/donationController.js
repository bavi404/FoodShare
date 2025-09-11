import Donation from '../models/Donation.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { io } from '../server.js';

// Get donations near a location
export const getDonationsNear = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: errors.array()
        }
      });
    }

    const { lat, lng, radius = 10, limit = 50, foodType, status = 'available' } = req.query;
    
    // Convert radius from km to meters
    const maxDistance = parseFloat(radius) * 1000;
    
    // Build query options
    const queryOptions = {};
    if (foodType) {
      queryOptions.foodType = new RegExp(foodType, 'i');
    }
    if (status) {
      queryOptions.status = status;
    }

    // Find donations near location
    const donations = await Donation.findNear(
      parseFloat(lng),
      parseFloat(lat),
      maxDistance,
      queryOptions
    )
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

    // Add distance to each donation
    const donationsWithDistance = donations.map(donation => {
      const donationObj = donation.toObject();
      donationObj.distance = donation._distance || 0;
      return donationObj;
    });

    res.json({
      success: true,
      data: donationsWithDistance,
      pagination: {
        total: donationsWithDistance.length,
        limit: parseInt(limit),
        hasMore: donationsWithDistance.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching donations near location:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch donations'
      }
    });
  }
};

// Create a new donation
export const createDonation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: errors.array()
        }
      });
    }

    const {
      title,
      description,
      foodType,
      category,
      quantity,
      weight,
      images = [],
      location,
      pickupDateTime,
      expirationDate
    } = req.body;

    // Get user from JWT token
    const userId = req.user.id;

    // Create donation
    const donation = new Donation({
      title,
      description,
      foodType,
      category: category || foodType,
      quantity,
      weight,
      images,
      location: {
        type: 'Point',
        coordinates: [location.coordinates[0], location.coordinates[1]],
        address: location.address,
        city: location.city || '',
        state: location.state || ''
      },
      pickupDateTime: new Date(pickupDateTime),
      expirationDate: new Date(expirationDate),
      createdBy: userId,
      status: 'available'
    });

    await donation.save();

    // Populate createdBy field
    await donation.populate('createdBy', 'firstName lastName avatar');

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.donationsCreated': 1 }
    });

    // Emit real-time event
    io.emit('donation_created', {
      type: 'donation_created',
      data: {
        donation: {
          id: donation._id,
          title: donation.title,
          location: donation.location,
          foodType: donation.foodType,
          status: donation.status,
          createdAt: donation.createdAt
        }
      },
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      data: {
        id: donation._id,
        title: donation.title,
        status: donation.status,
        createdAt: donation.createdAt,
        aiGenerated: donation.aiGenerated
      }
    });

  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create donation'
      }
    });
  }
};

// Claim a donation
export const claimDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const userId = req.user.id;

    // Find donation
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DONATION_NOT_FOUND',
          message: 'Donation not found'
        }
      });
    }

    // Check if donation can be claimed
    if (!donation.canBeClaimed()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DONATION_ALREADY_CLAIMED',
          message: 'Donation is no longer available'
        }
      });
    }

    // Update donation
    donation.status = 'claimed';
    donation.claimedBy = userId;
    await donation.save();

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 
        'stats.donationsClaimed': 1,
        'stats.totalFoodSaved': donation.weight
      }
    });

    // Emit real-time event
    io.emit('donation_claimed', {
      type: 'donation_claimed',
      data: {
        donationId: donation._id,
        claimedBy: userId,
        claimedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: {
        id: donation._id,
        status: donation.status,
        claimedBy: userId,
        claimedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error claiming donation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to claim donation'
      }
    });
  }
};

// Update donation status
export const updateDonationStatus = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    // Validate status
    const validStatuses = ['available', 'claimed', 'picked-up', 'expired', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status value'
        }
      });
    }

    // Find donation
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DONATION_NOT_FOUND',
          message: 'Donation not found'
        }
      });
    }

    // Check permissions (only creator or claimer can update)
    if (donation.createdBy.toString() !== userId && donation.claimedBy?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to update this donation'
        }
      });
    }

    // Update donation
    const oldStatus = donation.status;
    donation.status = status;
    if (notes) {
      donation.notes = notes;
    }
    await donation.save();

    // Emit real-time event
    io.emit('donation_updated', {
      type: 'donation_updated',
      data: {
        donationId: donation._id,
        changes: {
          status: status,
          oldStatus: oldStatus
        },
        updatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: {
        id: donation._id,
        status: donation.status,
        updatedAt: donation.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating donation status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update donation status'
      }
    });
  }
};

// Get donation by ID
export const getDonationById = async (req, res) => {
  try {
    const { donationId } = req.params;

    const donation = await Donation.findById(donationId)
      .populate('createdBy', 'firstName lastName avatar')
      .populate('claimedBy', 'firstName lastName avatar');

    if (!donation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DONATION_NOT_FOUND',
          message: 'Donation not found'
        }
      });
    }

    res.json({
      success: true,
      data: donation
    });

  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch donation'
      }
    });
  }
};

// Get user's donations
export const getUserDonations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'all', limit = 20, page = 1 } = req.query;

    let query = {};
    if (type === 'created') {
      query.createdBy = userId;
    } else if (type === 'claimed') {
      query.claimedBy = userId;
    } else if (type === 'all') {
      query.$or = [
        { createdBy: userId },
        { claimedBy: userId }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const donations = await Donation.find(query)
      .populate('createdBy', 'firstName lastName avatar')
      .populate('claimedBy', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Donation.countDocuments(query);

    res.json({
      success: true,
      data: donations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching user donations:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch donations'
      }
    });
  }
};
