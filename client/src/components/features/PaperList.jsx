import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { getPapers } from '../../services/api';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import { FileText, Search, Calendar, BookOpen } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import './PaperList.css';

const PaperList = () => {
    const [papers, setPapers] = useState([]);
    const [filteredPapers, setFilteredPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('All');
    const { stats } = useApp();
    const { error } = useToast();

    useEffect(() => {
        fetchPapers();
    }, []);

    useEffect(() => {
        filterPapers();
    }, [searchTerm, selectedSubject, papers]);

    const fetchPapers = async () => {
        setLoading(true);
        try {
            const data = await getPapers();
            setPapers(data);
        } catch (err) {
            error('Failed to fetch papers');
        } finally {
            setLoading(false);
        }
    };

    const filterPapers = () => {
        let filtered = papers;

        if (selectedSubject !== 'All') {
            filtered = filtered.filter(p => p.subject === selectedSubject);
        }

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.year.toString().includes(searchTerm)
            );
        }

        setFilteredPapers(filtered);
    };

    if (loading) {
        return <LoadingSpinner size="large" text="Loading papers..." />;
    }

    return (
        <div className="paper-list">
            <div className="page-header">
                <h1 className="page-title">Manage Papers</h1>
                <p className="page-subtitle">
                    View and manage all uploaded question papers
                </p>
            </div>

            <Card className="filters-card">
                <div className="filters-content">
                    <div className="search-box">
                        <Search size={20} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by subject or year..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Filter by Subject:</label>
                        <select
                            className="filter-select"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                            <option value="All">All Subjects</option>
                            {stats.subjects.map((subject) => (
                                <option key={subject} value={subject}>
                                    {subject}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {filteredPapers.length > 0 ? (
                <div className="papers-grid">
                    {filteredPapers.map((paper) => (
                        <Card key={paper._id} className="paper-card" hover>
                            <div className="paper-icon">
                                <FileText size={32} />
                            </div>
                            <div className="paper-info">
                                <h3 className="paper-subject">{paper.subject}</h3>
                                <div className="paper-meta">
                                    <div className="meta-item">
                                        <Calendar size={16} />
                                        <span>Year: {paper.year}</span>
                                    </div>
                                    <div className="meta-item">
                                        <BookOpen size={16} />
                                        <span>Sem: {paper.semester}</span>
                                    </div>
                                </div>
                                <div className="paper-date">
                                    Uploaded: {formatDate(paper.uploadedAt)}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="empty-state">
                    <FileText size={64} className="empty-icon" />
                    <h3 className="empty-title">No Papers Found</h3>
                    <p className="empty-text">
                        {searchTerm || selectedSubject !== 'All'
                            ? 'Try adjusting your filters'
                            : 'Upload some question papers to get started'}
                    </p>
                </Card>
            )}
        </div>
    );
};

export default PaperList;
