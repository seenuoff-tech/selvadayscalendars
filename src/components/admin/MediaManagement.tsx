import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, UploadCloud, Trash2, Copy, CheckCircle, Loader2, AlertCircle, CheckSquare, Square } from 'lucide-react';

interface MediaItem {
  name: string;
  url: string;
}

export const MediaManagement: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      if (data.success) {
        setMedia(data.media);
      } else {
        setError(data.message || 'Failed to fetch media');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });

        const res = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, base64 })
        });
        
        if (!res.ok) {
          throw new Error('Upload failed');
        }
      }
      
      await fetchMedia();
    } catch (err) {
      setError('Error uploading one or more files');
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = ''; // Reset input
      }
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      const res = await fetch(`/api/media/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedItems(prev => {
          const next = new Set(prev);
          next.delete(filename);
          return next;
        });
        await fetchMedia();
      } else {
        setError('Failed to delete image');
      }
    } catch (err) {
      setError('Error deleting image');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedItems.size} selected images?`)) return;

    try {
      const res = await fetch('/api/media/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames: Array.from(selectedItems) })
      });
      
      if (res.ok) {
        setSelectedItems(new Set());
        await fetchMedia();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to bulk delete images');
      }
    } catch (err) {
      setError('Error during bulk deletion');
    }
  };

  const toggleSelect = (filename: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === media.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(media.map(m => m.name)));
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#0C8D99]" />
            Media Library
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload and manage images. Copy the URL to use in products.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {selectedItems.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedItems.size})</span>
            </button>
          )}

          <div className="relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <button
              disabled={isUploading}
              className="px-5 py-2.5 bg-[#0C8D99] hover:bg-[#0a7b85] text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-70 shadow-sm"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              <span>{isUploading ? 'Uploading...' : 'Upload Images'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="p-6">
        {/* Bulk Selection Header */}
        {!isLoading && media.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              {selectedItems.size === media.length ? (
                <CheckSquare className="w-5 h-5 text-[#0C8D99]" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              {selectedItems.size === media.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#0C8D99] animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading media...</p>
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No images uploaded yet.</p>
            <p className="text-sm text-slate-400 mt-1">Click "Upload Images" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {media.map((item) => {
              const isSelected = selectedItems.has(item.name);
              return (
                <div 
                  key={item.name} 
                  className={`group border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative cursor-pointer ${
                    isSelected ? 'border-[#0C8D99] ring-2 ring-[#0C8D99]/20' : 'border-slate-200 bg-white'
                  }`}
                  onClick={() => toggleSelect(item.name)}
                >
                  <div className="absolute top-2 left-2 z-10">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-[#0C8D99] bg-white rounded-sm" />
                    ) : (
                      <Square className="w-5 h-5 text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <div className="aspect-square bg-slate-100 flex items-center justify-center relative">
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(item.url); }}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        title="Copy URL"
                      >
                        {copiedUrl === item.url ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.name); }}
                        className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                        title="Delete Image"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 border-t border-slate-100 bg-white">
                    <p className="text-xs text-slate-600 truncate font-medium" title={item.name}>
                      {item.name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
