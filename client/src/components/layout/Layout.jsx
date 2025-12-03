import Header from './Header';
import Sidebar from './Sidebar';
import Toast from '../ui/Toast';
import './Layout.css';

const Layout = ({ children }) => {
    return (
        <div className="app">
            <Header />
            <div className="app-container">
                <Sidebar />
                <main className="app-main">
                    {children}
                </main>
            </div>
            <Toast />
        </div>
    );
};

export default Layout;
