import './Card.css';

const Card = ({ children, title, subtitle, className = '', hover = false }) => {
    return (
        <div className={`card ${hover ? 'card-hover' : ''} ${className}`}>
            {(title || subtitle) && (
                <div className="card-header">
                    {title && <h3 className="card-title">{title}</h3>}
                    {subtitle && <p className="card-subtitle">{subtitle}</p>}
                </div>
            )}
            <div className="card-body">
                {children}
            </div>
        </div>
    );
};

export default Card;
