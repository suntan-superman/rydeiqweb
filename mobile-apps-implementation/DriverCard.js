/**
 * Driver Card Component for displaying driver information in lists
 * Shows driver photo, name, rating, and other relevant information
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CachedProfileImage from './CachedProfileImage';

const DriverCard = ({ 
  driver, 
  onPress,
  showDistance = false,
  showVehicle = false,
  compact = false 
}) => {
  const {
    userId,
    name,
    displayName,
    photoURL,
    rating = 5.0,
    totalRides = 0,
    vehicleInfo,
    distance,
    eta,
    isOnline = false
  } = driver;

  const driverName = name || displayName || 'Driver';
  const cardStyle = compact ? styles.compactCard : styles.card;
  const imageSize = compact ? 40 : 60;

  return (
    <TouchableOpacity 
      style={cardStyle}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Driver Photo and Status */}
      <View style={styles.photoContainer}>
        <CachedProfileImage
          userId={userId}
          photoURL={photoURL}
          size={imageSize}
          style={styles.driverImage}
        />
        
        {/* Online Status Indicator */}
        <View style={[
          styles.statusIndicator,
          { backgroundColor: isOnline ? '#16a34a' : '#6b7280' }
        ]} />
      </View>

      {/* Driver Information */}
      <View style={styles.driverInfo}>
        <Text style={[styles.driverName, compact && styles.compactDriverName]}>
          {driverName}
        </Text>
        
        {/* Rating and Rides */}
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>
            ⭐ {rating.toFixed(1)}
          </Text>
          {!compact && (
            <Text style={styles.ridesCount}>
              ({totalRides} rides)
            </Text>
          )}
        </View>

        {/* Vehicle Information */}
        {showVehicle && vehicleInfo && (
          <Text style={styles.vehicleInfo}>
            {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
          </Text>
        )}

        {/* Distance and ETA */}
        {showDistance && (
          <View style={styles.locationInfo}>
            {distance && (
              <Text style={styles.distance}>
                📍 {distance} miles away
              </Text>
            )}
            {eta && (
              <Text style={styles.eta}>
                ⏱️ {eta} min ETA
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Action Indicator */}
      {onPress && (
        <View style={styles.actionIndicator}>
          <Text style={styles.actionText}>›</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 15,
  },
  driverImage: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  compactDriverName: {
    fontSize: 16,
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginRight: 8,
  },
  ridesCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  vehicleInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distance: {
    fontSize: 12,
    color: '#6b7280',
  },
  eta: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  actionIndicator: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  actionText: {
    fontSize: 18,
    color: '#9ca3af',
    fontWeight: 'bold',
  },
});

export default DriverCard;
