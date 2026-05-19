// src/context/DriveContext.jsx
// Premium, highly performant context that manages global, synchronized state for files, folders, and storage
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const DriveContext = createContext();

export const DriveProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Core drive states
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(104857600); // Default 100MB
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [uploadState, setUploadState] = useState(null); // { name, progress, status, error }

  // @desc    Fetch all user drive data from the MERN backend API endpoints
  const fetchDriveData = async () => {
    if (!user) return;
    setLoadingDrive(true);
    try {
      // 1. Get folders and files (excluding soft-deleted folders/files on backend)
      const driveRes = await api.get('/drive');
      if (driveRes.data.success) {
        setFiles(driveRes.data.files || []);
        setFolders(driveRes.data.folders || []);
      }

      // 2. Get recent uploads
      const recentRes = await api.get('/files/recent');
      if (recentRes.data.success) {
        setRecentFiles(recentRes.data.files || []);
      }

      // 3. Get exact storage consumption from profile
      const profileRes = await api.get('/user/profile');
      if (profileRes.data.success) {
        setStorageUsed(profileRes.data.user.storageUsed);
        setStorageLimit(profileRes.data.user.storageLimit);
      }
    } catch (error) {
      console.error('Failed to retrieve synchronized drive listing:', error);
    } finally {
      setLoadingDrive(false);
    }
  };

  // Re-fetch automatically whenever the active user state switches
  useEffect(() => {
    if (user && !user.isFirebase) {
      fetchDriveData();
    } else {
      // Clear workspace metrics on sign out
      setFiles([]);
      setFolders([]);
      setRecentFiles([]);
      setStorageUsed(0);
    }
  }, [user]);

  // @desc    Upload file via Axios with real-time progress calculations and instant state synchronization
  const uploadFile = async (file, relativePath = '') => {
    setUploadState({ name: relativePath || file.name, progress: 0, status: 'uploading', error: null });
    const formData = new FormData();
    formData.append('file', file);
    if (relativePath) {
      formData.append('relativePath', relativePath);
    }

    try {
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadState((prev) => prev ? { ...prev, progress: percent } : null);
        }
      });

      if (response.data.success) {
        setUploadState((prev) => prev ? { ...prev, status: 'completed', progress: 100 } : null);
        const newFile = response.data.file;

        // Synchronize all pages instantly!
        setFiles((prev) => [newFile, ...prev]);

        if (newFile.type !== 'folder') {
          setRecentFiles((prev) => [newFile, ...prev].slice(0, 10)); // Top 10 only
        }

        setStorageUsed(response.data.storageUsed);
        setStorageLimit(response.data.storageLimit);

        setTimeout(() => setUploadState(null), 4000);
        return { success: true };
      }
    } catch (error) {
      console.error('File upload failed:', error);
      const message = error.response?.data?.message || 'File upload failed';
      setUploadState({ name: relativePath || file.name, progress: 0, status: 'error', error: message });
      setTimeout(() => setUploadState(null), 5000);
      return { success: false, message };
    }
  };

  // @desc    Create virtual directory folder and append record to local state instantly
  const createFolder = async (folderName) => {
    try {
      const response = await api.post('/files/create-folder', { folderName });
      if (response.data.success) {
        const virtualFile = response.data.file;
        const actualFolder = response.data.folderRecord;

        // Instantly synchronizes My Drive page
        setFiles((prev) => [virtualFile, ...prev]);
        if (actualFolder) {
          setFolders((prev) => [actualFolder, ...prev]);
        }
        return { success: true };
      }
    } catch (error) {
      console.error('Folder creation failed:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to create folder' };
    }
  };

  // @desc    Optimistically delete item (Soft-delete to Bin, or Permanent physical purge)
  const deleteFileById = async (fileId) => {
    // 1. Capture snapshot of local state arrays for immediate rollback if backend fails
    const previousFiles = [...files];
    const previousFolders = [...folders];
    const previousRecent = [...recentFiles];
    const previousStorageUsed = storageUsed;

    const fileToDelete = files.find((f) => f._id === fileId);
    if (!fileToDelete) return { success: false, message: 'File not found' };

    const isPermanent = fileToDelete.isDeleted === true;

    // 2. OPTIMISTIC UPDATE: instantly alter local state arrays before API call completes
    if (isPermanent) {
      // Permanent: purge from all lists and subtract size instantly
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
      setRecentFiles((prev) => prev.filter((f) => f._id !== fileId));
      if (fileToDelete.type === 'folder' && fileToDelete.folderId) {
        setFolders((prev) => prev.filter((fol) => fol._id !== fileToDelete.folderId));
      }
      setStorageUsed((prev) => Math.max(0, prev - fileToDelete.size));
    } else {
      // Soft-Delete: set isDeleted: true instantly and subtract size instantly so it releases storage immediately
      setFiles((prev) => prev.map((f) => f._id === fileId ? { ...f, isDeleted: true } : f));
      setRecentFiles((prev) => prev.map((f) => f._id === fileId ? { ...f, isDeleted: true } : f));
      if (fileToDelete.type === 'folder' && fileToDelete.folderId) {
        setFolders((prev) => prev.map((fol) => fol._id === fileToDelete.folderId ? { ...fol, isDeleted: true } : fol));
      }
      setStorageUsed((prev) => Math.max(0, prev - fileToDelete.size));
    }

    try {
      // 3. Silently trigger backend sync in the background
      const response = await api.delete(`/files/${fileId}`);
      if (response.data.success) {
        // Keeps local storage numbers exact with server
        setStorageUsed(response.data.storageUsed);
        setStorageLimit(response.data.storageLimit);
        return { success: true };
      } else {
        throw new Error('API delete returned false');
      }
    } catch (error) {
      // 4. ROLLBACK: revert local states if API fails
      console.error('Optimistic UI rollback triggered for file deletion:', error);
      setFiles(previousFiles);
      setFolders(previousFolders);
      setRecentFiles(previousRecent);
      setStorageUsed(previousStorageUsed);
      return { success: false, message: error.response?.data?.message || 'Deletion failed' };
    }
  };

  // @desc    Optimistically restore soft-deleted item from the Bin
  const restoreFileById = async (fileId) => {
    // 1. Capture snapshot for rollback
    const previousFiles = [...files];
    const previousFolders = [...folders];
    const previousRecent = [...recentFiles];
    const previousStorageUsed = storageUsed;

    const fileToRestore = files.find((f) => f._id === fileId);
    const fileSize = fileToRestore ? fileToRestore.size : 0;

    // 2. OPTIMISTIC UPDATE: instantly unset isDeleted flag and add size back to active consumption
    setFiles((prev) => prev.map((f) => f._id === fileId ? { ...f, isDeleted: false } : f));
    setRecentFiles((prev) => prev.map((f) => f._id === fileId ? { ...f, isDeleted: false } : f));
    if (fileToRestore && fileToRestore.type === 'folder' && fileToRestore.folderId) {
      setFolders((prev) => prev.map((fol) => fol._id === fileToRestore.folderId ? { ...fol, isDeleted: false } : fol));
    }
    setStorageUsed((prev) => Math.min(storageLimit, prev + fileSize));

    try {
      // 3. Silently trigger restore API call
      const response = await api.put(`/files/${fileId}/restore`);
      if (response.data.success) {
        setStorageUsed(response.data.storageUsed);
        setStorageLimit(response.data.storageLimit);
        return { success: true };
      } else {
        throw new Error('API restore returned false');
      }
    } catch (error) {
      // 4. ROLLBACK: revert state on network error
      console.error('Optimistic UI rollback triggered for file restoration:', error);
      setFiles(previousFiles);
      setFolders(previousFolders);
      setRecentFiles(previousRecent);
      setStorageUsed(previousStorageUsed);
      return { success: false, message: error.response?.data?.message || 'Restoration failed' };
    }
  };

  return (
    <DriveContext.Provider value={{ 
      files, folders, recentFiles, storageUsed, storageLimit, loadingDrive, uploadState,
      fetchDriveData, uploadFile, createFolder, deleteFileById, restoreFileById
    }}>
      {children}
    </DriveContext.Provider>
  );
};

export const useDrive = () => useContext(DriveContext);
