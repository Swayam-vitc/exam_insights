import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import Library from './components/features/Library';
import UploadPaper from './components/features/UploadPaper';
import InsightsView from './components/features/InsightsView';
import PaperList from './components/features/PaperList';
import './styles/index.css';

function App() {
    return (
        <Router>
            <AppProvider>
                <ToastProvider>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Navigate to="/library" replace />} />
                            <Route path="/library" element={<Library />} />
                            <Route path="/upload" element={<UploadPaper />} />
                            <Route path="/insights" element={<InsightsView />} />
                            <Route path="/papers" element={<PaperList />} />
                        </Routes>
                    </Layout>
                </ToastProvider>
            </AppProvider>
        </Router>
    );
}

export default App;
