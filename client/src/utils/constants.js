export const SUBJECTS = [
    'DSA Basics',
    'Java Basics',
    'SED Basics',
    'Physics',
    'Chemistry',
    'Mathematics',
    'CAD',
    'ESC',
    'PLC',
    'ETC',
    'English',
    'Kannada',
    'Signals and Systems',
];

export const EXAM_TYPES = ['IA1', 'IA2', 'SEE'];

export const ROUTES = {
    HOME: '/',
    UPLOAD: '/upload',
    INSIGHTS: '/insights',
    PAPERS: '/papers',
};

export const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning',
};

export const FILE_UPLOAD_CONFIG = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPTED_TYPES: {
        'application/pdf': ['.pdf'],
    },
};
