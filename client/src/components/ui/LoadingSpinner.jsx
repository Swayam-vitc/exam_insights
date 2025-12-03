import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = '' }) => {
    return (
        <div className="loading-spinner-container">
            <div className={`loading-spinner loading-spinner-${size}`}>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
            </div>
            {text && <p className="loading-text">{text}</p>}
        </div>
    );
};

export default LoadingSpinner;
