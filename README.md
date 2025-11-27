# Legal Front Door - Cohesity Internal Legal Intake Application

A comprehensive web application for managing legal requests and tracking their fulfillment across the organization.

## Overview

Legal Front Door is a centralized portal for employees to submit legal requests and for the Legal team to manage, track, and fulfill those requests. Built with vanilla HTML, CSS, and JavaScript, this application provides a modern, intuitive interface styled with Cohesity's brand identity.

## Features

### For All Users
- **Submit Legal Requests**: Easy-to-use form for submitting various types of legal requests
- **Track Requests**: View all your submitted requests with real-time status updates
- **Search & Filter**: Quickly find requests using search and multiple filter criteria
- **Comments**: Add and view comments on requests for better communication
- **File Attachments**: Attach relevant documents to requests (simulated)
- **Status Timeline**: View the complete history of request status changes

### For Legal Admins
- **Admin Dashboard**: View and manage all requests across the organization
- **Status Management**: Update request statuses through the workflow
- **Assignment**: Assign requests to legal team members
- **Analytics**: View quick statistics on request volume and status
- **Advanced Filtering**: Filter by submitter, type, priority, and more

## Request Types

- Contract Review
- Legal Advice
- Compliance
- IP/Patent
- Employment
- Other

## Request Workflow

1. **Submitted** - Initial state when request is created
2. **Under Review** - Legal team is reviewing the request
3. **In Progress** - Actively working on the request
4. **Resolved** - Request has been fulfilled
5. **Closed** - Request is complete and archived

## Getting Started

### Installation

No installation required! This is a pure frontend application that runs in your browser.

### Running the Application

1. Open `index.html` in a modern web browser
2. Select a user from the dropdown to simulate login
3. Start exploring the application

### Demo Users

**Employees:**
- John Doe (Engineering)
- Sarah Johnson (Sales)
- Mike Chen (Marketing)

**Legal Admins:**
- Lisa Anderson (Legal)
- David Martinez (Legal)

## Project Structure

```
legal-front-door/
├── index.html              # Landing/login page
├── submit-request.html     # Request submission form
├── my-requests.html        # User dashboard
├── admin-dashboard.html    # Admin view
├── request-detail.html     # Individual request details
├── css/
│   └── styles.css          # Cohesity-branded stylesheet
├── js/
│   ├── app.js              # Core application logic
│   ├── requests.js         # Request management
│   ├── search.js           # Search and filtering
│   └── mock-data.js        # Sample data initialization
└── README.md               # This file
```

## Data Storage

The application uses browser `localStorage` for data persistence. All data is stored locally in your browser and includes:

- User information
- Legal requests
- Comments and updates
- Request timeline

### Resetting Data

To reset the application to initial state:
1. Open browser Developer Tools (F12)
2. Go to Application/Storage tab
3. Clear localStorage items starting with `legalFrontDoor_`
4. Refresh the page

## Styling

The application uses Cohesity's brand colors:
- **Primary Color**: #96C73D (Cohesity Green)
- **Secondary Color**: #000000 (Black)
- **Background**: #F5F5F5 (Light Gray)

The design is fully responsive and works on desktop and tablet devices.

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

Requires a modern browser with ES6+ JavaScript support and localStorage.

## Key Features Implementation

### Submit Request
- Form validation ensures all required fields are completed
- File upload simulation captures file metadata
- Automatic request ID generation
- Success confirmation with navigation options

### My Requests Dashboard
- Card-based layout for easy scanning
- Real-time search across title, description, and ID
- Filter by status, type, and priority
- Click any request to view details

### Admin Dashboard
- Tabular view of all organizational requests
- Quick statistics panel showing request metrics
- Advanced filtering options
- Assign requests to legal team members
- Update request status directly from dashboard

### Request Detail Page
- Complete request information display
- Visual timeline of status changes
- Threaded comment system
- Admin controls for status and assignment updates
- File attachment list

### Search & Filter
- Real-time search with no page reload
- Multi-criteria filtering
- Search across multiple fields
- Persistent filter state

## Future Enhancements

Potential features for future versions:
- Email notifications
- Advanced reporting and analytics
- Document preview
- Calendar integration for deadlines
- Mobile app version
- Integration with legal case management systems
- Export to PDF/Excel
- Bulk operations
- Custom workflows per request type

## Support

For questions or issues with the Legal Front Door application, please contact the Legal Operations team.

## License

Internal use only - Cohesity, Inc.

