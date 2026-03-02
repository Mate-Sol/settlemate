import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';

const FileUploadField = ({ label, onUpload, category, existingFile }) => {
    const [file, setFile] = useState(existingFile || null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (selectedFile.size > MAX_SIZE) {
            setError('File size exceeds 5MB limit');
            return;
        }

        setError('');
        setIsUploading(true);

        try {
            const base64 = await convertToBase64(selectedFile);
            const fileData = {
                category,
                name: selectedFile.name,
                fileContent: base64,
                fileType: selectedFile.type,
                fileSize: selectedFile.size
            };

            setFile(selectedFile.name);
            onUpload(fileData);
        } catch (err) {
            console.error('File conversion error:', err);
            setError('Failed to process file');
        } finally {
            setIsUploading(false);
        }
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const clearFile = () => {
        setFile(null);
        onUpload(null);
    };

    return (
        <div className="space-y-2">
            <label className="input-label flex justify-between items-center">
                {label}
                {file && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Ready</span>}
            </label>

            <div className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${file ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-brand-purple/50 bg-gray-50'
                }`}>
                {file ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-sm">
                                <FileText className="w-5 h-5 text-brand-purple" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{file}</p>
                                <p className="text-xs text-gray-500">Document attached</p>
                            </div>
                        </div>
                        <button
                            onClick={clearFile}
                            className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center py-2">
                        <Upload className={`w-8 h-8 mb-2 ${isUploading ? 'text-brand-purple animate-bounce' : 'text-gray-400'}`} />
                        <p className="text-sm text-gray-600 font-medium">Click to upload or drag & drop</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG or PNG (Max. 5MB)</p>
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </label>
                )}
            </div>
            {error && (
                <p className="text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="w-3 h-3" /> {error}
                </p>
            )}
        </div>
    );
};

export default FileUploadField;
