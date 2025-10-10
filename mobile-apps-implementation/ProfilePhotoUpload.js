/**
 * Profile Photo Upload Component for AnyRyde Mobile Apps
 * Provides camera and photo library integration for profile photos
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ActivityIndicator
} from 'react-native';
import ImagePicker from 'react-native-image-picker';
import CachedProfileImage from './CachedProfileImage';
import { uploadProfilePhoto } from '../services/profilePhotoService';

const ProfilePhotoUpload = ({ 
  userId, 
  currentPhotoURL, 
  onPhotoUpdate,
  size = 100,
  showEditButton = true,
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'AnyRyde needs access to your camera to take profile photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const showImagePicker = () => {
    if (disabled || uploading) return;

    Alert.alert(
      'Select Photo',
      'Choose how you want to add a profile photo',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Photo Library', onPress: () => openImageLibrary() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
      includeBase64: false,
      cameraType: 'back',
    };

    ImagePicker.launchCamera(options, handleImagePickerResponse);
  };

  const openImageLibrary = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
      includeBase64: false,
      selectionLimit: 1,
    };

    ImagePicker.launchImageLibrary(options, handleImagePickerResponse);
  };

  const handleImagePickerResponse = async (response) => {
    if (response.didCancel) {
      console.log('Image picker cancelled');
      return;
    }

    if (response.error) {
      console.error('Image picker error:', response.error);
      Alert.alert('Error', 'Failed to access camera or photo library.');
      return;
    }

    if (response.assets && response.assets[0]) {
      const photoFile = response.assets[0];
      await uploadPhoto(photoFile);
    }
  };

  const uploadPhoto = async (photoFile) => {
    setUploading(true);
    
    try {
      console.log('Uploading photo:', photoFile);
      
      const result = await uploadProfilePhoto(userId, photoFile);
      
      if (result.success) {
        console.log('Photo uploaded successfully:', result.photoURL);
        
        // Callback to parent component
        if (onPhotoUpdate) {
          onPhotoUpdate(result.photoURL);
        }
        
        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.photoContainer, { opacity: disabled ? 0.6 : 1 }]}
        onPress={showImagePicker}
        disabled={disabled || uploading}
        activeOpacity={0.7}
      >
        <CachedProfileImage
          userId={userId}
          photoURL={currentPhotoURL}
          size={size}
          style={[styles.profileImage, { borderWidth: 3, borderColor: '#16a34a' }]}
        />
        
        {uploading && (
          <View style={[styles.uploadOverlay, { borderRadius: size / 2 }]}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.uploadText}>Uploading...</Text>
          </View>
        )}
        
        {showEditButton && !uploading && (
          <View style={[styles.editButton, { 
            width: size * 0.3, 
            height: size * 0.3,
            borderRadius: size * 0.15,
            bottom: size * 0.05,
            right: size * 0.05
          }]}>
            <Text style={[styles.editButtonText, { fontSize: size * 0.15 }]}>
              📷
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      {!disabled && (
        <Text style={styles.instructionText}>
          Tap to change profile photo
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 10,
    fontSize: 14,
  },
  editButton: {
    position: 'absolute',
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  editButtonText: {
    color: 'white',
  },
  instructionText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ProfilePhotoUpload;
