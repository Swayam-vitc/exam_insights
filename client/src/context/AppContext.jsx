import { createContext, useContext, useState, useEffect } from 'react';
import { getPapers } from '../services/api';

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalPapers: 0,
        subjects: [],
    });

    const fetchPapers = async () => {
        setLoading(true);
        try {
            const data = await getPapers();
            const papersList = data.papers || data;
            setPapers(papersList);

            // Calculate stats
            const subjects = [...new Set(papersList.map(p => p.subject))];
            setStats({
                totalPapers: papersList.length,
                subjects,
            });
        } catch (error) {
            console.error('Error fetching papers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPapers();
    }, []);

    return (
        <AppContext.Provider value={{ papers, setPapers, stats, loading, fetchPapers }}>
            {children}
        </AppContext.Provider>
    );
};
