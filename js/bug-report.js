// Bug Report and Feature Request System using EmailJS

class BugReportSystem {
    constructor() {
        this.emailJSInitialized = false;
        this.initializeEmailJS();
    }

    async initializeEmailJS() {
        const userId = window.VITE_EMAILJS_USER_ID;
        
        if (userId) {
            try {
                // Load EmailJS from CDN if not already loaded
                if (!window.emailjs) {
                    await this.loadEmailJS();
                }
                
                if (window.emailjs) {
                    window.emailjs.init(userId);
                    this.emailJSInitialized = true;
                    console.log('EmailJS initialized successfully');
                }
            } catch (error) {
                console.error('EmailJS initialization failed:', error);
            }
        } else {
            console.log('EmailJS not configured');
        }
    }

    async loadEmailJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
            script.onload = () => {
                window.emailjs = window.emailjs || window.EmailJS;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async sendBugReport(reportData) {
        if (!this.emailJSInitialized) {
            throw new Error('EmailJS not initialized');
        }

        const serviceId = window.VITE_EMAILJS_SERVICE_ID;
        const templateId = window.VITE_EMAILJS_TEMPLATE_ID;

        if (!serviceId || !templateId) {
            throw new Error('EmailJS service or template ID not configured');
        }

        const templateParams = {
            from_name: reportData.name || 'Anonymous',
            from_email: reportData.email || 'noreply@example.com',
            report_type: reportData.type || 'Bug Report',
            subject: reportData.subject,
            message: reportData.message,
            browser_info: this.getBrowserInfo(),
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            current_url: window.location.href
        };

        try {
            const response = await window.emailjs.send(serviceId, templateId, templateParams);
            console.log('Bug report sent successfully:', response);
            return response;
        } catch (error) {
            console.error('Failed to send bug report:', error);
            throw error;
        }
    }

    getBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    showBugReportModal() {
        const modal = this.createBugReportModal();
        document.body.appendChild(modal);
        modal.classList.remove('hidden');
    }

    createBugReportModal() {
        const modal = document.createElement('div');
        modal.id = 'bug-report-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Report a Bug or Request a Feature</h3>
                    <button onclick="closeBugReportModal()" class="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
                </div>
                
                <form id="bug-report-form">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select id="report-type" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" required>
                            <option value="">Select type...</option>
                            <option value="Bug Report">🐛 Bug Report</option>
                            <option value="Feature Request">💡 Feature Request</option>
                            <option value="General Feedback">💬 General Feedback</option>
                            <option value="UI/UX Issue">🎨 UI/UX Issue</option>
                        </select>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Your Name (Optional)</label>
                        <input type="text" id="report-name" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Your name">
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Your Email (Optional)</label>
                        <input type="email" id="report-email" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="your.email@example.com">
                        <div class="text-xs text-gray-500 mt-1">We'll only use this to follow up if needed</div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                        <input type="text" id="report-subject" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Brief description" required>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea id="report-message" rows="6" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Please describe the issue or feature request in detail..." required></textarea>
                        <div class="text-xs text-gray-500 mt-1">
                            For bugs: Steps to reproduce, expected vs actual behavior<br>
                            For features: What would you like to see and why?
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="flex items-center">
                            <input type="checkbox" id="include-browser-info" checked class="mr-2">
                            <span class="text-sm text-gray-700">Include browser and system information</span>
                        </label>
                    </div>
                    
                    <div class="flex gap-3">
                        <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
                            <span id="submit-text">Send Report</span>
                            <span id="submit-loading" class="hidden">Sending...</span>
                        </button>
                        <button type="button" onclick="closeBugReportModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800 transition duration-200">
                            Cancel
                        </button>
                    </div>
                </form>
                
                <div id="report-success" class="hidden mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div class="text-green-800 text-sm">
                        ✅ Thank you! Your report has been sent successfully.
                    </div>
                </div>
                
                <div id="report-error" class="hidden mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div class="text-red-800 text-sm">
                        ❌ <span id="error-message">Failed to send report. Please try again.</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add form submission handler
        const form = modal.querySelector('#bug-report-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmission(modal);
        });
        
        return modal;
    }

    async handleFormSubmission(modal) {
        const submitButton = modal.querySelector('button[type="submit"]');
        const submitText = modal.querySelector('#submit-text');
        const submitLoading = modal.querySelector('#submit-loading');
        const successDiv = modal.querySelector('#report-success');
        const errorDiv = modal.querySelector('#report-error');
        const errorMessage = modal.querySelector('#error-message');
        
        // Reset states
        successDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
        submitButton.disabled = true;
        submitText.classList.add('hidden');
        submitLoading.classList.remove('hidden');
        
        try {
            const formData = {
                type: modal.querySelector('#report-type').value,
                name: modal.querySelector('#report-name').value,
                email: modal.querySelector('#report-email').value,
                subject: modal.querySelector('#report-subject').value,
                message: modal.querySelector('#report-message').value,
                includeBrowserInfo: modal.querySelector('#include-browser-info').checked
            };
            
            if (!formData.includeBrowserInfo) {
                // Don't include browser info if user opted out
                formData.browserInfo = 'User opted out of browser info';
            }
            
            await this.sendBugReport(formData);
            
            // Show success
            successDiv.classList.remove('hidden');
            
            // Clear form
            modal.querySelector('#bug-report-form').reset();
            
            // Auto-close after 3 seconds
            setTimeout(() => {
                this.closeBugReportModal();
            }, 3000);
            
        } catch (error) {
            console.error('Error sending bug report:', error);
            errorMessage.textContent = error.message || 'Failed to send report. Please try again.';
            errorDiv.classList.remove('hidden');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitText.classList.remove('hidden');
            submitLoading.classList.add('hidden');
        }
    }

    closeBugReportModal() {
        const modal = document.getElementById('bug-report-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Global functions for HTML onclick handlers
window.showBugReportModal = () => {
    window.bugReportSystem.showBugReportModal();
};

window.closeBugReportModal = () => {
    window.bugReportSystem.closeBugReportModal();
};

// Create global instance
window.bugReportSystem = new BugReportSystem();