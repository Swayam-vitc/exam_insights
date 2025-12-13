import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { GraduationCap, Mail, Lock, User, AlertCircle } from 'lucide-react';
import './Login.css';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        const result = await signup(name, email, password);
        setLoading(false);

        if (result.success) {
            navigate('/library');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            <div className="auth-container">
                <div className="app-welcome-header">
                    <h1 className="app-welcome-title">STUDENT EXAM INSIGHTS</h1>
                </div>

                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-icon">
                            <GraduationCap size={48} />
                        </div>
                        <h1 className="auth-title">Create Account</h1>
                        <p className="auth-subtitle">Join us to unlock powerful exam insights</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="name" className="form-label">
                                <User size={18} />
                                <span>Full Name</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                className="form-input"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                                autoComplete="name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                <Mail size={18} />
                                <span>Email Address</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                <Lock size={18} />
                                <span>Password</span>
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">
                                <Lock size={18} />
                                <span>Confirm Password</span>
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="form-input"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                autoComplete="new-password"
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="large"
                            disabled={loading}
                            className="auth-submit-btn"
                        >
                            {loading ? 'Creating account...' : 'Sign Up'}
                        </Button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="auth-link">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
