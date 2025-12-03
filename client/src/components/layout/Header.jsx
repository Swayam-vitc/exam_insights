import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import './Header.css';

const Header = () => {
    return (
        <header className="header">
            <div className="header-content">
                <Link to="/" className="header-logo">
                    <GraduationCap size={32} />
                    <span className="header-title">Student Exam Insights</span>
                </Link>

                <div className="header-actions">
                    <div className="header-badge">
                        <span className="badge-dot"></span>
                        <span>AI Powered</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
