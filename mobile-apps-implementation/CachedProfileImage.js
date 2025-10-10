/**
 * Cached Profile Image Component for AnyRyde Mobile Apps
 * Provides optimized image loading with caching and fallback support
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import FastImage from 'react-native-fast-image';
import { getProfilePhotoURL } from '../services/profilePhotoService';

const CachedProfileImage = ({ 
  userId, 
  photoURL, 
  size = 50, 
  style, 
  fallbackIcon = '👤',
  onError,
  onLoad,
  ...props 
}) => {
  const [imageUrl, setImageUrl] = useState(photoURL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      setLoading(true);
      setError(false);
      
      try {
        if (photoURL) {
          setImageUrl(photoURL);
          setLoading(false);
        } else if (userId) {
          // Try to get photo URL from service
          const url = await getProfilePhotoURL(userId);
          if (url) {
            setImageUrl(url);
          } else {
            setError(true);
          }
          setLoading(false);
        } else {
          setError(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading profile photo:', err);
        setError(true);
        setLoading(false);
      }
    };

    loadImage();
  }, [userId, photoURL]);

  const imageStyle = [
    styles.image,
    { width: size, height: size, borderRadius: size / 2 },
    style
  ];

  const handleLoad = () => {
    setLoading(false);
    if (onLoad) onLoad();
  };

  const handleError = (error) => {
    console.error('Image load error for URL:', imageUrl, error);
    setError(true);
    setLoading(false);
    if (onError) onError(error);
  };

  if (loading) {
    return (
      <View style={[imageStyle, styles.loadingContainer]}>
        <ActivityIndicator size="small" color="#16a34a" />
      </View>
    );
  }

  if (error || !imageUrl) {
    return (
      <View style={[imageStyle, styles.fallbackContainer]}>
        <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>
          {fallbackIcon}
        </Text>
      </View>
    );
  }

  return (
    <FastImage
      source={{
        uri: imageUrl,
        priority: FastImage.priority.high,
        cache: FastImage.cacheControl.immutable
      }}
      style={imageStyle}
      resizeMode={FastImage.resizeMode.cover}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  fallbackText: {
    color: '#6b7280',
  },
});

export default CachedProfileImage;
