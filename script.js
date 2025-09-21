// Smart Community Health Map - Pure JavaScript Implementation
// All functionality for interactive health monitoring dashboard

class HealthMapApp {
    constructor() {
        this.regions = [
            {
                id: 'downtown',
                name: 'Downtown District',
                status: 'secure',
                healthData: {
                    clinics: 8,
                    hospitals: 2,
                    population: 45000,
                    issues: ['Air quality monitoring needed'],
                    lastUpdate: '2024-01-15'
                },
                recentReports: 2,
                coordinates: 'M100,150 L200,120 L280,180 L200,240 L120,220 Z',
                textPosition: { x: 160, y: 190 }
            },
            {
                id: 'northside',
                name: 'Northside',
                status: 'moderate',
                healthData: {
                    clinics: 4,
                    hospitals: 1,
                    population: 32000,
                    issues: ['Limited clinic access', 'Water quality concerns'],
                    lastUpdate: '2024-01-14'
                },
                recentReports: 5,
                coordinates: 'M200,50 L350,40 L380,120 L280,180 L200,120 Z',
                textPosition: { x: 290, y: 90 }
            },
            {
                id: 'eastward',
                name: 'Eastward',
                status: 'danger',
                healthData: {
                    clinics: 2,
                    hospitals: 0,
                    population: 28000,
                    issues: ['No nearby hospitals', 'Contaminated water source', 'High pollution levels'],
                    lastUpdate: '2024-01-13'
                },
                recentReports: 12,
                coordinates: 'M380,120 L480,100 L520,180 L450,250 L350,240 L280,180 Z',
                textPosition: { x: 400, y: 180 }
            },
            {
                id: 'westside',
                name: 'Westside',
                status: 'secure',
                healthData: {
                    clinics: 6,
                    hospitals: 1,
                    population: 38000,
                    issues: [],
                    lastUpdate: '2024-01-15'
                },
                recentReports: 1,
                coordinates: 'M50,180 L100,150 L120,220 L200,240 L150,320 L70,300 Z',
                textPosition: { x: 110, y: 240 }
            },
            {
                id: 'southend',
                name: 'South End',
                status: 'moderate',
                healthData: {
                    clinics: 3,
                    hospitals: 1,
                    population: 25000,
                    issues: ['Elderly care shortage', 'Mental health resources needed'],
                    lastUpdate: '2024-01-14'
                },
                recentReports: 7,
                coordinates: 'M150,320 L200,240 L280,180 L350,240 L450,250 L400,350 L200,360 Z',
                textPosition: { x: 275, y: 300 }
            }
        ];

        this.selectedRegion = null;
        this.isAdminMode = false;
        this.tooltip = null;

        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.renderMap();
        this.updateStats();
        this.populateReportForm();
    }

