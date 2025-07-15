// ONBOARDING DEBUG AND LOGGING UTILITIES
// This module provides comprehensive debugging tools for the onboarding process

class OnboardingDebugger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.isEnabled = true;
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        this.currentLogLevel = this.logLevels.DEBUG;
        
        // Auto-enable debug mode in non-production environments
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('vercel.app')) {
            this.enableDebugMode();
        }
    }

    enableDebugMode() {
        this.isEnabled = true;
        window.onboardingDebugger = this;
        console.log('🔧 Onboarding Debug Mode Enabled');
        
        // Add debug panel to page
        this.createDebugPanel();
    }

    createDebugPanel() {
        // Create debug panel HTML
        const debugPanel = document.createElement('div');
        debugPanel.id = 'onboarding-debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            max-height: 400px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            overflow-y: auto;
            display: none;
        `;
        
        debugPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong>🔧 Onboarding Debug</strong>
                <button onclick="this.parentElement.parentElement.style.display='none'" style="background: none; border: none; color: white; cursor: pointer;">✕</button>
            </div>
            <div id="debug-logs" style="max-height: 300px; overflow-y: auto;"></div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #333;">
                <button onclick="window.onboardingDebugger.runHealthCheck()" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Health Check</button>
                <button onclick="window.onboardingDebugger.runRecovery()" style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Recovery</button>
                <button onclick="window.onboardingDebugger.clearLogs()" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Clear</button>
            </div>
        `;
        
        document.body.appendChild(debugPanel);
        
        // Add keyboard shortcut to toggle debug panel
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                const panel = document.getElementById('onboarding-debug-panel');
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    log(level, message, data = null) {
        if (!this.isEnabled || this.logLevels[level] > this.currentLogLevel) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            stack: level === 'ERROR' ? (new Error()).stack : null
        };
        
        this.logs.push(logEntry);
        
        // Limit log size
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Console output with styling
        const style = {
            ERROR: 'color: #ff6b6b; font-weight: bold;',
            WARN: 'color: #ffd93d; font-weight: bold;',
            INFO: 'color: #6bcf7f;',
            DEBUG: 'color: #74c0fc;'
        };
        
        console.log(`%c[${level}] ${message}`, style[level], data);
        
        // Update debug panel if visible
        this.updateDebugPanel();
    }

    updateDebugPanel() {
        const debugLogs = document.getElementById('debug-logs');
        if (!debugLogs) return;
        
        const recentLogs = this.logs.slice(-20); // Show last 20 logs
        debugLogs.innerHTML = recentLogs.map(log => {
            const color = {
                ERROR: '#ff6b6b',
                WARN: '#ffd93d',
                INFO: '#6bcf7f',
                DEBUG: '#74c0fc'
            }[log.level];
            
            return `
                <div style="margin-bottom: 5px; padding: 3px; border-left: 3px solid ${color}; padding-left: 8px;">
                    <div style="font-size: 10px; opacity: 0.7;">${log.timestamp.split('T')[1].split('.')[0]}</div>
                    <div style="color: ${color}; font-weight: bold;">[${log.level}] ${log.message}</div>
                    ${log.data ? `<div style="font-size: 10px; opacity: 0.8;">${JSON.stringify(log.data, null, 2)}</div>` : ''}
                </div>
            `;
        }).join('');
        
        debugLogs.scrollTop = debugLogs.scrollHeight;
    }

    error(message, data) { this.log('ERROR', message, data); }
    warn(message, data) { this.log('WARN', message, data); }
    info(message, data) { this.log('INFO', message, data); }
    debug(message, data) { this.log('DEBUG', message, data); }

    async runHealthCheck() {
        this.info('🏥 Running onboarding health check...');
        
        try {
            if (!window.mealPlannerAPI.isSupabaseReady()) {
                this.warn('Supabase not ready, skipping health check');
                return;
            }
            
            const healthResult = await window.mealPlannerAPI.supabase.rpc('onboarding_health_check');
            
            if (healthResult.error) {
                this.error('Health check failed', healthResult.error);
                return;
            }
            
            this.info('Health check results:', healthResult.data);
            
            // Show results in alert for immediate feedback
            alert(`Health Check Results:
Total Users: ${healthResult.data.total_users}
Completed Users: ${healthResult.data.completed_users}
Completion Rate: ${healthResult.data.completion_rate}%
Health Status: ${healthResult.data.health_status}
Inconsistent Users: ${healthResult.data.inconsistent_users}
Recommendations: ${healthResult.data.recommendations.join(', ')}`);
            
        } catch (error) {
            this.error('Health check exception', error);
        }
    }

    async runRecovery() {
        this.info('🔄 Running onboarding recovery...');
        
        try {
            if (!window.mealPlannerAPI.isSupabaseReady()) {
                this.warn('Supabase not ready, skipping recovery');
                return;
            }
            
            const recoveryResult = await window.mealPlannerAPI.recoverIncompleteOnboarding();
            
            if (recoveryResult.success) {
                this.info('Recovery completed successfully', recoveryResult.data);
                alert('Recovery completed successfully!');
            } else {
                this.error('Recovery failed', recoveryResult.error);
                alert(`Recovery failed: ${recoveryResult.error}`);
            }
            
        } catch (error) {
            this.error('Recovery exception', error);
        }
    }

    clearLogs() {
        this.logs = [];
        this.updateDebugPanel();
        this.info('Debug logs cleared');
    }

    // Track onboarding state changes
    trackStateChange(fromState, toState, metadata = {}) {
        this.info(`State Change: ${fromState} → ${toState}`, metadata);
    }

    // Track API calls
    trackApiCall(method, endpoint, data = null, result = null, error = null) {
        if (error) {
            this.error(`API Call Failed: ${method} ${endpoint}`, { data, error });
        } else {
            this.debug(`API Call: ${method} ${endpoint}`, { data, result });
        }
    }

    // Track user interactions
    trackUserInteraction(action, element, metadata = {}) {
        this.debug(`User Interaction: ${action}`, { element, ...metadata });
    }

    // Export logs for support
    exportLogs() {
        const logData = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            logs: this.logs,
            supabaseReady: window.mealPlannerAPI?.isSupabaseReady() || false,
            authenticated: window.mealPlannerAPI?.isAuthenticated() || false
        };
        
        const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `onboarding-debug-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.info('Debug logs exported');
    }

    // Performance monitoring
    startTimer(name) {
        this.debug(`Timer Start: ${name}`);
        return performance.now();
    }

    endTimer(name, startTime) {
        const duration = performance.now() - startTime;
        this.debug(`Timer End: ${name} took ${duration.toFixed(2)}ms`);
        return duration;
    }

    // Memory usage tracking
    trackMemoryUsage(label) {
        if (performance.memory) {
            const memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB',
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
            };
            this.debug(`Memory Usage (${label}):`, memory);
        }
    }
}

// Initialize global debugger instance
window.onboardingDebugger = new OnboardingDebugger();

// Enhance the existing API with debugging
if (window.mealPlannerAPI) {
    const originalUpdateUserProfile = window.mealPlannerAPI.updateUserProfile;
    window.mealPlannerAPI.updateUserProfile = async function(profileData) {
        const timer = window.onboardingDebugger.startTimer('updateUserProfile');
        try {
            window.onboardingDebugger.trackApiCall('POST', 'updateUserProfile', profileData);
            const result = await originalUpdateUserProfile.call(this, profileData);
            window.onboardingDebugger.endTimer('updateUserProfile', timer);
            window.onboardingDebugger.trackApiCall('POST', 'updateUserProfile', profileData, result);
            return result;
        } catch (error) {
            window.onboardingDebugger.endTimer('updateUserProfile', timer);
            window.onboardingDebugger.trackApiCall('POST', 'updateUserProfile', profileData, null, error);
            throw error;
        }
    };
}

// Add debug console commands
window.debugOnboarding = {
    healthCheck: () => window.onboardingDebugger.runHealthCheck(),
    recovery: () => window.onboardingDebugger.runRecovery(),
    exportLogs: () => window.onboardingDebugger.exportLogs(),
    clearLogs: () => window.onboardingDebugger.clearLogs(),
    showPanel: () => document.getElementById('onboarding-debug-panel').style.display = 'block',
    hidePanel: () => document.getElementById('onboarding-debug-panel').style.display = 'none'
};

console.log('🔧 Onboarding Debug Tools Loaded');
console.log('💡 Use Ctrl+Shift+D to toggle debug panel');
console.log('💡 Use window.debugOnboarding for console commands');