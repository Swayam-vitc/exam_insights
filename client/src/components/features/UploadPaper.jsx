import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { uploadPaper } from '../../services/api';
import { SUBJECTS, FILE_UPLOAD_CONFIG } from '../../utils/constants';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import './UploadPaper.css';

const UploadPaper = () => {
    const [formData, setFormData] = useState({
        subject: SUBJECTS[0],
        year: new Date().getFullYear(),
        semester: 1,
    });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { fetchPapers } = useApp();
    const { success, error } = useToast();

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: FILE_UPLOAD_CONFIG.ACCEPTED_TYPES,
        maxSize: FILE_UPLOAD_CONFIG.MAX_SIZE,
        multiple: false,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setFile(acceptedFiles[0]);
            }
        },
        onDropRejected: (fileRejections) => {
            const rejection = fileRejections[0];
            if (rejection.errors[0].code === 'file-too-large') {
                error('File is too large. Maximum size is 10MB');
            } else {
                error('Invalid file type. Please upload a PDF file');
            }
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            error('Please select a file to upload');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        const data = new FormData();
        data.append('paper', file);
        data.append('subject', formData.subject);
        data.append('year', formData.year);
        data.append('semester', formData.semester);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            await uploadPaper(data);

            clearInterval(progressInterval);
            setUploadProgress(100);

            success('Question paper uploaded successfully!');

            // Reset form
            setFile(null);
            setFormData({
                subject: SUBJECTS[0],
                year: new Date().getFullYear(),
                semester: 1,
            });

            // Refresh papers list
            fetchPapers();
        } catch (err) {
            error(err.response?.data?.message || 'Failed to upload paper');
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    return (
        <div className="upload-paper">
            <div className="page-header">
                <h1 className="page-title">Upload Question Paper</h1>
                <p className="page-subtitle">
                    Upload PDF question papers for AI-powered analysis
                </p>
            </div>

            <div className="upload-content">
                <Card className="upload-card">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Subject</label>
                            <select
                                className="form-select"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                disabled={uploading}
                            >
                                {SUBJECTS.map((subject) => (
                                    <option key={subject} value={subject}>
                                        {subject}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Year</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                    min="2000"
                                    max={new Date().getFullYear()}
                                    disabled={uploading}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Semester</label>
                                <select
                                    className="form-select"
                                    value={formData.semester}
                                    onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                                    disabled={uploading}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                        <option key={sem} value={sem}>
                                            Semester {sem}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Question Paper (PDF)</label>
                            <div
                                {...getRootProps()}
                                className={`dropzone ${isDragActive ? 'dropzone-active' : ''} ${file ? 'dropzone-has-file' : ''}`}
                            >
                                <input {...getInputProps()} />
                                {file ? (
                                    <div className="file-preview">
                                        <CheckCircle size={48} className="file-icon-success" />
                                        <p className="file-name">{file.name}</p>
                                        <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                ) : (
                                    <div className="dropzone-content">
                                        <Upload size={48} />
                                        <p className="dropzone-text">
                                            {isDragActive
                                                ? 'Drop the PDF file here'
                                                : 'Drag & drop a PDF file here, or click to select'}
                                        </p>
                                        <p className="dropzone-hint">Maximum file size: 10MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {uploadProgress > 0 && (
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        )}

                        <div className="form-actions">
                            <Button
                                type="submit"
                                variant="primary"
                                size="large"
                                loading={uploading}
                                disabled={!file || uploading}
                                icon={<FileText size={20} />}
                            >
                                {uploading ? 'Uploading...' : 'Upload Paper'}
                            </Button>
                        </div>
                    </form>
                </Card>

                <Card className="info-card">
                    <h3 className="info-title">Upload Guidelines</h3>
                    <ul className="info-list">
                        <li>Only PDF files are accepted</li>
                        <li>Maximum file size is 10MB</li>
                        <li>Ensure the PDF contains clear, readable text</li>
                        <li>Scanned images should have good quality</li>
                        <li>Multiple papers can be uploaded for the same subject</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default UploadPaper;
