import './Button.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    icon,
    onClick,
    type = 'button',
    ...props
}) => {
    return (
        <button
            className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''}`}
            onClick={onClick}
            disabled={disabled || loading}
            type={type}
            {...props}
        >
            {loading ? (
                <span className="btn-spinner"></span>
            ) : icon ? (
                <span className="btn-icon">{icon}</span>
            ) : null}
            <span className="btn-text">{children}</span>
        </button>
    );
};

export default Button;