    loadFromLocalStorage() {
        const savedRegions = localStorage.getItem('healthMapRegions');
        if (savedRegions) {
            this.regions = JSON.parse(savedRegions);
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('healthMapRegions', JSON.stringify(this.regions));
    }

    setupEventListeners() {
        // Report button
        document.getElementById('reportBtn').addEventListener('click', () => {
            this.showReportModal();
        });

        // Admin button
        document.getElementById('adminBtn').addEventListener('click', () => {
            if (!this.isAdminMode) {
                this.showAdminModal();
            } else {
                this.toggleAdminControls();
            }
        });

        // Report modal
        document.getElementById('closeReportModal').addEventListener('click', () => {
            this.hideReportModal();
        });

        document.getElementById('cancelReport').addEventListener('click', () => {
            this.hideReportModal();
        });

        document.getElementById('reportForm').addEventListener('submit', (e) => {
            this.handleReportSubmit(e);
        });

        // Report description character count
        document.getElementById('reportDescription').addEventListener('input', (e) => {
            this.updateCharCount(e.target.value);
        });

        // Admin modal
        document.getElementById('cancelAdmin').addEventListener('click', () => {
            this.hideAdminModal();
        });

        document.getElementById('adminForm').addEventListener('submit', (e) => {
            this.handleAdminLogin(e);
        });

        // Admin logout
        document.getElementById('logoutAdmin').addEventListener('click', () => {
            this.logout();
        });

        // Close modals on backdrop click
        document.getElementById('reportModal').addEventListener('click', (e) => {
            if (e.target.id === 'reportModal') {
                this.hideReportModal();
            }
        });

        document.getElementById('adminModal').addEventListener('click', (e) => {
            if (e.target.id === 'adminModal') {
                this.hideAdminModal();
            }
        });
    }

    renderMap() {
        const mapSvg = document.getElementById('healthMap');
        mapSvg.innerHTML = '';

        this.regions.forEach(region => {
            // Create region path
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', region.coordinates);
            path.setAttribute('class', `map-region ${region.status} ${region.recentReports > 8 ? `pulse-${region.status}` : ''}`);
            path.setAttribute('data-region-id', region.id);

            // Add event listeners
            path.addEventListener('mouseenter', (e) => this.showTooltip(e, region));
            path.addEventListener('mouseleave', () => this.hideTooltip());
            path.addEventListener('click', () => this.selectRegion(region));

            // Create region text
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', region.textPosition.x);
            text.setAttribute('y', region.textPosition.y);
            text.setAttribute('class', 'region-text');
            text.textContent = region.name;

            mapSvg.appendChild(path);
            mapSvg.appendChild(text);
        });
    }

    showTooltip(event, region) {
        const tooltip = document.getElementById('tooltip');
        const rect = event.currentTarget.getBoundingClientRect();
        const mapRect = document.getElementById('healthMap').getBoundingClientRect();
        
        const x = event.clientX - mapRect.left + 10;
        const y = event.clientY - mapRect.top - 10;

        tooltip.innerHTML = this.getTooltipContent(region);
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        tooltip.style.display = 'block';
    }

    hideTooltip() {
        document.getElementById('tooltip').style.display = 'none';
    }

    getTooltipContent(region) {
        const issuesText = region.healthData.issues.length > 0 
            ? region.healthData.issues.slice(0, 2).join(', ') + (region.healthData.issues.length > 2 ? '...' : '')
            : '';

        return `
            <div class="tooltip-title">
                <h4>${region.name}</h4>
                <span class="status-badge ${region.status}">${region.status.charAt(0).toUpperCase() + region.status.slice(1)}</span>
            </div>
            
            <div class="tooltip-stats">
                <div class="tooltip-stat">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 21h18"/>
                        <path d="m5 21 7-7"/>
                        <path d="m9 21 7-7"/>
                        <path d="m13 21 7-7"/>
                        <path d="m17 21 7-7"/>
                    </svg>
                    <span>Clinics:</span>
                    <strong>${region.healthData.clinics}</strong>
                </div>
                
                <div class="tooltip-stat">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 21h18"/>
                        <path d="m5 21 7-7"/>
                        <path d="m9 21 7-7"/>
                        <path d="m13 21 7-7"/>
                        <path d="m17 21 7-7"/>
                    </svg>
                    <span>Hospitals:</span>
                    <strong>${region.healthData.hospitals}</strong>
                </div>
                
                <div class="tooltip-stat" style="grid-column: span 2;">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="m22 21-3-3 3-3"/>
                    </svg>
                    <span>Population:</span>
                    <strong>${region.healthData.population.toLocaleString()}</strong>
                </div>
            </div>
            
            ${region.healthData.issues.length > 0 ? `
                <div class="tooltip-issues">
                    <p>Recent Issues:</p>
                    <div class="issues-list">${issuesText}</div>
                </div>
            ` : ''}
            
            <div class="tooltip-footer">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                </svg>
                <span>Last updated: ${region.healthData.lastUpdate}</span>
            </div>
            
            ${region.recentReports > 0 ? `
                <div class="tooltip-reports">
                    ${region.recentReports} recent reports
                </div>
            ` : ''}
        `;
    }

    selectRegion(region) {
        this.selectedRegion = region;
        this.hideTooltip();
        this.showRegionDetails();
    }

    showRegionDetails() {
        const defaultDetails = document.getElementById('defaultDetails');
        const regionDetails = document.getElementById('regionDetails');
        
        defaultDetails.style.display = 'none';
        regionDetails.style.display = 'block';
        
        regionDetails.innerHTML = this.getRegionDetailsContent(this.selectedRegion);
        
        // Add close button listener
        document.querySelector('.close-btn').addEventListener('click', () => {
            this.closeRegionDetails();
        });
    }

    closeRegionDetails() {
        document.getElementById('defaultDetails').style.display = 'block';
        document.getElementById('regionDetails').style.display = 'none';
        this.selectedRegion = null;
    }

    getRegionDetailsContent(region) {
        const getStatusIcon = (status) => {
            switch (status) {
                case 'secure':
                    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>';
                case 'moderate':
                case 'danger':
                    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="m12 17 .01 0"/></svg>';
                default:
                    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="m12 17 .01 0"/></svg>';
            }
        };

        const getHealthcareRatio = () => {
            const totalFacilities = region.healthData.clinics + region.healthData.hospitals;
            return Math.round(region.healthData.population / totalFacilities);
        };

        const getStatusMessage = () => {
            switch (region.status) {
                case 'secure':
                    return {
                        title: 'Area is secure and well-serviced',
                        description: 'Good healthcare coverage and low risk factors'
                    };
                case 'moderate':
                    return {
                        title: 'Some health concerns require attention',
                        description: 'Limited resources or emerging health concerns'
                    };
                case 'danger':
                    return {
                        title: 'Immediate attention needed - critical health issues',
                        description: 'Insufficient healthcare access or severe health risks'
                    };
                default:
                    return {
                        title: 'Status unknown',
                        description: 'Unable to determine current health status'
                    };
            }
        };

        const statusMessage = getStatusMessage();

        return `
            <div class="region-header">
                <div class="region-header-top">
                    <h3 class="region-title">${region.name}</h3>
                    <button class="close-btn">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m18 6-12 12"/>
                            <path d="m6 6 12 12"/>
                        </svg>
                    </button>
                </div>
                
                <div class="region-status ${region.status}">
                    ${getStatusIcon(region.status)}
                    <span>${region.status.charAt(0).toUpperCase() + region.status.slice(1)} Status</span>
                </div>
            </div>

            <div class="region-content">
                <div class="section">
                    <h4>
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="m22 21-3-3 3-3"/>
                        </svg>
                        <span>Population Overview</span>
                    </h4>
                    
                    <div class="info-grid">
                        <div class="info-card">
                            <div class="value">${region.healthData.population.toLocaleString()}</div>
                            <div class="label">Total Population</div>
                        </div>
                        
                        <div class="info-card">
                            <div class="value">${getHealthcareRatio()}</div>
                            <div class="label">People per facility</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h4>
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 21h18"/>
                            <path d="m5 21 7-7"/>
                            <path d="m9 21 7-7"/>
                            <path d="m13 21 7-7"/>
                            <path d="m17 21 7-7"/>
                        </svg>
                        <span>Healthcare Infrastructure</span>
                    </h4>
                    
                    <div class="facility-list">
                        <div class="facility-item">
                            <span>Hospitals</span>
                            <strong>${region.healthData.hospitals}</strong>
                        </div>
                        
                        <div class="facility-item">
                            <span>Clinics</span>
                            <strong>${region.healthData.clinics}</strong>
                        </div>
                        
                        <div class="facility-item">
                            <span>Total Facilities</span>
                            <strong>${region.healthData.hospitals + region.healthData.clinics}</strong>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h4>
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                            <path d="M12 9v4"/>
                            <path d="m12 17 .01 0"/>
                        </svg>
                        <span>Health Concerns</span>
                    </h4>
                    
                    ${region.healthData.issues.length > 0 ? `
                        <div class="issues-list">
                            ${region.healthData.issues.map(issue => `
                                <div class="issue-item">${issue}</div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="no-issues">No active health concerns reported</div>
                    `}
                </div>

                <div class="section">
                    <h4>
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m3 17 6-6 4 4 8-8"/>
                            <path d="m14 7 7 0 0 7"/>
                        </svg>
                        <span>Recent Activity</span>
                    </h4>
                    
                    <div class="facility-list">
                        <div class="facility-item">
                            <span>Reports this week</span>
                            <strong style="color: ${region.recentReports > 5 ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'}">${region.recentReports}</strong>
                        </div>
                        
                        <div class="facility-item">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12,6 12,12 16,14"/>
                                </svg>
                                <span>Last Updated</span>
                            </div>
                            <strong>${region.healthData.lastUpdate}</strong>
                        </div>
                    </div>
                </div>

                <div class="status-indicator ${region.status}">
                    <div class="status-message">
                        ${getStatusIcon(region.status)}
                        <div>
                            <div class="status-text ${region.status}">
                                <h5>${statusMessage.title}</h5>
                            </div>
                            <div class="status-description">${statusMessage.description}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateStats() {
        const secureCount = this.regions.filter(r => r.status === 'secure').length;
        const moderateCount = this.regions.filter(r => r.status === 'moderate').length;
        const dangerCount = this.regions.filter(r => r.status === 'danger').length;
        const totalPopulation = this.regions.reduce((sum, r) => sum + r.healthData.population, 0);

        document.getElementById('secureCount').textContent = secureCount;
        document.getElementById('moderateCount').textContent = moderateCount;
        document.getElementById('dangerCount').textContent = dangerCount;
        document.getElementById('totalPopulation').textContent = totalPopulation.toLocaleString();
    }

    populateReportForm() {
        const select = document.getElementById('reportRegion');
        select.innerHTML = '<option value="">Choose a region...</option>';
        
        this.regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region.id;
            option.textContent = region.name;
            select.appendChild(option);
        });
    }

    showReportModal() {
        document.getElementById('reportModal').style.display = 'flex';
        document.getElementById('reportForm').reset();
        this.updateCharCount('');
    }

    hideReportModal() {
        document.getElementById('reportModal').style.display = 'none';
    }

    updateCharCount(text) {
        document.getElementById('charCount').textContent = `${text.length}/500 characters`;
    }

    handleReportSubmit(e) {
        e.preventDefault();
        
        const regionId = document.getElementById('reportRegion').value;
        const reportType = document.getElementById('reportType').value;
        const description = document.getElementById('reportDescription').value;

        if (regionId && reportType && description.trim()) {
            this.submitReport(regionId, reportType, description.trim());
            this.hideReportModal();
        }
    }

    submitReport(regionId, reportType, description) {
        this.regions = this.regions.map(region => {
            if (region.id === regionId) {
                const updatedRegion = { ...region };
                updatedRegion.recentReports += 1;
                updatedRegion.healthData.issues.push(`${reportType}: ${description}`);
                updatedRegion.healthData.lastUpdate = new Date().toISOString().split('T')[0];
                
                // Auto-adjust status based on reports
                if (updatedRegion.recentReports > 10) {
                    updatedRegion.status = 'danger';
                } else if (updatedRegion.recentReports > 5) {
                    updatedRegion.status = 'moderate';
                }
                
                return updatedRegion;
            }
            return region;
        });

        this.saveToLocalStorage();
        this.renderMap();
        this.updateStats();
        
        // Update region details if currently shown
        if (this.selectedRegion && this.selectedRegion.id === regionId) {
            this.selectedRegion = this.regions.find(r => r.id === regionId);
            this.showRegionDetails();
        }
    }

    showAdminModal() {
        document.getElementById('adminModal').style.display = 'flex';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }

    hideAdminModal() {
        document.getElementById('adminModal').style.display = 'none';
    }

    handleAdminLogin(e) {
        e.preventDefault();
        
        const password = document.getElementById('adminPassword').value;
        const ADMIN_PASSWORD = 'admin123'; // In real app, this would be properly secured

        if (password === ADMIN_PASSWORD) {
            this.isAdminMode = true;
            this.hideAdminModal();
            this.updateAdminButton();
            this.showAdminControls();
        } else {
            alert('Incorrect password');
            document.getElementById('adminPassword').value = '';
        }
    }

    updateAdminButton() {
        const adminBtn = document.getElementById('adminBtn');
        if (this.isAdminMode) {
            adminBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6"/>
                    <path d="m5.64 7 1.41 1.41M18.36 7l-1.41 1.41M5.64 17l1.41-1.41M18.36 17l-1.41-1.41M1 12h6m6 0h6"/>
                </svg>
                <span>Admin Controls</span>
            `;
            adminBtn.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
            adminBtn.style.borderColor = 'hsl(var(--primary) / 0.2)';
        } else {
            adminBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="m7 11 0-5a5 5 0 0 1 10 0v5"/>
                </svg>
                <span>Admin Mode</span>
            `;
            adminBtn.style.backgroundColor = '';
            adminBtn.style.borderColor = '';
        }
    }

    toggleAdminControls() {
        const adminControls = document.getElementById('adminControls');
        const isVisible = adminControls.style.display === 'block';
        
        if (isVisible) {
            adminControls.style.display = 'none';
        } else {
            this.showAdminControls();
        }
    }

    showAdminControls() {
        const adminControls = document.getElementById('adminControls');
        const regionControls = document.getElementById('regionControls');
        
        adminControls.style.display = 'block';
        
        regionControls.innerHTML = this.regions.map(region => `
            <div class="region-control">
                <div class="region-control-header">
                    <span class="region-control-name">${region.name}</span>
                    <div class="region-control-status">
                        ${this.getStatusIcon(region.status)}
                        <span>${this.getStatusLabel(region.status)}</span>
                    </div>
                </div>
                
                <div class="status-buttons">
                    <button class="status-btn secure ${region.status === 'secure' ? 'active' : ''}" 
                            data-region="${region.id}" data-status="secure">
                        Secure
                    </button>
                    <button class="status-btn moderate ${region.status === 'moderate' ? 'active' : ''}" 
                            data-region="${region.id}" data-status="moderate">
                        Moderate
                    </button>
                    <button class="status-btn danger ${region.status === 'danger' ? 'active' : ''}" 
                            data-region="${region.id}" data-status="danger">
                        Danger
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to status buttons
        regionControls.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const regionId = e.target.dataset.region;
                const newStatus = e.target.dataset.status;
                this.updateRegionStatus(regionId, newStatus);
            });
        });
    }

    getStatusIcon(status) {
        switch (status) {
            case 'secure':
                return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>';
            case 'moderate':
            case 'danger':
                return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="m12 17 .01 0"/></svg>';
            default:
                return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>';
        }
    }

    getStatusLabel(status) {
        switch (status) {
            case 'secure': return 'Secure';
            case 'moderate': return 'Moderate Risk';
            case 'danger': return 'High Risk';
            default: return 'Unknown';
        }
    }

    updateRegionStatus(regionId, newStatus) {
        this.regions = this.regions.map(region => 
            region.id === regionId 
                ? { 
                    ...region, 
                    status: newStatus, 
                    healthData: { 
                        ...region.healthData, 
                        lastUpdate: new Date().toISOString().split('T')[0] 
                    } 
                }
                : region
        );

        this.saveToLocalStorage();
        this.renderMap();
        this.updateStats();
        this.showAdminControls(); // Refresh admin controls
        
        // Update region details if currently shown
        if (this.selectedRegion && this.selectedRegion.id === regionId) {
            this.selectedRegion = this.regions.find(r => r.id === regionId);
            this.showRegionDetails();
        }
    }

    logout() {
        this.isAdminMode = false;
        this.updateAdminButton();
        document.getElementById('adminControls').style.display = 'none';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HealthMapApp();
});

<script>
document.addEventListener("DOMContentLoaded", () => {
    const scrollElements = document.querySelectorAll(".scroll-reveal");

    const elementInView = (el, offset = 0) => {
        const elementTop = el.getBoundingClientRect().top;
        return elementTop <= (window.innerHeight || document.documentElement.clientHeight) - offset;
    };

    const displayScrollElement = (element, delay = 0) => {
        setTimeout(() => {
            element.classList.add("active");
        }, delay);
    };

    const hideScrollElement = (element) => {
        element.classList.remove("active");
    };

    const handleScrollAnimation = () => {
        scrollElements.forEach((el, index) => {
            if (elementInView(el, 100)) {
                // Stagger delay for child elements
                const delay = el.classList.contains('staggered') ? index * 150 : 0;
                displayScrollElement(el, delay);
            } else {
                hideScrollElement(el);
            }
        });
    };

    window.addEventListener("scroll", handleScrollAnimation);
    handleScrollAnimation(); // trigger on load
});
