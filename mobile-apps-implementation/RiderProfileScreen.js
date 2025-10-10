/**
 * Rider Profile Screen Implementation
 * Shows rider profile with photo upload functionality
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import { useAuth } from '../contexts/AuthContext';
import { getProfilePhotoURL, deleteProfilePhoto } from '../services/profilePhotoService';

const RiderProfileScreen = () => {
  const { user } = useAuth();
  const [profilePhotoURL, setProfilePhotoURL] = useState(user?.photoURL);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load current profile photo on mount
    const loadCurrentPhoto = async () => {
      if (user?.uid) {
        const photoURL = await getProfilePhotoURL(user.uid);
        if (photoURL) {
          setProfilePhotoURL(photoURL);
        }
      }
    };

    loadCurrentPhoto();
  }, [user?.uid]);

  const handlePhotoUpdate = async (newPhotoURL) => {
    setProfilePhotoURL(newPhotoURL);
    console.log('Profile photo updated:', newPhotoURL);
  };

  const handleDeletePhoto = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await deleteProfilePhoto(user.uid);
              if (result.success) {
                setProfilePhotoURL(null);
                Alert.alert('Success', 'Profile photo deleted successfully.');
              } else {
                Alert.alert('Error', 'Failed to delete photo. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete photo. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  const getRiderStats = () => {
    // These would come from your ride data
    return {
      totalRides: 0,
      rating: 5.0,
      memberSince: user?.createdAt
    };
  };

  const stats = getRiderStats();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <ProfilePhotoUpload
            userId={user?.uid}
            currentPhotoURL={profilePhotoURL}
            onPhotoUpdate={handlePhotoUpdate}
            size={120}
            disabled={loading}
          />
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeletePhoto}
            disabled={!profilePhotoURL || loading}
          >
            <Text style={styles.deleteButtonText}>Remove Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Rider Information */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>
            {user?.displayName || user?.email}
          </Text>
          
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>⭐ {stats.rating.toFixed(1)}</Text>
            <Text style={styles.ridesText}>{stats.totalRides} rides completed</Text>
          </View>
        </View>

        {/* Profile Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{user?.email}</Text>
          </View>

          {user?.personalInfo?.phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{user.personalInfo.phone}</Text>
            </View>
          )}

          {user?.personalInfo?.firstName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>First Name:</Text>
              <Text style={styles.detailValue}>{user.personalInfo.firstName}</Text>
            </View>
          )}

          {user?.personalInfo?.lastName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Name:</Text>
              <Text style={styles.detailValue}>{user.personalInfo.lastName}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Member Since:</Text>
            <Text style={styles.detailValue}>
              {formatDate(stats.memberSince)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email Verified:</Text>
            <Text style={[
              styles.detailValue,
              { color: user?.emailVerified ? '#16a34a' : '#ef4444' }
            ]}>
              {user?.emailVerified ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        {/* Ride Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Ride Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalRides}</Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Average Rating</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Ride History</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Payment Methods</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Safety Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  deleteButton: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  ridesText: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#6b7280',
    flex: 2,
    textAlign: 'right',
  },
  statsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});

export default RiderProfileScreen;
