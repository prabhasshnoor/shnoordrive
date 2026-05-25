// src/context/DriveContext.jsx
// Premium, highly performant context that manages global, synchronized state for files, folders, and storage
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios'; // Import standard axios to directly interact with environment-driven production endpoints
import api from '../api/axios';
import { useAuth } from './AuthContext';

const DriveContext = createContext();

export const DriveProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Core drive states
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [sharedLinks, setSharedLinks] = useState([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(104857600); // Default 100MB
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [uploadState, setUploadState] = useState(null); // { name, progress, status, error }

  // @desc    Fetch all user drive data from the MERN backend API endpoints
  // Note: All 'api' instances automatically inherit 'import.meta.env.VITE_API_BASE_URL'
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

      // 4. Get shared links
      const sharedRes = await api.get('/files/shared-links');
      if (sharedRes.data.success) {
        setSharedLinks(sharedRes.data.files || []);
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
      setSharedLinks([]);
      setStorageUsed(0);
    }
  }, [user]);

  // @desc    Upload file via Axios with real-time progress calculations and instant state synchronization
  // Uses Vite's production environment base URL for complete deployment portability.
  const uploadFile = async (file, relativePath = '') => {
    setUploadState({ name: relativePath || file.name, progress: 0, status: 'uploading', error: null });
    const formData = new FormData();
    formData.append('file', file);
    if (relativePath) {
      formData.append('relativePath', relativePath);
    }

    // Retrieve the authorization token dynamically from local storage
    const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('user') || '{}')?.token;

    try {
      // Direct axios call targeting the Vite environment variable VITE_API_BASE_URL to avoid hardcoded localhost
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/files/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadState((prev) => prev ? { ...prev, progress: percent } : null);
          }
        }
      );

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
    const previousSharedLinks = [...sharedLinks];
    const previousStorageUsed = storageUsed;

    const fileToDelete = files.find((f) => f._id === fileId);
    if (!fileToDelete) return { success: false, message: 'File not found' };

    const isPermanent = fileToDelete.isDeleted === true;

    // 2. OPTIMISTIC UPDATE: instantly alter local state arrays before API call completes
    setSharedLinks((prev) => prev.filter((f) => f._id !== fileId));
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
      setSharedLinks(previousSharedLinks);
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
    const previousSharedLinks = [...sharedLinks];
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

    if (fileToRestore && fileToRestore.isShared) {
      const owner = {
        name: user?.name || 'Me',
        email: user?.email || '',
        avatar: user?.avatar || null
      };
      const restoredLink = {
        _id: fileToRestore._id,
        fileName: fileToRestore.fileName,
        size: fileToRestore.size,
        type: fileToRestore.type,
        fileUrl: fileToRestore.fileUrl,
        shareId: fileToRestore.shareId,
        sharedAt: fileToRestore.sharedAt || new Date(),
        owner
      };
      setSharedLinks((prev) => {
        if (prev.some(link => link._id === fileId)) return prev;
        return [restoredLink, ...prev];
      });
    }

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
      setSharedLinks(previousSharedLinks);
      setStorageUsed(previousStorageUsed);
      return { success: false, message: error.response?.data?.message || 'Restoration failed' };
    }
  };

  // @desc    Share a file by generating a unique public link via the backend API
  // Updates local state instantly so the shared badge appears without a page refresh
  const shareFileById = async (fileId) => {
    try {
      // Call the share endpoint on the backend
      const response = await api.post(`/files/${fileId}/share`);
      if (response.data.success) {
        const { shareId, shareUrl, file: updatedFile } = response.data;

        // Instantly update the file's isShared flag in all local state arrays
        // so the shared badge appears in real-time across all views
        const updateSharedFlag = (f) =>
          f._id === fileId ? { ...f, ...updatedFile, isShared: true, shareId } : f;

        setFiles((prev) => prev.map(updateSharedFlag));
        setRecentFiles((prev) => prev.map(updateSharedFlag));

        // Construct a client-side owner representation for the newly shared link item
        const owner = {
          name: user?.name || 'Me',
          email: user?.email || '',
          avatar: user?.avatar || null
        };

        const newSharedLink = {
          _id: updatedFile._id,
          fileName: updatedFile.fileName,
          size: updatedFile.size,
          type: updatedFile.type,
          fileUrl: updatedFile.fileUrl,
          shareId: shareId,
          sharedAt: updatedFile.sharedAt || new Date(),
          owner
        };

        setSharedLinks((prev) => {
          // Prevent duplicates in state
          if (prev.some(link => link._id === fileId)) return prev;
          return [newSharedLink, ...prev];
        });

        return { success: true, shareUrl, shareId };
      }
      return { success: false, message: 'Failed to generate share link' };
    } catch (error) {
      console.error('File share failed:', error);
      const message = error.response?.data?.message || 'Failed to share file';
      return { success: false, message };
    }
  };

  // @desc    Unshare a file (remove shared link) and update states instantly
  const unshareFileById = async (fileId) => {
    const previousSharedLinks = [...sharedLinks];
    const previousFiles = [...files];
    const previousRecent = [...recentFiles];

    // Optimistic UI updates
    setSharedLinks((prev) => prev.filter((f) => f._id !== fileId));

    const updateUnsharedFlag = (f) =>
      f._id === fileId ? { ...f, isShared: false, shareId: null, sharedAt: null } : f;

    setFiles((prev) => prev.map(updateUnsharedFlag));
    setRecentFiles((prev) => prev.map(updateUnsharedFlag));

    try {
      const response = await api.put(`/files/${fileId}/unshare`);
      if (response.data.success) {
        return { success: true };
      } else {
        throw new Error('Unsharing API call returned success = false');
      }
    } catch (error) {
      console.error('Optimistic UI rollback triggered for unsharing:', error);
      setSharedLinks(previousSharedLinks);
      setFiles(previousFiles);
      setRecentFiles(previousRecent);
      return { success: false, message: error.response?.data?.message || 'Failed to remove share' };
    }
  };

  return (
    <DriveContext.Provider value={{ 
      files, folders, recentFiles, sharedLinks, storageUsed, storageLimit, loadingDrive, uploadState,
      fetchDriveData, uploadFile, createFolder, deleteFileById, restoreFileById, shareFileById, unshareFileById
    }}>
      {children}
    </DriveContext.Provider>
  );
};

export const useDrive = () => useContext(DriveContext);
