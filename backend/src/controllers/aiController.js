import { ImageAnnotatorClient } from '@google-cloud/vision';
import { validationResult } from 'express-validator';

// Initialize Google Cloud Vision client
const visionClient = new ImageAnnotatorClient();

// Analyze food image using Google Cloud Vision API
export const analyzeImage = async (req, res) => {
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

    const { image, options = {} } = req.body;
    const { extractText = true, detectFood = true, suggestCategory = true } = options;

    // Convert base64 image to buffer
    const imageBuffer = Buffer.from(image.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');

    // Prepare features for the Vision API
    const features = [];
    
    if (extractText) {
      features.push({ type: 'TEXT_DETECTION' });
    }
    
    if (detectFood) {
      features.push({ type: 'LABEL_DETECTION' });
      features.push({ type: 'OBJECT_LOCALIZATION' });
    }

    // Call Google Cloud Vision API
    const [result] = await visionClient.annotateImage({
      image: { content: imageBuffer },
      features: features
    });

    const response = {
      success: true,
      data: {
        foodItems: [],
        extractedText: '',
        suggestedFormData: {}
      }
    };

    // Extract text if requested
    if (extractText && result.textAnnotations) {
      response.data.extractedText = result.textAnnotations[0]?.description || '';
    }

    // Process labels for food detection
    if (detectFood && result.labelAnnotations) {
      const foodLabels = result.labelAnnotations
        .filter(label => label.score > 0.7) // High confidence labels
        .map(label => ({
          name: label.description,
          confidence: label.score,
          category: categorizeFood(label.description)
        }));

      response.data.foodItems = foodLabels;

      // Generate suggested form data
      if (suggestCategory && foodLabels.length > 0) {
        const topFood = foodLabels[0];
        response.data.suggestedFormData = {
          title: `Fresh ${topFood.name}`,
          foodType: topFood.name,
          category: topFood.category,
          quantity: {
            amount: 1,
            unit: 'pieces'
          }
        };
      }
    }

    // Process object localization for bounding boxes
    if (detectFood && result.localizedObjectAnnotations) {
      const objects = result.localizedObjectAnnotations.map(obj => ({
        name: obj.name,
        confidence: obj.score,
        boundingBox: {
          x: obj.boundingPoly.normalizedVertices[0]?.x || 0,
          y: obj.boundingPoly.normalizedVertices[0]?.y || 0,
          width: (obj.boundingPoly.normalizedVertices[2]?.x || 0) - (obj.boundingPoly.normalizedVertices[0]?.x || 0),
          height: (obj.boundingPoly.normalizedVertices[2]?.y || 0) - (obj.boundingPoly.normalizedVertices[0]?.y || 0)
        }
      }));

      response.data.objects = objects;
    }

    res.json(response);

  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Handle specific Google Cloud Vision errors
    if (error.code === 7) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IMAGE',
          message: 'Invalid or corrupted image file'
        }
      });
    }

    if (error.code === 3) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'IMAGE_TOO_LARGE',
          message: 'Image file is too large'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to analyze image'
      }
    });
  }
};

// Helper function to categorize food items
function categorizeFood(foodName) {
  const foodCategories = {
    'fruits': ['apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'raspberry', 'peach', 'pear', 'plum', 'cherry', 'mango', 'pineapple', 'watermelon', 'cantaloupe', 'kiwi', 'lemon', 'lime', 'avocado'],
    'vegetables': ['carrot', 'broccoli', 'cauliflower', 'spinach', 'lettuce', 'tomato', 'cucumber', 'pepper', 'onion', 'garlic', 'potato', 'sweet potato', 'corn', 'beans', 'peas', 'celery', 'cabbage', 'radish', 'beet', 'asparagus'],
    'meals': ['pizza', 'burger', 'sandwich', 'pasta', 'rice', 'soup', 'salad', 'stir fry', 'curry', 'casserole', 'lasagna', 'tacos', 'burrito', 'wrap', 'bowl'],
    'bakery': ['bread', 'roll', 'bagel', 'muffin', 'croissant', 'donut', 'cake', 'cookie', 'pie', 'tart', 'pastry', 'biscuit', 'cracker'],
    'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'ice cream', 'sour cream', 'cottage cheese', 'cream cheese'],
    'meat': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'ham', 'bacon', 'sausage', 'steak', 'chop', 'roast'],
    'seafood': ['fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'scallop', 'mussel', 'oyster', 'squid', 'octopus'],
    'grains': ['rice', 'pasta', 'noodle', 'quinoa', 'barley', 'oats', 'wheat', 'bread', 'cereal', 'granola'],
    'beverages': ['juice', 'soda', 'water', 'coffee', 'tea', 'smoothie', 'shake', 'wine', 'beer', 'cocktail'],
    'other': ['snack', 'candy', 'chocolate', 'nuts', 'seeds', 'dried fruit', 'trail mix', 'energy bar', 'protein bar']
  };

  const lowerFoodName = foodName.toLowerCase();
  
  for (const [category, foods] of Object.entries(foodCategories)) {
    if (foods.some(food => lowerFoodName.includes(food))) {
      return category;
    }
  }

  return 'other';
}
