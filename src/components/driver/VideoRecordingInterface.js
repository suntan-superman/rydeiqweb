import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  VideoCameraIcon, 
  PlayIcon, 
  StopIcon,
  TrashIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import videoManagementService from '../../services/videoManagementService';
import toast from 'react-hot-toast';

const VideoRecordingInterface = ({ driverId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentRideId] = useState(null);
  const [recordingSettings, setRecordingSettings] = useState({
    autoStart: false,
    quality: '720p',
    duration: 30, // minutes
    uploadToCloud: true
  });

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  const loadRecordings = useCallback(async () => {
    try {
      setLoading(true);
      const videos = await videoManagementService.getVideoRecordingsForDriver(driverId);
      setRecordings(videos);
    } catch (error) {
      console.error('Error loading recordings:', error);
      toast.error('Failed to load recordings');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    loadRecordings();
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [driverId, loadRecordings]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: true 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        await uploadRecording(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check camera permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      toast.success('Recording stopped');
    }
  };

  const uploadRecording = async (blob) => {
    try {
      const file = new File([blob], `recording_${Date.now()}.webm`, { type: 'video/webm' });
      
      const metadata = {
        driverId,
        rideId: currentRideId || 'manual_recording',
        startTime: new Date(Date.now() - recordingTime * 1000),
        endTime: new Date(),
        duration: recordingTime,
        quality: recordingSettings.quality,
        type: 'dashcam'
      };

      const result = await videoManagementService.uploadVideoRecording(file, metadata);
      
      if (result.success) {
        toast.success('Recording uploaded successfully');
        loadRecordings();
      } else {
        toast.error('Failed to upload recording');
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
      toast.error('Error uploading recording');
    }
  };

  const deleteRecording = async (recordingId) => {
    if (window.confirm('Are you sure you want to delete this recording?')) {
      try {
        const result = await videoManagementService.deleteVideoRecording(recordingId);
        if (result.success) {
          toast.success('Recording deleted');
          loadRecordings();
        } else {
          toast.error('Failed to delete recording');
        }
      } catch (error) {
        console.error('Error deleting recording:', error);
        toast.error('Error deleting recording');
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Video Recording</h2>
        <p className="text-gray-600">Manage your dashcam recordings and settings</p>
      </div>

      {/* Recording Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recording Controls</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isRecording ? `Recording: ${formatTime(recordingTime)}` : 'Not Recording'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <VideoCameraIcon className="h-5 w-5" />
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <StopIcon className="h-5 w-5" />
              <span>Stop Recording</span>
            </button>
          )}

          <div className="text-sm text-gray-600">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={recordingSettings.autoStart}
                onChange={(e) => setRecordingSettings(prev => ({ ...prev, autoStart: e.target.checked }))}
                className="h-5 w-5 rounded border-2 border-gray-900 text-green-600 focus:ring-green-500"
              />
              <span>Auto-start with rides</span>
            </label>
          </div>
        </div>

        {/* Video Preview */}
        <div className="mt-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full max-w-md h-48 bg-gray-900 rounded-lg"
          />
        </div>
      </div>

      {/* Recording Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recording Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
            <select
              value={recordingSettings.quality}
              onChange={(e) => setRecordingSettings(prev => ({ ...prev, quality: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="480p">480p (SD)</option>
              <option value="720p">720p (HD)</option>
              <option value="1080p">1080p (Full HD)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Duration (minutes)</label>
            <input
              type="number"
              value={recordingSettings.duration}
              onChange={(e) => setRecordingSettings(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="120"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload to Cloud</label>
            <select
              value={recordingSettings.uploadToCloud}
              onChange={(e) => setRecordingSettings(prev => ({ ...prev, uploadToCloud: e.target.value === 'true' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="true">Yes</option>
              <option value="false">No (Local Only)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recordings List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Recordings</h3>
          <button
            onClick={loadRecordings}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading recordings...</span>
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-8">
            <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recordings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recordings.map((recording) => (
              <div key={recording.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-12 bg-gray-900 rounded flex items-center justify-center">
                      <PlayIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {recording.rideId ? `Ride ${recording.rideId.slice(-8)}` : 'Manual Recording'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(recording.startTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Duration: {formatTime(recording.duration || 0)} • 
                        Quality: {recording.quality} • 
                        Size: {formatFileSize(recording.fileSize || 0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recording.status)}`}>
                      {recording.status}
                    </span>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => window.open(recording.downloadURL, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Recording"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => window.open(recording.downloadURL, '_blank')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Download"
                      >
                        <CloudArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteRecording(recording.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoRecordingInterface;
