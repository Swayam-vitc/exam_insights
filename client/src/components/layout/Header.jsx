import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

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

                    {user && (
                        <div className="user-menu">
                            <button
                                className="user-menu-trigger"
                                onClick={() => setShowDropdown(!showDropdown)}
                            >
                                <div className="user-avatar">
                                    <User size={18} />
                                </div>
                                <span className="user-name">{user.name}</span>
                                <ChevronDown size={16} className={showDropdown ? 'rotate' : ''} />
                            </button>

                            {showDropdown && (
                                <div className="user-dropdown">
                                    <div className="dropdown-header">
                                        <p className="dropdown-name">{user.name}</p>
                                        <p className="dropdown-email">{user.email}</p>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item logout-btn" onClick={logout}>
                                        <LogOut size={18} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

