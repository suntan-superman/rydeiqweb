import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, storage } from './firebase';

/**
 * Vehicle Image Service
 * Handles vehicle photo uploads, fallback images, and display logic
 */

// Vehicle image types
export const VEHICLE_IMAGE_TYPES = {
  FRONT: 'front',
  SIDE: 'side',
  BACK: 'back',
  INTERIOR: 'interior'
};

// Image validation constraints
const IMAGE_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MIN_SIZE: 50 * 1024, // 50KB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,
  MIN_WIDTH: 800,
  MIN_HEIGHT: 600
};

/**
 * Validate image file
 */
export const validateVehicleImage = async (file) => {
  const errors = [];

  // Check file type
  if (!IMAGE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type)) {
    errors.push(`Invalid file type. Allowed types: ${IMAGE_CONSTRAINTS.ALLOWED_TYPES.join(', ')}`);
  }

  // Check file size
  if (file.size > IMAGE_CONSTRAINTS.MAX_SIZE) {
    errors.push(`File too large. Maximum size: ${IMAGE_CONSTRAINTS.MAX_SIZE / 1024 / 1024}MB`);
  }

  if (file.size < IMAGE_CONSTRAINTS.MIN_SIZE) {
    errors.push(`File too small. Minimum size: ${IMAGE_CONSTRAINTS.MIN_SIZE / 1024}KB`);
  }

  // Check image dimensions
  try {
    const dimensions = await getImageDimensions(file);
    
    if (dimensions.width < IMAGE_CONSTRAINTS.MIN_WIDTH || dimensions.height < IMAGE_CONSTRAINTS.MIN_HEIGHT) {
      errors.push(`Image too small. Minimum dimensions: ${IMAGE_CONSTRAINTS.MIN_WIDTH}x${IMAGE_CONSTRAINTS.MIN_HEIGHT}px`);
    }

    if (dimensions.width > IMAGE_CONSTRAINTS.MAX_WIDTH || dimensions.height > IMAGE_CONSTRAINTS.MAX_HEIGHT) {
      errors.push(`Image too large. Maximum dimensions: ${IMAGE_CONSTRAINTS.MAX_WIDTH}x${IMAGE_CONSTRAINTS.MAX_HEIGHT}px`);
    }
  } catch (error) {
    errors.push('Failed to read image dimensions');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get image dimensions
 */
const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.width,
        height: img.height
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

/**
 * Optimize image for upload
 */
export const optimizeVehicleImage = async (file, maxWidth = 1200, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            reject(new Error('Failed to optimize image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

/**
 * Upload vehicle photo
 */
export const uploadVehiclePhoto = async (userId, file, imageType = VEHICLE_IMAGE_TYPES.FRONT) => {
  try {
    console.log('🚗 Uploading vehicle photo:', { userId, imageType, fileName: file.name });

    // Validate image
    const validation = await validateVehicleImage(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Optimize image
    const optimizedFile = await optimizeVehicleImage(file);
    console.log('✅ Image optimized:', {
      originalSize: file.size,
      optimizedSize: optimizedFile.size,
      reduction: Math.round((1 - optimizedFile.size / file.size) * 100) + '%'
    });

    // Create storage reference
    const timestamp = Date.now();
    const fileExtension = optimizedFile.type.split('/')[1];
    const fileName = `${imageType}_${timestamp}.${fileExtension}`;
    const storageRef = ref(storage, `drivers/${userId}/vehicle/${fileName}`);

    // Upload file
    console.log('📤 Uploading to storage...');
    const snapshot = await uploadBytes(storageRef, optimizedFile, {
      contentType: optimizedFile.type,
      customMetadata: {
        imageType,
        uploadedAt: new Date().toISOString(),
        originalFileName: file.name
      }
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Upload complete:', downloadURL);

    // Update Firestore
    const driverRef = doc(db, 'driverApplications', userId);
    await updateDoc(driverRef, {
      [`vehicleInfo.photos.${imageType}`]: {
        url: downloadURL,
        fileName: fileName,
        uploadedAt: serverTimestamp(),
        imageType: imageType
      },
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      url: downloadURL,
      imageType,
      fileName
    };
  } catch (error) {
    console.error('❌ Error uploading vehicle photo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete vehicle photo
 */
export const deleteVehiclePhoto = async (userId, imageType) => {
  try {
    console.log('🗑️ Deleting vehicle photo:', { userId, imageType });

    // Get current photo info
    const driverRef = doc(db, 'driverApplications', userId);
    const driverDoc = await getDoc(driverRef);
    const driverData = driverDoc.data();

    if (driverData?.vehicleInfo?.photos?.[imageType]) {
      const fileName = driverData.vehicleInfo.photos[imageType].fileName;
      const storageRef = ref(storage, `drivers/${userId}/vehicle/${fileName}`);

      // Delete from storage
      try {
        await deleteObject(storageRef);
        console.log('✅ Deleted from storage');
      } catch (storageError) {
        console.warn('⚠️ File may not exist in storage:', storageError);
      }

      // Remove from Firestore
      const updatedPhotos = { ...driverData.vehicleInfo.photos };
      delete updatedPhotos[imageType];

      await updateDoc(driverRef, {
        'vehicleInfo.photos': updatedPhotos,
        updatedAt: serverTimestamp()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting vehicle photo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get fallback vehicle image from external API
 * Uses multiple providers for reliability
 */
export const getFallbackVehicleImage = async (vehicleInfo) => {
  const { make, model, year, color } = vehicleInfo;

  if (!make || !model || !year) {
    return getDefaultVehicleIcon(vehicleInfo);
  }

  try {
    // Try primary provider: Imagin Studio (high-quality stock images)
    // Note: This is a placeholder - you'll need to sign up for an API key
    const imaginUrl = await getImaginStudioImage(make, model, year, color);
    if (imaginUrl) return imaginUrl;

    // Fallback: Use local generic images
    return getGenericVehicleImage(vehicleInfo);
  } catch (error) {
    console.error('Error fetching fallback image:', error);
    return getDefaultVehicleIcon(vehicleInfo);
  }
};

/**
 * Get Imagin Studio vehicle image
 * API Documentation: https://imagin.studio/car-image-api
 */
const getImaginStudioImage = async (make, model, year, color) => {
  try {
    // TODO: Add your Imagin Studio API key
    const API_KEY = process.env.REACT_APP_IMAGIN_STUDIO_API_KEY;
    
    if (!API_KEY) {
      console.warn('⚠️ Imagin Studio API key not configured');
      return null;
    }

    // Normalize make and model for API
    const normalizedMake = make.toLowerCase().replace(/\s+/g, '');
    const normalizedModel = model.toLowerCase().replace(/\s+/g, '');
    
    // Build API URL
    const params = new URLSearchParams({
      customer: API_KEY,
      make: normalizedMake,
      modelFamily: normalizedModel,
      modelYear: year,
      angle: '01', // Front 3/4 view
      width: 800,
      height: 600
    });

    // Add color if available
    if (color) {
      params.append('paintId', normalizeColorName(color));
    }

    const imageUrl = `https://cdn.imagin.studio/getImage?${params.toString()}`;
    
    // Verify image exists
    const response = await fetch(imageUrl, { method: 'HEAD' });
    if (response.ok) {
      return imageUrl;
    }

    return null;
  } catch (error) {
    console.error('Imagin Studio API error:', error);
    return null;
  }
};

/**
 * Get generic vehicle image based on type
 */
const getGenericVehicleImage = (vehicleInfo) => {
  const { vehicleType = 'standard' } = vehicleInfo;

  // Map to generic vehicle images (you'll need to add these to your public folder)
  const genericImages = {
    sedan: '/images/vehicles/generic-sedan.png',
    suv: '/images/vehicles/generic-suv.png',
    truck: '/images/vehicles/generic-truck.png',
    van: '/images/vehicles/generic-van.png',
    luxury: '/images/vehicles/generic-luxury.png',
    standard: '/images/vehicles/generic-car.png',
    wheelchair_accessible: '/images/vehicles/generic-accessible-van.png',
    medical: '/images/vehicles/generic-medical-van.png'
  };

  return genericImages[vehicleType] || genericImages.standard;
};

/**
 * Get default vehicle icon (ultimate fallback)
 */
const getDefaultVehicleIcon = (vehicleInfo) => {
  return '/images/vehicles/default-vehicle-icon.png';
};

/**
 * Normalize color name for API
 */
const normalizeColorName = (color) => {
  const colorMap = {
    'black': 'black',
    'white': 'white',
    'silver': 'silver',
    'gray': 'grey',
    'grey': 'grey',
    'red': 'red',
    'blue': 'blue',
    'green': 'green',
    'yellow': 'yellow',
    'orange': 'orange',
    'brown': 'brown',
    'gold': 'gold',
    'beige': 'beige',
    'tan': 'tan'
  };

  const normalizedColor = color.toLowerCase().trim();
  return colorMap[normalizedColor] || 'silver';
};

/**
 * Get vehicle image with intelligent fallback
 */
export const getVehicleImage = async (driverData) => {
  try {
    // Priority 1: Driver-uploaded photo (front view preferred)
    if (driverData?.vehicleInfo?.photos?.front?.url) {
      return {
        url: driverData.vehicleInfo.photos.front.url,
        source: 'uploaded',
        type: 'front'
      };
    }

    // Priority 2: Any driver-uploaded photo
    if (driverData?.vehicleInfo?.photos) {
      const photos = driverData.vehicleInfo.photos;
      for (const type of [VEHICLE_IMAGE_TYPES.SIDE, VEHICLE_IMAGE_TYPES.BACK, VEHICLE_IMAGE_TYPES.INTERIOR]) {
        if (photos[type]?.url) {
          return {
            url: photos[type].url,
            source: 'uploaded',
            type
          };
        }
      }
    }

    // Priority 3: API-generated fallback image
    const fallbackUrl = await getFallbackVehicleImage(driverData?.vehicleInfo || {});
    return {
      url: fallbackUrl,
      source: 'fallback',
      type: 'generic'
    };
  } catch (error) {
    console.error('Error getting vehicle image:', error);
    return {
      url: getDefaultVehicleIcon(driverData?.vehicleInfo || {}),
      source: 'default',
      type: 'icon'
    };
  }
};

/**
 * Bulk upload vehicle photos
 */
export const bulkUploadVehiclePhotos = async (userId, files) => {
  const results = [];

  for (const { file, type } of files) {
    const result = await uploadVehiclePhoto(userId, file, type);
    results.push({ type, ...result });
  }

  return {
    success: results.every(r => r.success),
    results,
    uploadedCount: results.filter(r => r.success).length,
    failedCount: results.filter(r => !r.success).length
  };
};

const vehicleImageService = {
  VEHICLE_IMAGE_TYPES,
  validateVehicleImage,
  optimizeVehicleImage,
  uploadVehiclePhoto,
  deleteVehiclePhoto,
  getVehicleImage,
  getFallbackVehicleImage,
  bulkUploadVehiclePhotos
};

export default vehicleImageService;

