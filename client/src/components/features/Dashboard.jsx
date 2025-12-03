import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { uploadPaper } from '../../services/api';
import { SUBJECTS, FILE_UPLOAD_CONFIG } from '../../utils/constants';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Upload, Brain, FileText, TrendingUp, CheckCircle } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const { stats, loading, fetchPapers } = useApp();
    const { success, error } = useToast();
    const [uploading, setUploading] = useState(false);
    const [quickUploadFile, setQuickUploadFile] = useState(null);
    const [quickFormData, setQuickFormData] = useState({
        subject: '',
        year: '',
        semester: '',
    });

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: FILE_UPLOAD_CONFIG.ACCEPTED_TYPES,
        maxSize: FILE_UPLOAD_CONFIG.MAX_SIZE,
        multiple: false,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setQuickUploadFile(acceptedFiles[0]);
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

    const handleQuickUpload = async () => {
        if (!quickUploadFile) {
            error('Please select a file to upload');
            return;
        }

        if (!quickFormData.subject || !quickFormData.year || !quickFormData.semester) {
            error('Please fill in all fields');
            return;
        }

        setUploading(true);
        const data = new FormData();
        data.append('paper', quickUploadFile);
        data.append('subject', quickFormData.subject);
        data.append('year', quickFormData.year);
        data.append('semester', quickFormData.semester);

        try {
            await uploadPaper(data);
            success('Question paper uploaded successfully!');
            setQuickUploadFile(null);
            setQuickFormData({
                subject: '',
                year: '',
                semester: '',
            });
            fetchPapers();
        } catch (err) {
            error(err.response?.data?.message || 'Failed to upload paper');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner size="large" text="Loading dashboard..." />;
    }

    const quickActions = [
        {
            title: 'Upload Papers',
            description: 'Upload new question papers for analysis',
            icon: Upload,
            link: '/upload',
            color: 'primary',
        },
        {
            title: 'Generate Insights',
            description: 'Get AI-powered insights from papers',
            icon: Brain,
            link: '/insights',
            color: 'secondary',
        },
        {
            title: 'Manage Papers',
            description: 'View and manage uploaded papers',
            icon: FileText,
            link: '/papers',
            color: 'accent',
        },
    ];

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Welcome Back!</h1>
                    <p className="dashboard-subtitle">
                        Analyze exam patterns and get AI-powered insights
                    </p>
                </div>
            </div>

            <div className="stats-grid">
                <Card className="stat-card" hover>
                    <div className="stat-icon stat-icon-primary">
                        <FileText size={24} />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Papers</p>
                        <h2 className="stat-value">{stats.totalPapers}</h2>
                    </div>
                </Card>

                <Card className="stat-card" hover>
                    <div className="stat-icon stat-icon-secondary">
                        <Brain size={24} />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Subjects</p>
                        <h2 className="stat-value">{stats.subjects.length}</h2>
                    </div>
                </Card>

                <Card className="stat-card" hover>
                    <div className="stat-icon stat-icon-accent">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Insights Ready</p>
                        <h2 className="stat-value">{stats.subjects.length}</h2>
                    </div>
                </Card>
            </div>

            {/* Quick Upload Zone */}
            <div className="quick-upload-section">
                <h2 className="section-title">Quick Upload</h2>
                <Card className="quick-upload-card">
                    <div className="quick-upload-form">
                        <div className="quick-form-fields">
                            <select
                                className="quick-select"
                                value={quickFormData.subject}
                                onChange={(e) => setQuickFormData({ ...quickFormData, subject: e.target.value })}
                                disabled={uploading}
                            >
                                {SUBJECTS.map((subject) => (
                                    <option key={subject} value={subject}>
                                        {subject}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="number"
                                className="quick-input"
                                placeholder="Year"
                                value={quickFormData.year}
                                onChange={(e) => setQuickFormData({ ...quickFormData, year: parseInt(e.target.value) })}
                                min="2000"
                                max={new Date().getFullYear()}
                                disabled={uploading}
                            />

                            <select
                                className="quick-select"
                                value={quickFormData.semester}
                                onChange={(e) => setQuickFormData({ ...quickFormData, semester: parseInt(e.target.value) })}
                                disabled={uploading}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                    <option key={sem} value={sem}>
                                        Sem {sem}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div
                            {...getRootProps()}
                            className={`quick-dropzone ${isDragActive ? 'quick-dropzone-active' : ''} ${quickUploadFile ? 'quick-dropzone-has-file' : ''}`}
                        >
                            <input {...getInputProps()} />
                            {quickUploadFile ? (
                                <div className="quick-file-preview">
                                    <CheckCircle size={32} className="file-icon-success" />
                                    <p className="file-name">{quickUploadFile.name}</p>
                                    <p className="file-size">{(quickUploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <div className="quick-dropzone-content">
                                    <Upload size={32} />
                                    <p className="quick-dropzone-text">
                                        {isDragActive ? 'Drop PDF here' : 'Drag & drop PDF or click to browse'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <Button
                            variant="primary"
                            size="large"
                            onClick={handleQuickUpload}
                            loading={uploading}
                            disabled={!quickUploadFile || uploading}
                            icon={<Upload size={20} />}
                        >
                            {uploading ? 'Uploading...' : 'Upload Now'}
                        </Button>
                    </div>
                </Card>
            </div>

            <div className="quick-actions">
                <h2 className="section-title">Quick Actions</h2>
                <div className="actions-grid">
                    {quickActions.map((action) => (
                        <Card key={action.title} className="action-card" hover>
                            <div className={`action-icon action-icon-${action.color}`}>
                                <action.icon size={32} />
                            </div>
                            <h3 className="action-title">{action.title}</h3>
                            <p className="action-description">{action.description}</p>
                            <Link to={action.link}>
                                <Button variant="primary" size="small">
                                    Get Started
                                </Button>
                            </Link>
                        </Card>
                    ))}
                </div>
            </div>

            {stats.subjects.length > 0 && (
                <div className="subjects-section">
                    <h2 className="section-title">Available Subjects</h2>
                    <div className="subjects-list">
                        {stats.subjects.map((subject) => (
                            <div key={subject} className="subject-tag">
                                {subject}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
