// Shared Constants and Enums for Legal Front Door Application

// Request Types
export const REQUEST_TYPES = {
    CONTRACT_REVIEW: 'Contract Review',
    LEGAL_ADVICE: 'Legal Advice',
    COMPLIANCE: 'Compliance',
    IP_PATENT: 'IP/Patent',
    EMPLOYMENT: 'Employment',
    OTHER: 'Other'
};

export const REQUEST_TYPE_OPTIONS = [
    REQUEST_TYPES.CONTRACT_REVIEW,
    REQUEST_TYPES.LEGAL_ADVICE,
    REQUEST_TYPES.COMPLIANCE,
    REQUEST_TYPES.IP_PATENT,
    REQUEST_TYPES.EMPLOYMENT,
    REQUEST_TYPES.OTHER
];

// Request Statuses
export const STATUSES = {
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed'
};

export const STATUS_OPTIONS = [
    STATUSES.SUBMITTED,
    STATUSES.UNDER_REVIEW,
    STATUSES.IN_PROGRESS,
    STATUSES.RESOLVED,
    STATUSES.CLOSED
];

// Priorities
export const PRIORITIES = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent'
};

export const PRIORITY_OPTIONS = [
    PRIORITIES.LOW,
    PRIORITIES.MEDIUM,
    PRIORITIES.HIGH,
    PRIORITIES.URGENT
];

// Departments
export const DEPARTMENTS = {
    BUSINESS_DEVELOPMENT: 'Business Development',
    CX_CUSTOMER_SUPPORT_CERT: 'CX / Customer Support / CERT',
    ENGINEERING_OCTO: 'Engineering / OCTO',
    FITOPS: 'FITOPS',
    MARKETING: 'Marketing',
    PEOPLE_PLACES: 'People & Places',
    PRODUCT_MANAGEMENT: 'Product Management',
    WWFO: 'WWFO'
};

export const DEPARTMENT_OPTIONS = [
    { 
        value: DEPARTMENTS.BUSINESS_DEVELOPMENT, 
        label: DEPARTMENTS.BUSINESS_DEVELOPMENT,
        description: 'Legal support for Business Development activities and partnerships.'
    },
    { 
        value: DEPARTMENTS.CX_CUSTOMER_SUPPORT_CERT, 
        label: DEPARTMENTS.CX_CUSTOMER_SUPPORT_CERT,
        description: 'Legal services for Customer Experience, Support, and CERT teams.'
    },
    { 
        value: DEPARTMENTS.ENGINEERING_OCTO, 
        label: DEPARTMENTS.ENGINEERING_OCTO,
        description: 'Legal support for Engineering and Office of the CTO.'
    },
    { 
        value: DEPARTMENTS.FITOPS, 
        label: DEPARTMENTS.FITOPS,
        description: 'Legal guidance for Finance, IT, and Operations teams.'
    },
    { 
        value: DEPARTMENTS.MARKETING, 
        label: DEPARTMENTS.MARKETING,
        description: 'Legal review for marketing materials, campaigns, and events.'
    },
    { 
        value: DEPARTMENTS.PEOPLE_PLACES, 
        label: DEPARTMENTS.PEOPLE_PLACES,
        description: 'Legal support for HR, Facilities, and Workplace teams.'
    },
    { 
        value: DEPARTMENTS.PRODUCT_MANAGEMENT, 
        label: DEPARTMENTS.PRODUCT_MANAGEMENT,
        description: 'Legal support for Product Management and strategy.'
    },
    { 
        value: DEPARTMENTS.WWFO, 
        label: DEPARTMENTS.WWFO,
        description: 'Field, Technical, Channel, BizDev, Alliances, Services & Operations'
    }
];

// Storage Keys
export const STORAGE_KEYS = {
    USERS: 'legalFrontDoor_users',
    REQUESTS: 'legalFrontDoor_requests',
    COMMENTS: 'legalFrontDoor_comments',
    FAVORITES: 'legalFrontDoor_favorites',
    INITIALIZED: 'legalFrontDoor_initialized',
    NEXT_REQUEST_ID: 'legalFrontDoor_nextRequestId',
    CURRENT_USER: 'currentUser'
};

// User Roles
export const ROLES = {
    ADMIN: 'admin',
    EMPLOYEE: 'employee'
};

// Priority CSS Classes
export const PRIORITY_CLASSES = {
    [PRIORITIES.LOW]: 'priority-low',
    [PRIORITIES.MEDIUM]: 'priority-medium',
    [PRIORITIES.HIGH]: 'priority-high',
    [PRIORITIES.URGENT]: 'priority-urgent'
};

// Icon Types
export const ICON_TYPES = {
    CONTRACT: 'contract',
    ADVICE: 'advice',
    COMPLIANCE: 'compliance',
    IP: 'ip',
    EMPLOYMENT: 'employment',
    PRIVACY: 'privacy'
};

// Request Type to Icon Mapping
export const REQUEST_TYPE_ICON_MAP = {
    [REQUEST_TYPES.CONTRACT_REVIEW]: ICON_TYPES.CONTRACT,
    [REQUEST_TYPES.LEGAL_ADVICE]: ICON_TYPES.ADVICE,
    [REQUEST_TYPES.COMPLIANCE]: ICON_TYPES.COMPLIANCE,
    [REQUEST_TYPES.IP_PATENT]: ICON_TYPES.IP,
    [REQUEST_TYPES.EMPLOYMENT]: ICON_TYPES.EMPLOYMENT,
    [REQUEST_TYPES.OTHER]: ICON_TYPES.PRIVACY
};

// Department to Icon Mapping
export const DEPARTMENT_ICON_MAP = {
    [DEPARTMENTS.BUSINESS_DEVELOPMENT]: ICON_TYPES.CONTRACT,
    [DEPARTMENTS.CX_CUSTOMER_SUPPORT_CERT]: ICON_TYPES.ADVICE,
    [DEPARTMENTS.ENGINEERING_OCTO]: ICON_TYPES.IP,
    [DEPARTMENTS.FITOPS]: ICON_TYPES.COMPLIANCE,
    [DEPARTMENTS.MARKETING]: ICON_TYPES.PRIVACY,
    [DEPARTMENTS.PEOPLE_PLACES]: ICON_TYPES.EMPLOYMENT,
    [DEPARTMENTS.PRODUCT_MANAGEMENT]: ICON_TYPES.IP,
    [DEPARTMENTS.WWFO]: ICON_TYPES.ADVICE
};

// Navigation Routes
export const ROUTES = {
    HOME: 'index.html',
    MY_REQUESTS: 'my-requests.html',
    SUBMIT_REQUEST: 'lops-general-intake.html',
    REQUEST_DETAIL: 'request-detail.html',
    ADMIN_DASHBOARD: 'admin-dashboard.html'
};

