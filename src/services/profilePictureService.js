import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, storage, auth } from './firebase';

/**
 * Profile Picture Service
 * Handles profile picture uploads for riders and drivers
 */

// Image validation constraints
const IMAGE_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MIN_SIZE: 10 * 1024, // 10KB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
};

/**
 * Validate profile picture
 */
export const validateProfilePicture = (file) => {
  const errors = [];

  if (!IMAGE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type)) {
    errors.push(`Invalid file type. Allowed: ${IMAGE_CONSTRAINTS.ALLOWED_TYPES.join(', ')}`);
  }

  if (file.size > IMAGE_CONSTRAINTS.MAX_SIZE) {
    errors.push(`File too large. Maximum: ${IMAGE_CONSTRAINTS.MAX_SIZE / 1024 / 1024}MB`);
  }

  if (file.size < IMAGE_CONSTRAINTS.MIN_SIZE) {
    errors.push(`File too small. Minimum: ${IMAGE_CONSTRAINTS.MIN_SIZE / 1024}KB`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Optimize image for upload
 */
export const optimizeProfilePicture = async (file, maxWidth = 800, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate new dimensions (square crop)
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = maxWidth;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, x, y, size, size, 0, 0, maxWidth, maxWidth);

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
 * Upload profile picture
 * @param {string} userId - User ID
 * @param {File} file - Image file
 * @param {string} collection - 'users' or 'driverApplications'
 */
export const uploadProfilePicture = async (userId, file, collection = 'users') => {
  try {
    console.log('📸 Uploading profile picture:', { userId, collection });

    // Validate
    const validation = validateProfilePicture(file);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    // Optimize
    const optimizedFile = await optimizeProfilePicture(file);
    console.log('✅ Image optimized:', {
      originalSize: file.size,
      optimizedSize: optimizedFile.size,
      reduction: Math.round((1 - optimizedFile.size / file.size) * 100) + '%'
    });

    // Upload to storage
    const timestamp = Date.now();
    const fileName = `profile_${timestamp}.jpg`;
    const storageRef = ref(storage, `users/${userId}/profile/${fileName}`);

    const snapshot = await uploadBytes(storageRef, optimizedFile, {
      contentType: 'image/jpeg',
      customMetadata: {
        uploadedAt: new Date().toISOString()
      }
    });

    const photoURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Upload complete:', photoURL);

    // Update Firebase Auth profile
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await updateProfile(auth.currentUser, { photoURL });
      console.log('✅ Firebase Auth profile updated');
    }

    // Update Firestore
    const docRef = doc(db, collection, userId);
    await updateDoc(docRef, {
      photoURL: photoURL,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Firestore updated');

    return {
      success: true,
      photoURL: photoURL
    };
  } catch (error) {
    console.error('❌ Error uploading profile picture:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete profile picture
 * @param {string} collection - 'users' or 'driverApplications'
 */
export const deleteProfilePicture = async (userId, collection = 'users') => {
  try {
    // Note: We don't delete the file from storage to maintain history
    // Just remove the reference from Firestore and Auth

    // Update Firebase Auth
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await updateProfile(auth.currentUser, { photoURL: null });
    }

    // Update Firestore
    const docRef = doc(db, collection, userId);
    await updateDoc(docRef, {
      photoURL: null,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting profile picture:', error);
    return { success: false, error: error.message };
  }
};

const profilePictureService = {
  validateProfilePicture,
  optimizeProfilePicture,
  uploadProfilePicture,
  deleteProfilePicture
};

export default profilePictureService;

