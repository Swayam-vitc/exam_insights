import { NavLink } from 'react-router-dom';
import { Library, Upload, Brain, FileText } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    const navItems = [
        { path: '/library', icon: Library, label: 'Library' },
        { path: '/upload', icon: Upload, label: 'Upload Papers' },
        { path: '/insights', icon: Brain, label: 'Insights' },
        { path: '/papers', icon: FileText, label: 'Manage Papers' },
    ];

    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
