import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { generateInsights } from '../../services/api';
import { SUBJECTS } from '../../utils/constants';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Brain, TrendingUp, BookOpen, Target } from 'lucide-react';
import './InsightsView.css';

const InsightsView = () => {
    const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);
    const { success, error } = useToast();

    const handleGenerateInsights = async () => {
        setLoading(true);
        try {
            const data = await generateInsights(selectedSubject);
            setInsights(data.insight);
            success('Insights generated successfully!');
        } catch (err) {
            error(err.response?.data?.message || 'Failed to generate insights');
            setInsights(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="insights-view">
            <div className="page-header">
                <h1 className="page-title">AI-Powered Insights</h1>
                <p className="page-subtitle">
                    Generate intelligent insights from uploaded question papers
                </p>
            </div>

            <Card className="insights-control">
                <div className="control-content">
                    <div className="control-group">
                        <label className="control-label">Select Subject</label>
                        <select
                            className="control-select"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            disabled={loading}
                        >
                            {SUBJECTS.map((subject) => (
                                <option key={subject} value={subject}>
                                    {subject}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button
                        variant="primary"
                        size="large"
                        onClick={handleGenerateInsights}
                        loading={loading}
                        icon={<Brain size={20} />}
                    >
                        {loading ? 'Analyzing...' : 'Generate Insights'}
                    </Button>
                </div>
            </Card>

            {loading && (
                <div className="loading-container">
                    <LoadingSpinner size="large" text="Analyzing papers with Gemini AI..." />
                </div>
            )}

            {insights && !loading && (
                <div className="insights-results">
                    <Card className="insight-card" title="Repeated Questions" hover>
                        <div className="insight-icon-header">
                            <div className="insight-icon insight-icon-primary">
                                <TrendingUp size={24} />
                            </div>
                            <p className="insight-description">
                                Questions that appear frequently across multiple papers
                            </p>
                        </div>
                        <div className="repeated-questions-list">
                            {insights.repeatedQuestions && insights.repeatedQuestions.length > 0 ? (
                                insights.repeatedQuestions.map((item, index) => (
                                    <div key={index} className="question-item">
                                        <div className="question-text">{item.question}</div>
                                        <div className="frequency-badge">
                                            Frequency: {item.frequency}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">No repeated questions found</p>
                            )}
                        </div>
                    </Card>

                    <Card className="insight-card" title="Unit Weightage" hover>
                        <div className="insight-icon-header">
                            <div className="insight-icon insight-icon-secondary">
                                <Target size={24} />
                            </div>
                            <p className="insight-description">
                                Distribution of questions across different units
                            </p>
                        </div>
                        <div className="unit-weightage-list">
                            {insights.unitWeightage && insights.unitWeightage.length > 0 ? (
                                insights.unitWeightage.map((item, index) => (
                                    <div key={index} className="weightage-item">
                                        <div className="weightage-label">{item.unit}</div>
                                        <div className="weightage-bar">
                                            <div
                                                className="weightage-fill"
                                                style={{
                                                    width: item.weightage.includes('%')
                                                        ? item.weightage
                                                        : '50%',
                                                }}
                                            >
                                                <span className="weightage-value">{item.weightage}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">No unit weightage data available</p>
                            )}
                        </div>
                    </Card>

                    <Card className="insight-card" title="Important Topics" hover>
                        <div className="insight-icon-header">
                            <div className="insight-icon insight-icon-accent">
                                <BookOpen size={24} />
                            </div>
                            <p className="insight-description">
                                Key topics to focus on for exam preparation
                            </p>
                        </div>
                        <div className="topics-grid">
                            {insights.importantTopics && insights.importantTopics.length > 0 ? (
                                insights.importantTopics.map((topic, index) => (
                                    <div key={index} className="topic-tag">
                                        {topic}
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">No important topics identified</p>
                            )}
                        </div>
                    </Card>

                    <Card className="insight-card" title="Frequently Tested Concepts" hover>
                        <div className="insight-icon-header">
                            <div className="insight-icon insight-icon-warning">
                                <Brain size={24} />
                            </div>
                            <p className="insight-description">
                                Concepts that are commonly tested in exams
                            </p>
                        </div>
                        <div className="concepts-list">
                            {insights.frequentlyTestedConcepts && insights.frequentlyTestedConcepts.length > 0 ? (
                                insights.frequentlyTestedConcepts.map((concept, index) => (
                                    <div key={index} className="concept-item">
                                        <span className="concept-bullet">•</span>
                                        <span className="concept-text">{concept}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">No frequently tested concepts found</p>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {!insights && !loading && (
                <Card className="empty-state">
                    <Brain size={64} className="empty-icon" />
                    <h3 className="empty-title">No Insights Yet</h3>
                    <p className="empty-text">
                        Select a subject and click "Generate Insights" to analyze question papers
                    </p>
                </Card>
            )}
        </div>
    );
};

export default InsightsView;
