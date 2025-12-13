import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/features/Dashboard';
import Library from './components/features/Library';
import UploadPaper from './components/features/UploadPaper';
import InsightsView from './components/features/InsightsView';
import PaperList from './components/features/PaperList';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './styles/index.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppProvider>
                    <ToastProvider>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />

                            {/* Protected routes */}
                            <Route path="/" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Dashboard />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/library" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Library />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/upload" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <UploadPaper />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/insights" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <InsightsView />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/papers" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <PaperList />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                        </Routes>
                    </ToastProvider>
                </AppProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
