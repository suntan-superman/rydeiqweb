/**
 * Profile Photo Service for AnyRyde Mobile Apps
 * Handles profile photo upload, retrieval, and management
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { storage, auth, db } from '../services/firebase';

export const uploadProfilePhoto = async (userId, photoFile) => {
  try {
    console.log('Uploading profile photo for user:', userId);
    
    // Validate file
    if (!photoFile || !photoFile.uri) {
      throw new Error('No photo file provided');
    }
    
    // Convert file to blob if needed (React Native)
    let blob;
    if (photoFile.uri) {
      const response = await fetch(photoFile.uri);
      blob = await response.blob();
    } else {
      blob = photoFile;
    }
    
    // Create storage reference with correct path
    const fileExtension = photoFile.uri ? photoFile.uri.split('.').pop() : 'jpg';
    const fileName = `profile.${fileExtension}`;
    const storageRef = ref(storage, `users/${userId}/profile/${fileName}`);
    
    console.log('Storage path:', storageRef.fullPath);
    
    // Upload to Firebase Storage
    const snapshot = await uploadBytes(storageRef, blob);
    console.log('Upload completed:', snapshot);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL:', downloadURL);
    
    // Update Firebase Auth photoURL
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, { photoURL: downloadURL });
      console.log('Firebase Auth photoURL updated');
    }
    
    // Update Firestore user document
    await updateDoc(doc(db, 'users', userId), {
      photoURL: downloadURL,
      profilePhoto: {
        url: downloadURL,
        fileName: fileName,
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    });
    
    console.log('Firestore updated with profile photo');
    
    return {
      success: true,
      photoURL: downloadURL,
      fileName: fileName
    };
    
  } catch (error) {
    console.error('Profile photo upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const deleteProfilePhoto = async (userId, fileName) => {
  try {
    const storageRef = ref(storage, `users/${userId}/profile/${fileName}`);
    await deleteObject(storageRef);
    
    // Update Firebase Auth
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, { photoURL: null });
    }
    
    // Update Firestore
    await updateDoc(doc(db, 'users', userId), {
      photoURL: null,
      'profilePhoto.url': null,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Profile photo deletion error:', error);
    return { success: false, error: error.message };
  }
};

export const getProfilePhotoURL = async (userId) => {
  try {
    // First try to get from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.profilePhoto?.url) {
        return userData.profilePhoto.url;
      }
      if (userData.photoURL) {
        return userData.photoURL;
      }
    }
    
    // Fallback to Firebase Auth
    const user = auth.currentUser;
    if (user && user.photoURL) {
      return user.photoURL;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting profile photo URL:', error);
    return null;
  }
};

export const updateUserProfilePhoto = async (userId, photoURL) => {
  try {
    // Update Firebase Auth
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, { photoURL });
    }
    
    // Update Firestore
    await updateDoc(doc(db, 'users', userId), {
      photoURL: photoURL,
      'profilePhoto.url': photoURL,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating profile photo:', error);
    return { success: false, error: error.message };
  }
};
