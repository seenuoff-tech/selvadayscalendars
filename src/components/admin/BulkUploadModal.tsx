import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet, Download, Upload, CheckCircle2, AlertCircle,
  Loader2, RefreshCw, Layers, Eye
} from 'lucide-react';
import { parseExcelOrCsvFile, downloadSampleExcelTemplate } from '../../lib/excel';
import { BulkUploadRow } from '../../types';

interface BulkUploadModalProps {
  onSuccess: () => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ onSuccess }) => {
  const [parsedRows, setParsedRows] = useState<BulkUploadRow[]>([]);
  const [mediaLibraryImages, setMediaLibraryImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    fetch('/api/media')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.media) {
          setMediaLibraryImages(data.media.map((m: any) => m.name.toLowerCase()));
        }
      })
      .catch(err => console.error("Error fetching media library", err));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setSuccessMessage('');
    setFileName(file.name);
    setIsLoading(true);

    try {
      const rows = await parseExcelOrCsvFile(file);
      if (rows.length === 0) {
        setErrorMessage('Uploaded file contains no rows or valid product data.');
      } else {
        setParsedRows(rows);
      }
    } catch (err: any) {
      setErrorMessage('Failed to parse file. Please ensure it is a valid Excel (.xlsx) or CSV file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files));
    }
  };

  const handleCommitUpload = async () => {
    if (parsedRows.length === 0) return;

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Pre-process images into Base64 strings or Media Library URLs
      const updatedRows = await Promise.all(
        parsedRows.map(async (row) => {
          let imageUrl = row.imageUrl || '/placeholder-image.png';

          if (row.imageFilename) {
            const safeFilename = row.imageFilename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
            const lowerSafeFilename = safeFilename.toLowerCase();
            
            // Helper to get base name by stripping extensions
            const getBaseName = (name: string) => {
              // Strip up to two extensions to handle cases like .jpeg.jpeg
              let base = name.toLowerCase();
              base = base.replace(/\.[a-z0-9]+$/i, '');
              base = base.replace(/\.[a-z0-9]+$/i, '');
              return base;
            };
            
            const targetBase = getBaseName(lowerSafeFilename);

            // First check media library with fuzzy matching
            const matchedMedia = mediaLibraryImages.find(m => getBaseName(m) === targetBase);
            
            if (matchedMedia) {
              imageUrl = `/media/${matchedMedia}`;
            } else if (selectedImages.length > 0) {
              // Fallback to selected images if they still use it
              const matchedFile = selectedImages.find(
                (f) => getBaseName(f.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")) === targetBase
              );

              if (matchedFile) {
                imageUrl = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = () => resolve('/placeholder-image.png');
                  reader.readAsDataURL(matchedFile);
                });
              }
            }
          }

          return { ...row, imageUrl };
        })
      );

      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: updatedRows,
          replaceExisting,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(data.message || `Successfully imported ${parsedRows.length} products!`);
        setParsedRows([]);
        setFileName('');
        setSelectedImages([]);
        onSuccess();
      } else {
        setErrorMessage(data.message || 'Failed to import products.');
      }
    } catch (err) {
      setErrorMessage('Server connection error during import.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="bulk-upload-module" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Bulk Product Excel / CSV Import</h2>
            <p className="text-xs text-slate-500">Upload multiple products simultaneously via spreadsheet</p>
          </div>
        </div>

        {/* Download Template Button */}
        <button
          id="btn-download-sample-template"
          onClick={downloadSampleExcelTemplate}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4 text-indigo-600" />
          <span>Download Sample Excel Template</span>
        </button>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* File Drag & Drop Upload Zone */}
      <div className="grid grid-cols-1 gap-4">
        <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 rounded-2xl p-8 text-center transition-colors relative">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {fileName ? (
                <span className="text-indigo-700 font-bold">Selected: {fileName}</span>
              ) : (
                <span>Upload Excel / CSV</span>
              )}
            </div>
            <p className="text-xs text-slate-400">Step 1: Upload the data file</p>
          </div>
        </div>
      </div>

      {/* Parsed Preview Table & Strategy Options */}
      {parsedRows.length > 0 && (
        <div className="space-y-4 pt-2 animate-in fade-in duration-200">
          
          {/* Options & Action Bar */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-slate-700">
            
            <div className="space-y-2">
              <span className="block text-slate-900 font-bold">Import Strategy:</span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importStrategy"
                    checked={!replaceExisting}
                    onChange={() => setReplaceExisting(false)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Append to Existing Products</span>
                </label>

                <label className="flex items-center space-x-1.5 cursor-pointer text-red-700">
                  <input
                    type="radio"
                    name="importStrategy"
                    checked={replaceExisting}
                    onChange={() => setReplaceExisting(true)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>Replace ALL Existing Products</span>
                </label>
              </div>
            </div>

            <button
              id="btn-commit-bulk-upload"
              onClick={handleCommitUpload}
              disabled={isLoading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commit {parsedRows.length} Products Import</span>
                </>
              )}
            </button>

          </div>

          {/* Table Preview */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Parsed Products Preview ({parsedRows.length} Rows Detected)</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">S.No</th>
                    <th className="py-2 px-3">Product Name</th>
                    <th className="py-2 px-3">Image Match</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((row, idx) => {
                    const getBaseName = (name: string) => {
                      let base = name.toLowerCase();
                      base = base.replace(/\.[a-z0-9]+$/i, '');
                      base = base.replace(/\.[a-z0-9]+$/i, '');
                      return base;
                    };
                    
                    const safeFilename = row.imageFilename ? row.imageFilename.replace(/[^a-zA-Z0-9.\-_]/g, "_").toLowerCase() : '';
                    const targetBase = getBaseName(safeFilename);
                    
                    const hasImage = row.imageFilename && (
                      mediaLibraryImages.some(m => getBaseName(m) === targetBase) || 
                      selectedImages.some(f => getBaseName(f.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")) === targetBase)
                    );
                    return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500">{row.sno || idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{row.productName}</td>
                      <td className="py-2 px-3">
                        {hasImage ? (
                          <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">Found in Media Library</span>
                        ) : row.imageFilename ? (
                          <span className="text-red-500 text-xs">Missing from Media Library: {row.imageFilename}</span>
                        ) : (
                          <span className="text-slate-400 text-xs">No image req.</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{row.category || 'Calendar'}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {row.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
