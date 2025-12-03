import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { getPapers, downloadPaper, getInsights, generateInsights, getChatHistory, sendChatMessage, clearChatHistory } from '../../services/api';
import { SUBJECTS, EXAM_TYPES } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import Pagination from '../ui/Pagination';
import { Library as LibraryIcon, Search, Download, Brain, Grid3x3, List, SlidersHorizontal, FileText, Calendar, BookOpen } from 'lucide-react';
import './Library.css';

const Library = () => {
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [showFilters, setShowFilters] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [selectedExamTypes, setSelectedExamTypes] = useState([]);
    const [yearRange, setYearRange] = useState({ min: 2020, max: new Date().getFullYear() });
    const [selectedSemesters, setSelectedSemesters] = useState([]);
    const [sortBy, setSortBy] = useState('uploadedAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modal state
    const [selectedPaper, setSelectedPaper] = useState(null);
    const [paperInsights, setPaperInsights] = useState(null);
    const [insightsLoading, setInsightsLoading] = useState(false);

    // Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatMessagesEndRef = useRef(null);

    const { success, error } = useToast();

    useEffect(() => {
        fetchPapers();
    }, [searchTerm, selectedSubjects, selectedExamTypes, yearRange, selectedSemesters, sortBy, sortOrder, currentPage, itemsPerPage]);

    const fetchPapers = async () => {
        setLoading(true);
        try {
            const params = {
                search: searchTerm || undefined,
                subjects: selectedSubjects.length > 0 ? selectedSubjects : undefined,
                examTypes: selectedExamTypes.length > 0 ? selectedExamTypes : undefined,
                yearMin: yearRange.min,
                yearMax: yearRange.max,
                semesters: selectedSemesters.length > 0 ? selectedSemesters : undefined,
                sortBy,
                sortOrder,
                page: currentPage,
                limit: itemsPerPage,
            };

            const data = await getPapers(params);

            // Handle both array and paginated response
            if (Array.isArray(data)) {
                setPapers(data);
                setTotalItems(data.length);
                setTotalPages(1);
            } else {
                setPapers(data.papers || []);
                if (data.pagination) {
                    setTotalPages(data.pagination.pages);
                    setTotalItems(data.pagination.total);
                } else {
                    setTotalItems(data.papers?.length || 0);
                    setTotalPages(1);
                }
            }
        } catch (err) {
            error('Failed to fetch papers');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (paper) => {
        try {
            const blob = await downloadPaper(paper._id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${paper.subject}_${paper.examType || 'SEE'}_${paper.year}_Sem${paper.semester}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            success('Paper downloaded successfully!');
        } catch (err) {
            error('Failed to download paper');
        }
    };

    const handleViewInsights = async (paper) => {
        setSelectedPaper(paper);
        setInsightsLoading(true);
        setPaperInsights(null);
        setChatMessages([]);

        try {
            // Load both insights and chat history
            const [insightsData, chatData] = await Promise.all([
                getInsights(paper.subject).catch(() => null),
                getChatHistory(paper._id).catch(() => ({ messages: [] }))
            ]);

            setPaperInsights(insightsData);
            setChatMessages(chatData.messages || []);
        } catch (err) {
            setPaperInsights(null);
            setChatMessages([]);
        } finally {
            setInsightsLoading(false);
        }
    };

    const handleGenerateInsights = async () => {
        if (!selectedPaper) return;

        setInsightsLoading(true);
        try {
            const data = await generateInsights(selectedPaper.subject);
            setPaperInsights(data.insight);
            success('Insights generated successfully!');
        } catch (err) {
            error('Failed to generate insights');
        } finally {
            setInsightsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !selectedPaper) return;

        setChatLoading(true);
        try {
            const data = await sendChatMessage(selectedPaper._id, chatInput);
            setChatMessages(prev => [...prev, data.userMessage, data.assistantMessage]);
            setChatInput('');
            // Scroll to bottom
            setTimeout(() => chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {
            error('Failed to send message');
        } finally {
            setChatLoading(false);
        }
    };

    const handleClearChat = async () => {
        if (!selectedPaper || !window.confirm('Clear all chat history for this paper?')) return;

        try {
            await clearChatHistory(selectedPaper._id);
            setChatMessages([]);
            success('Chat history cleared');
        } catch (err) {
            error('Failed to clear chat');
        }
    };

    const toggleSubject = (subject) => {
        setSelectedSubjects(prev =>
            prev.includes(subject)
                ? prev.filter(s => s !== subject)
                : [...prev, subject]
        );
        setCurrentPage(1);
    };

    const toggleSemester = (semester) => {
        setSelectedSemesters(prev =>
            prev.includes(semester)
                ? prev.filter(s => s !== semester)
                : [...prev, semester]
        );
        setCurrentPage(1);
    };

    const toggleExamType = (examType) => {
        setSelectedExamTypes(prev =>
            prev.includes(examType)
                ? prev.filter(e => e !== examType)
                : [...prev, examType]
        );
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedSubjects([]);
        setSelectedExamTypes([]);
        setYearRange({ min: 2020, max: new Date().getFullYear() });
        setSelectedSemesters([]);
        setCurrentPage(1);
    };

    return (
        <div className="library-page">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <LibraryIcon size={40} />
                    </div>
                    <div>
                        <h1 className="page-title">College Library</h1>
                        <p className="page-subtitle">
                            Your centralized exam preparation resource - Browse, download, and analyze question papers
                        </p>
                    </div>
                </div>
            </div>

            <Card className="library-controls">
                <div className="controls-row">
                    <div className="search-container">
                        <Search size={20} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by subject, year, or semester..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="control-buttons">
                        <button
                            className="filter-toggle-btn"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal size={20} />
                            <span>Filters</span>
                        </button>

                        <div className="view-toggle">
                            <button
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid3x3 size={20} />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                            >
                                <List size={20} />
                            </button>
                        </div>

                        <select
                            className="sort-select"
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split('-');
                                setSortBy(field);
                                setSortOrder(order);
                            }}
                        >
                            <option value="uploadedAt-desc">Newest First</option>
                            <option value="uploadedAt-asc">Oldest First</option>
                            <option value="subject-asc">Subject A-Z</option>
                            <option value="subject-desc">Subject Z-A</option>
                            <option value="year-desc">Year (High-Low)</option>
                            <option value="year-asc">Year (Low-High)</option>
                        </select>
                    </div>
                </div>
            </Card>

            <div className="library-content">
                {showFilters && (
                    <aside className="filter-panel">
                        <Card>
                            <div className="filter-header">
                                <h3 className="filter-title">Filters</h3>
                                <button className="clear-filters-btn" onClick={clearFilters}>
                                    Clear All
                                </button>
                            </div>

                            <div className="filter-section">
                                <h4 className="filter-section-title">Subjects</h4>
                                <div className="filter-options">
                                    {SUBJECTS.map((subject) => (
                                        <label key={subject} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={selectedSubjects.includes(subject)}
                                                onChange={() => toggleSubject(subject)}
                                            />
                                            <span>{subject}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-section">
                                <h4 className="filter-section-title">Year Range</h4>
                                <div className="year-range">
                                    <input
                                        type="number"
                                        className="year-input"
                                        value={yearRange.min}
                                        onChange={(e) => setYearRange({ ...yearRange, min: parseInt(e.target.value) })}
                                        min="2000"
                                        max={yearRange.max}
                                    />
                                    <span>to</span>
                                    <input
                                        type="number"
                                        className="year-input"
                                        value={yearRange.max}
                                        onChange={(e) => setYearRange({ ...yearRange, max: parseInt(e.target.value) })}
                                        min={yearRange.min}
                                        max={new Date().getFullYear()}
                                    />
                                </div>
                            </div>

                            <div className="filter-section">
                                <h4 className="filter-section-title">Exam Type</h4>
                                <div className="filter-options">
                                    {EXAM_TYPES.map((examType) => (
                                        <label key={examType} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={selectedExamTypes.includes(examType)}
                                                onChange={() => toggleExamType(examType)}
                                            />
                                            <span>{examType}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-section">
                                <h4 className="filter-section-title">Semesters</h4>
                                <div className="filter-options semester-grid">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                        <label key={sem} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={selectedSemesters.includes(sem)}
                                                onChange={() => toggleSemester(sem)}
                                            />
                                            <span>Sem {sem}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </aside>
                )}

                <main className="papers-container">
                    {loading ? (
                        <LoadingSpinner size="large" text="Loading papers..." />
                    ) : papers.length > 0 ? (
                        <>
                            <div className="results-info">
                                <p className="results-count">
                                    Showing {papers.length} of {totalItems} papers
                                </p>
                            </div>

                            <div className={`papers-${viewMode}`}>
                                {papers.map((paper) => (
                                    <Card key={paper._id} className={`paper-card-${viewMode}`} hover>
                                        <div className="paper-icon-large">
                                            <FileText size={viewMode === 'grid' ? 40 : 32} />
                                        </div>
                                        <div className="paper-details">
                                            <h3 className="paper-subject">{paper.subject}</h3>
                                            <div className="paper-meta-row">
                                                <div className="meta-badge exam-type-badge">
                                                    <span>{paper.examType || 'SEE'}</span>
                                                </div>
                                                <div className="meta-badge">
                                                    <Calendar size={14} />
                                                    <span>{paper.year}</span>
                                                </div>
                                                <div className="meta-badge">
                                                    <BookOpen size={14} />
                                                    <span>Sem {paper.semester}</span>
                                                </div>
                                            </div>
                                            <p className="paper-upload-date">
                                                Uploaded {formatDate(paper.uploadedAt)}
                                            </p>
                                        </div>
                                        <div className="paper-actions">
                                            <Button
                                                variant="primary"
                                                size="small"
                                                icon={<Download size={16} />}
                                                onClick={() => handleDownload(paper)}
                                            >
                                                Download
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="small"
                                                icon={<Brain size={16} />}
                                                onClick={() => handleViewInsights(paper)}
                                            >
                                                Insights
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    itemsPerPage={itemsPerPage}
                                    onItemsPerPageChange={(value) => {
                                        setItemsPerPage(value);
                                        setCurrentPage(1);
                                    }}
                                />
                            )}
                        </>
                    ) : (
                        <Card className="empty-state">
                            <LibraryIcon size={64} className="empty-icon" />
                            <h3 className="empty-title">No Papers Found</h3>
                            <p className="empty-text">
                                {searchTerm || selectedSubjects.length > 0 || selectedSemesters.length > 0
                                    ? 'Try adjusting your filters or search terms'
                                    : 'Upload some question papers to get started'}
                            </p>
                            <Button variant="primary" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        </Card>
                    )}
                </main>
            </div>

            {/* Insights Modal */}
            {selectedPaper && (
                <div className="modal-overlay" onClick={() => setSelectedPaper(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedPaper.subject} - {selectedPaper.examType || 'SEE'} - Insights</h2>
                            <button className="modal-close" onClick={() => setSelectedPaper(null)}>
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            {insightsLoading ? (
                                <LoadingSpinner text="Loading insights..." />
                            ) : paperInsights ? (
                                <div className="insights-content">
                                    {paperInsights.repeatedQuestions && paperInsights.repeatedQuestions.length > 0 && (
                                        <div className="insight-section">
                                            <h3>Repeated Questions</h3>
                                            <ul>
                                                {paperInsights.repeatedQuestions.map((q, i) => (
                                                    <li key={i}>{q.question} (Frequency: {q.frequency})</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {paperInsights.importantTopics && paperInsights.importantTopics.length > 0 && (
                                        <div className="insight-section">
                                            <h3>Important Topics</h3>
                                            <div className="topics-tags">
                                                {paperInsights.importantTopics.map((topic, i) => (
                                                    <span key={i} className="topic-tag">{topic}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="no-insights">
                                    <Brain size={48} />
                                    <p>No insights available for this subject yet.</p>
                                    <Button variant="primary" onClick={handleGenerateInsights}>
                                        Generate Insights
                                    </Button>
                                </div>
                            )}

                            {/* Chat Section */}
                            <div className="chat-section">
                                <div className="chat-header">
                                    <h3>💬 Ask AI About This Paper</h3>
                                    {chatMessages.length > 0 && (
                                        <button className="clear-chat-btn" onClick={handleClearChat}>
                                            Clear Chat
                                        </button>
                                    )}
                                </div>

                                <div className="chat-messages">
                                    {chatMessages.length === 0 ? (
                                        <div className="no-messages">
                                            <p>Start a conversation about this paper...</p>
                                            <p className="suggestions">Try asking:</p>
                                            <ul>
                                                <li>"Explain the important topics"</li>
                                                <li>"Generate practice questions"</li>
                                                <li>"What should I focus on?"</li>
                                            </ul>
                                        </div>
                                    ) : (
                                        <>
                                            {chatMessages.map((msg, idx) => (
                                                <div key={idx} className={`chat-message ${msg.role}`}>
                                                    <div className="message-content">{msg.content}</div>
                                                    <div className="message-time">
                                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={chatMessagesEndRef} />
                                        </>
                                    )}
                                </div>

                                <div className="chat-input-container">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !chatLoading && handleSendMessage()}
                                        placeholder="Ask a question about this paper..."
                                        disabled={chatLoading}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={chatLoading || !chatInput.trim()}
                                        variant="primary"
                                    >
                                        {chatLoading ? 'Sending...' : 'Send'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Library;
