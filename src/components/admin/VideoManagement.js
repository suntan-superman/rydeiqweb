import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlayIcon, 
  EyeIcon, 
  TrashIcon, 
  ArrowDownTrayIcon,
  VideoCameraIcon,
  ClockIcon,
  DocumentIcon,
  UserIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import videoManagementService from '../../services/videoManagementService';
import toast from 'react-hot-toast';

const VideoManagement = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [statistics, setStatistics] = useState(null);
  const [filter, setFilter] = useState('all'); // all, completed, processing, failed
  const [searchCriteria, setSearchCriteria] = useState({
    driverId: '',
    rideId: '',
    status: '',
    recordingType: ''
  });

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      let videosData;
      if (filter === 'all') {
        videosData = await videoManagementService.getRecentVideos(100);
      } else {
        videosData = await videoManagementService.searchVideos({
          status: filter,
          limit: 100
        });
      }
      setVideos(videosData);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadStatistics = useCallback(async () => {
    try {
      const result = await videoManagementService.getVideoStatistics(timeRange);
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, [timeRange]);

  useEffect(() => {
    loadVideos();
    loadStatistics();
  }, [loadVideos, loadStatistics]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const criteria = {
        ...searchCriteria,
        limit: 100
      };
      const videosData = await videoManagementService.searchVideos(criteria);
      setVideos(videosData);
    } catch (error) {
      console.error('Error searching videos:', error);
      toast.error('Failed to search videos');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVideo = async (video) => {
    try {
      // Get video URL
      const videoResult = await videoManagementService.getVideoUrl(video.id, video.storagePath);
      if (videoResult.success) {
        setSelectedVideo({
          ...video,
          videoUrl: videoResult.url
        });
        setShowVideoModal(true);
      } else {
        toast.error('Failed to load video');
      }
    } catch (error) {
      console.error('Error viewing video:', error);
      toast.error('Error loading video');
    }
  };

  const handleDeleteVideo = async (videoId, storagePath) => {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await videoManagementService.deleteVideo(videoId, storagePath);
      if (result.success) {
        toast.success('Video deleted successfully');
        loadVideos();
        loadStatistics();
      } else {
        toast.error('Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Error deleting video');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'recording':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'deleted':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecordingTypeIcon = (type) => {
    switch (type) {
      case 'dashcam':
        return <VideoCameraIcon className="h-5 w-5" />;
      case 'interior':
        return <UserIcon className="h-5 w-5" />;
      case 'exterior':
        return <TruckIcon className="h-5 w-5" />;
      default:
        return <VideoCameraIcon className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes) => {
    return videoManagementService.formatFileSize(bytes);
  };

  const formatDuration = (seconds) => {
    return videoManagementService.formatDuration(seconds);
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredVideos = videos.filter(video => {
    if (filter === 'all') return true;
    return video.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Video Management</h2>
          <p className="text-gray-600">Manage and monitor video recordings from rides</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Videos</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <VideoCameraIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Videos</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalVideos}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <PlayIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.completedVideos}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.processingVideos}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DocumentIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">{formatFileSize(statistics.totalStorageUsed)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Search Videos</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Driver ID</label>
            <input
              type="text"
              value={searchCriteria.driverId}
              onChange={(e) => setSearchCriteria({...searchCriteria, driverId: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter driver ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ride ID</label>
            <input
              type="text"
              value={searchCriteria.rideId}
              onChange={(e) => setSearchCriteria({...searchCriteria, rideId: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter ride ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={searchCriteria.status}
              onChange={(e) => setSearchCriteria({...searchCriteria, status: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="recording">Recording</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Recording Type</label>
            <select
              value={searchCriteria.recordingType}
              onChange={(e) => setSearchCriteria({...searchCriteria, recordingType: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="dashcam">Dashcam</option>
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search Videos
          </button>
        </div>
      </div>

      {/* Videos Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Videos ({filteredVideos.length})</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading videos...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-8 text-center">
            <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No videos found for the selected criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Video
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ride
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVideos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-gray-300 flex items-center justify-center">
                          {getRecordingTypeIcon(video.recordingType)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {video.recordingType || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {video.rideId?.slice(-8) || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Driver {video.driverId?.slice(-6) || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {video.rideId?.slice(-8) || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDuration(video.duration || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatFileSize(video.fileSize || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(video.status)}`}>
                        {video.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeAgo(video.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewVideo(video)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Video"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(video.id, video.storagePath)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Video"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Video Player</h3>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    controls
                    className="w-full h-96"
                    src={selectedVideo.videoUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recording Type</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedVideo.recordingType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDuration(selectedVideo.duration)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">File Size</label>
                    <p className="mt-1 text-sm text-gray-900">{formatFileSize(selectedVideo.fileSize)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedVideo.status)}`}>
                      {selectedVideo.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Close
                </button>
                <a
                  href={selectedVideo.videoUrl}
                  download
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 inline mr-1" />
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoManagement;
