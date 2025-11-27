// Mock Data for Legal Front Door Application

// Initialize data in localStorage if not exists
function initializeMockData() {
    if (!localStorage.getItem('legalFrontDoor_initialized')) {
        // Users
        const users = [
            { id: '1', name: 'John Doe', role: 'employee', email: 'john.doe@cohesity.com', department: 'Engineering' },
            { id: '2', name: 'Sarah Johnson', role: 'employee', email: 'sarah.johnson@cohesity.com', department: 'Sales' },
            { id: '3', name: 'Mike Chen', role: 'employee', email: 'mike.chen@cohesity.com', department: 'Marketing' },
            { id: '4', name: 'Lisa Anderson', role: 'admin', email: 'lisa.anderson@cohesity.com', department: 'Legal' },
            { id: '5', name: 'David Martinez', role: 'admin', email: 'david.martinez@cohesity.com', department: 'Legal' }
        ];
        
        // Sample Requests
        const requests = [
            {
                id: '1001',
                title: 'NDA Review for Vendor Partnership',
                type: 'Contract Review',
                priority: 'High',
                status: 'In Progress',
                description: 'Need legal review of NDA with CloudTech Solutions before we can proceed with technical discussions. The vendor has requested mutual NDA terms and we need to ensure our IP is protected.',
                department: 'Business Development',
                submittedBy: '2',
                assignedTo: '4',
                submittedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                files: [
                    { name: 'CloudTech_NDA_Draft.pdf', size: 245678, type: 'application/pdf' },
                    { name: 'Vendor_Requirements.docx', size: 89234, type: 'application/msword' }
                ],
                timeline: [
                    {
                        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Request Submitted',
                        status: 'Submitted'
                    },
                    {
                        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Status changed to Under Review',
                        status: 'Under Review'
                    },
                    {
                        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Request assigned to: Lisa Anderson',
                        status: 'Under Review'
                    },
                    {
                        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Status changed to In Progress',
                        status: 'In Progress'
                    }
                ]
            },
            {
                id: '1002',
                title: 'Employment Agreement - New Senior Engineer',
                type: 'Employment',
                priority: 'Urgent',
                status: 'Under Review',
                description: 'We are hiring a senior engineer with specific equity and compensation requirements. Need legal to draft employment agreement with custom terms discussed with the candidate.',
                department: 'Human Resources',
                submittedBy: '1',
                assignedTo: '5',
                submittedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                files: [
                    { name: 'Candidate_Requirements.pdf', size: 156789, type: 'application/pdf' }
                ],
                timeline: [
                    {
                        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Request Submitted',
                        status: 'Submitted'
                    },
                    {
                        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Status changed to Under Review',
                        status: 'Under Review'
                    },
                    {
                        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Request assigned to: David Martinez',
                        status: 'Under Review'
                    }
                ]
            },
            {
                id: '1003',
                title: 'GDPR Compliance Review for EU Data Processing',
                type: 'Compliance',
                priority: 'High',
                status: 'Resolved',
                description: 'We are expanding operations to the EU and need comprehensive GDPR compliance review of our data processing activities, privacy policies, and data protection measures.',
                department: 'Compliance',
                submittedBy: '3',
                assignedTo: '4',
                submittedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                files: [
                    { name: 'Current_Privacy_Policy.pdf', size: 345678, type: 'application/pdf' },
                    { name: 'EU_Expansion_Plan.docx', size: 234567, type: 'application/msword' },
                    { name: 'Data_Flow_Diagram.png', size: 678912, type: 'image/png' }
                ],
                timeline: [
                    {
                        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Request Submitted',
                        status: 'Submitted'
                    },
                    {
                        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Status changed to Under Review',
                        status: 'Under Review'
                    },
                    {
                        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Request assigned to: Lisa Anderson',
                        status: 'Under Review'
                    },
                    {
                        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Status changed to In Progress',
                        status: 'In Progress'
                    },
                    {
                        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Status changed to Resolved',
                        status: 'Resolved'
                    }
                ]
            },
            {
                id: '1004',
                title: 'Patent Application for Data Deduplication Algorithm',
                type: 'IP/Patent',
                priority: 'Medium',
                status: 'Submitted',
                description: 'Engineering team has developed a novel data deduplication algorithm that we believe is patentable. Need legal assistance to evaluate patentability and file application if appropriate.',
                department: 'Engineering',
                submittedBy: '1',
                assignedTo: null,
                submittedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                files: [
                    { name: 'Algorithm_Description.pdf', size: 567890, type: 'application/pdf' },
                    { name: 'Technical_Specification.docx', size: 445678, type: 'application/msword' }
                ],
                timeline: [
                    {
                        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Request Submitted',
                        status: 'Submitted'
                    }
                ]
            },
            {
                id: '1005',
                title: 'Customer Service Agreement Terms Update',
                type: 'Contract Review',
                priority: 'Medium',
                status: 'In Progress',
                description: 'Need to update our standard customer service agreement to include new SLA terms and updated liability clauses. This will affect all new customer contracts.',
                department: 'Sales',
                submittedBy: '2',
                assignedTo: '5',
                submittedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                files: [
                    { name: 'Current_Service_Agreement.pdf', size: 389012, type: 'application/pdf' },
                    { name: 'Proposed_Changes.docx', size: 123456, type: 'application/msword' }
                ],
                timeline: [
                    {
                        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Request Submitted',
                        status: 'Submitted'
                    },
                    {
                        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Status changed to Under Review',
                        status: 'Under Review'
                    },
                    {
                        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Request assigned to: David Martinez',
                        status: 'Under Review'
                    },
                    {
                        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Status changed to In Progress',
                        status: 'In Progress'
                    }
                ]
            },
            {
                id: '1006',
                title: 'Legal Advice on Open Source License Compliance',
                type: 'Legal Advice',
                priority: 'Low',
                status: 'Closed',
                description: 'Question about using Apache 2.0 licensed components in our commercial product and ensuring we meet all license requirements.',
                department: 'Engineering',
                submittedBy: '1',
                assignedTo: '4',
                submittedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                files: [],
                timeline: [
                    {
                        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Request Submitted',
                        status: 'Submitted'
                    },
                    {
                        date: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Status changed to Under Review',
                        status: 'Under Review'
                    },
                    {
                        date: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Request assigned to: Lisa Anderson',
                        status: 'Under Review'
                    },
                    {
                        date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Status changed to Resolved',
                        status: 'Resolved'
                    },
                    {
                        date: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Status changed to Closed',
                        status: 'Closed'
                    }
                ]
            },
            {
                id: '1007',
                title: 'Marketing Campaign Compliance Review',
                type: 'Compliance',
                priority: 'Medium',
                status: 'Under Review',
                description: 'Launching new marketing campaign targeting healthcare sector. Need review to ensure all claims are compliant with healthcare advertising regulations and HIPAA requirements.',
                department: 'Marketing',
                submittedBy: '3',
                assignedTo: '4',
                submittedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                files: [
                    { name: 'Campaign_Materials.pdf', size: 2345678, type: 'application/pdf' },
                    { name: 'Target_Messaging.docx', size: 123890, type: 'application/msword' }
                ],
                timeline: [
                    {
                        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Request Submitted',
                        status: 'Submitted'
                    },
                    {
                        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Status changed to Under Review',
                        status: 'Under Review'
                    },
                    {
                        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        event: 'Request assigned to: Lisa Anderson',
                        status: 'Under Review'
                    }
                ]
            }
        ];
        
        // Sample Comments
        const comments = [
            {
                id: 'c1',
                requestId: '1001',
                userId: '4',
                text: 'I have started reviewing the NDA. Initial observations: The mutual confidentiality terms look standard, but I need to review the IP ownership clauses more carefully.',
                timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'c2',
                requestId: '1001',
                userId: '2',
                text: 'Thank you Lisa! Please note that the vendor is requesting a 2-year term. Is that acceptable?',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 12 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'c3',
                requestId: '1001',
                userId: '4',
                text: 'A 2-year term is fine for this type of agreement. I will have redlines ready by end of week.',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'c4',
                requestId: '1002',
                userId: '5',
                text: 'I have the template ready. Can you provide the specific equity percentage and vesting schedule discussed with the candidate?',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'c5',
                requestId: '1002',
                userId: '1',
                text: '0.15% equity with standard 4-year vesting and 1-year cliff. Also includes sign-on bonus of $25K.',
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 18 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'c6',
                requestId: '1003',
                userId: '4',
                text: 'Comprehensive GDPR review completed. I have drafted updated privacy policies and data processing agreements. All materials attached to email.',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'c7',
                requestId: '1003',
                userId: '3',
                text: 'Excellent work! This is exactly what we needed for the EU expansion.',
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'c8',
                requestId: '1005',
                userId: '5',
                text: 'Working on the updated terms. The new SLA provisions will require careful wording to balance customer expectations with our operational capabilities.',
                timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'c9',
                requestId: '1006',
                userId: '4',
                text: 'Apache 2.0 is compatible with commercial use. You need to include the license text, preserve copyright notices, and state any modifications. I will send detailed guidelines.',
                timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'c10',
                requestId: '1007',
                userId: '4',
                text: 'Initial review shows most claims are fine, but we need to tone down some language in the healthcare efficacy section to avoid regulatory issues.',
                timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        // Store in localStorage
        localStorage.setItem('legalFrontDoor_users', JSON.stringify(users));
        localStorage.setItem('legalFrontDoor_requests', JSON.stringify(requests));
        localStorage.setItem('legalFrontDoor_comments', JSON.stringify(comments));
        
        // Favorites - use helper function to avoid duplication
        const favorites = getDefaultFavorites();
        
        localStorage.setItem('legalFrontDoor_favorites', JSON.stringify(favorites));
        localStorage.setItem('legalFrontDoor_initialized', 'true');
        localStorage.setItem('legalFrontDoor_nextRequestId', '1008');
    }

    // Ensure favorites exist even if already initialized
    if (!localStorage.getItem('legalFrontDoor_favorites')) {
        localStorage.setItem('legalFrontDoor_favorites', JSON.stringify(getDefaultFavorites()));
    }
}

// Helper function to generate default favorites (avoids duplication)
function getDefaultFavorites() {
    return [1, 2, 3, 4, 5].map(id => ({
        id: `fav${id}`,
        userId: String(id),
        name: 'Legal Operations General Intake',
        icon: 'general',
        prefill: {
            department: 'Legal Operations',
            type: 'Legal Advice',
            title: 'General Intake Request'
        }
    }));
}

// Initialize on load
initializeMockData();

