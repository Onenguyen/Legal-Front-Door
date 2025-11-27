// Submit Request Page Logic
import { initializeDefaultUser, createRequest } from '../core/state.js';
import { onReady } from '../utils/dom.js';
import { ROUTES } from '../core/constants.js';

// Initialize page
onReady(() => {
    // Set default user
    initializeDefaultUser();
    
    // Check for prefilled values from sessionStorage
    const prefilledTitle = sessionStorage.getItem('prefilledTitle');
    const prefilledType = sessionStorage.getItem('prefilledRequestType');
    const prefilledDepartment = sessionStorage.getItem('prefilledDepartment');
    
    if (prefilledTitle) {
        const titleInput = document.getElementById('requestTitle');
        if (titleInput) titleInput.value = prefilledTitle;
        sessionStorage.removeItem('prefilledTitle');
    }
    
    if (prefilledType) {
        const typeSelect = document.getElementById('requestType');
        if (typeSelect) typeSelect.value = prefilledType;
        sessionStorage.removeItem('prefilledRequestType');
    }
    
    if (prefilledDepartment) {
        const deptInput = document.getElementById('department');
        if (deptInput) deptInput.value = prefilledDepartment;
        sessionStorage.removeItem('prefilledDepartment');
    }
    
    // File upload handler
    const fileUpload = document.getElementById('fileUpload');
    if (fileUpload) {
        fileUpload.addEventListener('change', function(e) {
            const fileList = document.getElementById('fileList');
            if (!fileList) return;
            
            fileList.innerHTML = '';
            
            if (e.target.files.length > 0) {
                const ul = document.createElement('ul');
                for (let file of e.target.files) {
                    const li = document.createElement('li');
                    li.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
                    ul.appendChild(li);
                }
                fileList.appendChild(ul);
            }
        });
    }
    
    // Form submission handler
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('fileUpload');
            const files = [];
            if (fileInput && fileInput.files.length > 0) {
                for (let file of fileInput.files) {
                    files.push({
                        name: file.name,
                        size: file.size,
                        type: file.type
                    });
                }
            }
            
            const requestData = {
                title: document.getElementById('requestTitle').value,
                type: document.getElementById('requestType').value,
                priority: document.getElementById('priority').value,
                department: document.getElementById('department').value,
                description: document.getElementById('description').value,
                files: files
            };
            
            const newRequest = createRequest(requestData);
            
            // Show success message
            const cardEl = document.querySelector('.card');
            const pageHeaderEl = document.querySelector('.page-header');
            const successMsg = document.getElementById('successMessage');
            const newRequestIdEl = document.getElementById('newRequestId');
            
            if (cardEl) cardEl.style.display = 'none';
            if (pageHeaderEl) pageHeaderEl.style.display = 'none';
            if (successMsg) successMsg.style.display = 'block';
            if (newRequestIdEl && newRequest) newRequestIdEl.textContent = newRequest.id;
            
            // Scroll to top
            window.scrollTo(0, 0);
        });
    }
});

