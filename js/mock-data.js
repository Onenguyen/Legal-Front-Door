// Mock Data for Legal Front Door Application
// This file previously contained sample data initialization.
// All sample data has been removed - the app will start with empty data.

// Clear all existing sample data from localStorage
function clearSampleData() {
    // Clear all legal front door data
    localStorage.removeItem('legalFrontDoor_users');
    localStorage.removeItem('legalFrontDoor_requests');
    localStorage.removeItem('legalFrontDoor_comments');
    localStorage.removeItem('legalFrontDoor_favorites');
    localStorage.removeItem('legalFrontDoor_initialized');
    localStorage.removeItem('legalFrontDoor_nextRequestId');
    
    // Clear current user from sessionStorage to ensure clean state
    sessionStorage.removeItem('currentUser');
}

// Initialize default data structures in localStorage
function initializeMockData() {
    // Only initialize if not already done (check the initialized flag)
    const isInitialized = localStorage.getItem('legalFrontDoor_initialized');
    
    if (!isInitialized) {
        // Clear any existing sample data first (only on first init)
        clearSampleData();
        
        // Create default users: Dwight (employee) and Michael (admin)
        const defaultUsers = [
            {
                id: 'user_dwight',
                name: 'Dwight',
                email: 'dwight@cohesity.com',
                role: 'employee',
                department: 'Business Development'
            },
            {
                id: 'user_michael',
                name: 'Michael',
                email: 'michael@cohesity.com',
                role: 'admin',
                department: 'Legal'
            }
        ];
        
        // Create default favorite: Legal Operations General Intake
        const defaultFavorites = [
            {
                id: 'fav_lops_intake',
                userId: 'user_dwight',
                name: 'Legal Operations General Intake',
                prefill: {
                    department: '',
                    type: '',
                    title: ''
                }
            }
        ];
        
        // Initialize with default data
        localStorage.setItem('legalFrontDoor_users', JSON.stringify(defaultUsers));
        localStorage.setItem('legalFrontDoor_requests', JSON.stringify([]));
        localStorage.setItem('legalFrontDoor_comments', JSON.stringify([]));
        localStorage.setItem('legalFrontDoor_favorites', JSON.stringify(defaultFavorites));
        localStorage.setItem('legalFrontDoor_initialized', 'true');
        localStorage.setItem('legalFrontDoor_nextRequestId', '1001');
    }
}

// Initialize on load - this will set up default users and favorites (only first time)
initializeMockData();
