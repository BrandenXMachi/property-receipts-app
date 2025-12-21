// App State
let appState = {
    isAuthenticated: false,
    currentProperty: null,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    summaryYear: new Date().getFullYear(),
    currentReceipt: null,
    mediaRecorder: null,
    audioChunks: [],
    calendarView: 'month', // 'month' or 'year'
    loginAttempts: 0,
    lockoutUntil: null
};

// Data Storage
const PASSWORD = 'Brandrew';
const MAX_LOGIN_ATTEMPTS = 7;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// IndexedDB Setup
const DB_NAME = 'PropertyReceiptsDB';
const DB_VERSION = 1;
const RECEIPTS_STORE = 'receipts';
let db = null;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create receipts object store if it doesn't exist
            if (!db.objectStoreNames.contains(RECEIPTS_STORE)) {
                const objectStore = db.createObjectStore(RECEIPTS_STORE, { keyPath: 'id' });
                objectStore.createIndex('property', 'property', { unique: false });
                objectStore.createIndex('date', 'date', { unique: false });
            }
        };
    });
}

// IndexedDB Helper Functions
async function saveReceiptToDB(receipt) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([RECEIPTS_STORE], 'readwrite');
        const store = transaction.objectStore(RECEIPTS_STORE);
        const request = store.put(receipt);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllReceiptsFromDB() {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([RECEIPTS_STORE], 'readonly');
        const store = transaction.objectStore(RECEIPTS_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteReceiptFromDB(id) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([RECEIPTS_STORE], 'readwrite');
        const store = transaction.objectStore(RECEIPTS_STORE);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Migrate data from localStorage to IndexedDB
async function migrateFromLocalStorage() {
    const oldData = localStorage.getItem('receipts');
    if (oldData) {
        try {
            const receipts = JSON.parse(oldData);
            for (const receipt of receipts) {
                await saveReceiptToDB(receipt);
            }
            // Clear localStorage after successful migration
            localStorage.removeItem('receipts');
            console.log('Successfully migrated', receipts.length, 'receipts to IndexedDB');
        } catch (error) {
            console.error('Error migrating data:', error);
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Initialize IndexedDB first
    try {
        await initDB();
        await migrateFromLocalStorage();
    } catch (error) {
        console.error('Error initializing database:', error);
    }
    
    // Check lockout status
    checkLockoutStatus();
    
    // Check if already authenticated
    const isAuth = sessionStorage.getItem('authenticated');
    if (isAuth === 'true') {
        appState.isAuthenticated = true;
        showScreen('homeScreen');
        await updatePropertyCounts();
    } else {
        showScreen('loginScreen');
    }

    // Set up event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login
    document.getElementById('loginButton').addEventListener('click', handleLogin);
    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Property cards
    document.querySelectorAll('.property-card').forEach(card => {
        card.addEventListener('click', () => {
            const property = card.dataset.property;
            openProperty(property);
        });
    });

    // Navigation
    document.getElementById('backButton').addEventListener('click', () => {
        showScreen('homeScreen');
        updatePropertyCounts();
    });

    document.getElementById('galleryBackButton').addEventListener('click', () => {
        showScreen('propertyScreen');
        updatePropertyDisplay();
    });

    // Tabs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            switchTab(button.dataset.tab);
        });
    });

    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        appState.currentMonth--;
        if (appState.currentMonth < 0) {
            appState.currentMonth = 11;
            appState.currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        appState.currentMonth++;
        if (appState.currentMonth > 11) {
            appState.currentMonth = 0;
            appState.currentYear++;
        }
        renderCalendar();
    });

    // Calendar view toggle
    document.getElementById('monthViewBtn').addEventListener('click', () => {
        switchCalendarView('month');
    });

    document.getElementById('yearViewBtn').addEventListener('click', () => {
        switchCalendarView('year');
    });

    // Year navigation in calendar view
    document.getElementById('prevYearCalendar').addEventListener('click', () => {
        appState.currentYear--;
        document.getElementById('currentYearCalendar').textContent = appState.currentYear;
        renderYearView();
    });

    document.getElementById('nextYearCalendar').addEventListener('click', () => {
        appState.currentYear++;
        document.getElementById('currentYearCalendar').textContent = appState.currentYear;
        renderYearView();
    });

    // Summary year navigation
    document.getElementById('prevYear').addEventListener('click', () => {
        appState.summaryYear--;
        renderSummary();
    });

    document.getElementById('nextYear').addEventListener('click', () => {
        appState.summaryYear++;
        renderSummary();
    });

    // Add receipt
    document.getElementById('addReceiptButton').addEventListener('click', openCamera);
    document.getElementById('cameraInput').addEventListener('change', handleImageCapture);

    // Modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('receiptModal').addEventListener('click', (e) => {
        if (e.target.id === 'receiptModal') closeModal();
    });

    // Receipt actions
    document.getElementById('saveReceipt').addEventListener('click', saveReceipt);
    document.getElementById('deleteReceipt').addEventListener('click', deleteReceipt);

    // Voice recording
    document.getElementById('recordVoiceButton').addEventListener('click', toggleVoiceRecording);

    // Category clicks
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;
            showCategoryReceipts(category);
        });
    });

    // Export
    document.getElementById('exportPDF').addEventListener('click', exportSummaryPDF);
    document.getElementById('exportReceipts').addEventListener('click', exportAllReceipts);
}

// Lockout Management
function checkLockoutStatus() {
    const lockoutData = localStorage.getItem('loginLockout');
    if (lockoutData) {
        const { attempts, lockoutUntil } = JSON.parse(lockoutData);
        appState.loginAttempts = attempts;
        appState.lockoutUntil = lockoutUntil;

        if (lockoutUntil && Date.now() < lockoutUntil) {
            // Still locked out
            disableLogin();
            startLockoutTimer();
        } else if (lockoutUntil && Date.now() >= lockoutUntil) {
            // Lockout expired
            clearLockout();
        }
    }
}

function disableLogin() {
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    
    passwordInput.disabled = true;
    loginButton.disabled = true;
}

function enableLogin() {
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    const lockoutMessage = document.getElementById('lockoutMessage');
    
    passwordInput.disabled = false;
    loginButton.disabled = false;
    lockoutMessage.style.display = 'none';
}

function startLockoutTimer() {
    const lockoutMessage = document.getElementById('lockoutMessage');
    lockoutMessage.style.display = 'block';

    const updateTimer = () => {
        const remainingMs = appState.lockoutUntil - Date.now();
        
        if (remainingMs <= 0) {
            clearLockout();
            return;
        }

        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        lockoutMessage.textContent = `Too many failed attempts. Please wait ${minutes}:${seconds.toString().padStart(2, '0')} before trying again.`;

        setTimeout(updateTimer, 1000);
    };

    updateTimer();
}

function clearLockout() {
    appState.loginAttempts = 0;
    appState.lockoutUntil = null;
    localStorage.removeItem('loginLockout');
    enableLogin();
}

function recordFailedAttempt() {
    appState.loginAttempts++;

    if (appState.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        // Lock out the user
        appState.lockoutUntil = Date.now() + LOCKOUT_DURATION;
        localStorage.setItem('loginLockout', JSON.stringify({
            attempts: appState.loginAttempts,
            lockoutUntil: appState.lockoutUntil
        }));
        disableLogin();
        startLockoutTimer();
    } else {
        // Just save the attempt count
        localStorage.setItem('loginLockout', JSON.stringify({
            attempts: appState.loginAttempts,
            lockoutUntil: null
        }));
    }
}

// Authentication
function handleLogin() {
    // Check if locked out
    if (appState.lockoutUntil && Date.now() < appState.lockoutUntil) {
        return;
    }

    const password = document.getElementById('passwordInput').value;
    const errorEl = document.getElementById('loginError');

    if (password === PASSWORD) {
        appState.isAuthenticated = true;
        sessionStorage.setItem('authenticated', 'true');
        errorEl.textContent = '';
        
        // Clear lockout on successful login
        clearLockout();
        
        // Add fade-out animation to login screen
        const loginScreen = document.getElementById('loginScreen');
        loginScreen.classList.add('fade-out');
        
        // Wait for animation to complete before switching screens
        setTimeout(() => {
            showScreen('homeScreen');
            updatePropertyCounts();
            loginScreen.classList.remove('fade-out');
            loginScreen.classList.add('hidden');
        }, 500);
    } else {
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - appState.loginAttempts - 1;
        if (remainingAttempts > 0) {
            errorEl.textContent = `Incorrect password. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`;
        } else {
            errorEl.textContent = 'Incorrect password.';
        }
        document.getElementById('passwordInput').value = '';
        recordFailedAttempt();
    }
}

function handleLogout() {
    appState.isAuthenticated = false;
    sessionStorage.removeItem('authenticated');
    document.getElementById('passwordInput').value = '';
    document.getElementById('loginError').textContent = '';
    showScreen('loginScreen');
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Property Management
function openProperty(property) {
    appState.currentProperty = property;
    document.getElementById('propertyTitle').textContent = 
        property === 'apartment' ? 'Block Apartment' :
        property === 'triplex' ? 'Triplex' : 'House';
    
    showScreen('propertyScreen');
    switchTab('calendar');
}

async function updatePropertyCounts() {
    const properties = ['apartment', 'triplex', 'house'];
    for (const property of properties) {
        const receipts = await getReceiptsByProperty(property);
        const card = document.querySelector(`[data-property="${property}"]`);
        const countEl = card.querySelector('.receipt-count');
        countEl.textContent = `${receipts.length} receipt${receipts.length !== 1 ? 's' : ''}`;
    }
}

// Tab Management
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const contentMap = {
        'calendar': 'calendarTab',
        'categories': 'categoriesTab',
        'summary': 'summaryTab'
    };

    document.getElementById(contentMap[tabName]).classList.add('active');

    // Render content based on tab
    if (tabName === 'calendar') {
        if (appState.calendarView === 'month') {
            renderCalendar();
        } else {
            renderYearView();
        }
    } else if (tabName === 'categories') {
        renderCategories();
    } else if (tabName === 'summary') {
        renderSummary();
    }
}

// Calendar View Toggle
function switchCalendarView(view) {
    appState.calendarView = view;
    
    // Update toggle buttons
    document.getElementById('monthViewBtn').classList.toggle('active', view === 'month');
    document.getElementById('yearViewBtn').classList.toggle('active', view === 'year');
    
    // Show/hide appropriate view
    if (view === 'month') {
        document.getElementById('calendarGrid').style.display = 'grid';
        document.getElementById('yearGrid').style.display = 'none';
        document.querySelector('.calendar-header').style.display = 'flex';
        document.getElementById('yearHeader').style.display = 'none';
        renderCalendar();
    } else {
        document.getElementById('calendarGrid').style.display = 'none';
        document.getElementById('yearGrid').style.display = 'grid';
        document.querySelector('.calendar-header').style.display = 'none';
        document.getElementById('yearHeader').style.display = 'flex';
        document.getElementById('currentYearCalendar').textContent = appState.currentYear;
        renderYearView();
    }
}

// Year View Rendering
function renderYearView() {
    const yearGrid = document.getElementById('yearGrid');
    yearGrid.innerHTML = '';
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const receipts = getReceiptsByProperty(appState.currentProperty);
    
    for (let month = 0; month < 12; month++) {
        const monthCard = document.createElement('div');
        monthCard.className = 'year-month';
        
        const monthName = document.createElement('div');
        monthName.className = 'year-month-name';
        monthName.textContent = monthNames[month];
        monthCard.appendChild(monthName);
        
        // Create mini calendar
        const miniCal = document.createElement('div');
        miniCal.className = 'year-mini-calendar';
        
        // Day headers
        const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'year-mini-day header';
            header.textContent = day;
            miniCal.appendChild(header);
        });
        
        // Get first day and number of days
        const firstDay = new Date(appState.currentYear, month, 1).getDay();
        const daysInMonth = new Date(appState.currentYear, month + 1, 0).getDate();
        const prevMonthDays = new Date(appState.currentYear, month, 0).getDate();
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = document.createElement('div');
            day.className = 'year-mini-day other-month';
            day.textContent = prevMonthDays - i;
            miniCal.appendChild(day);
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'year-mini-day';
            dayEl.textContent = day;
            
            // Check for receipts
            const dateStr = `${appState.currentYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasReceipts = receipts.some(r => r.date === dateStr);
            if (hasReceipts) {
                dayEl.classList.add('has-receipts');
            }
            
            miniCal.appendChild(dayEl);
        }
        
        // Next month days to fill grid
        const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
        const remainingCells = totalCells - (firstDay + daysInMonth);
        for (let i = 1; i <= remainingCells; i++) {
            const day = document.createElement('div');
            day.className = 'year-mini-day other-month';
            day.textContent = i;
            miniCal.appendChild(day);
        }
        
        monthCard.appendChild(miniCal);
        
        // Click handler to jump to month
        monthCard.addEventListener('click', () => {
            appState.currentMonth = month;
            switchCalendarView('month');
        });
        
        yearGrid.appendChild(monthCard);
    }
}

// Calendar Rendering
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = 
        `${monthNames[appState.currentMonth]} ${appState.currentYear}`;

    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day header';
        header.textContent = day;
        grid.appendChild(header);
    });

    // Get first day of month and number of days
    const firstDay = new Date(appState.currentYear, appState.currentMonth, 1).getDay();
    const daysInMonth = new Date(appState.currentYear, appState.currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(appState.currentYear, appState.currentMonth, 0).getDate();

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = prevMonthDays - i;
        grid.appendChild(day);
    }

    // Current month days
    const today = new Date();
    const receipts = getReceiptsByProperty(appState.currentProperty);

    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.textContent = i;

        // Check if today
        if (i === today.getDate() && 
            appState.currentMonth === today.getMonth() && 
            appState.currentYear === today.getFullYear()) {
            day.classList.add('today');
        }

        // Check for receipts on this day
        const dateStr = `${appState.currentYear}-${String(appState.currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayReceipts = receipts.filter(r => r.date === dateStr);
        if (dayReceipts.length > 0) {
            day.classList.add('has-receipts');
        }

        // Click handler
        day.addEventListener('click', () => {
            if (dayReceipts.length > 0) {
                showReceiptGallery(dateStr);
            }
        });

        grid.appendChild(day);
    }

    // Next month days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    for (let i = 1; i <= remainingCells; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = i;
        grid.appendChild(day);
    }
}

// Categories Rendering
function renderCategories() {
    const receipts = getReceiptsByProperty(appState.currentProperty);
    const categoryCounts = {};

    // Count receipts per category
    receipts.forEach(receipt => {
        const category = receipt.category || 'other';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Update category counts
    document.querySelectorAll('.category-item').forEach(item => {
        const category = item.dataset.category;
        const count = categoryCounts[category] || 0;
        item.querySelector('.category-count').textContent = count;
    });
}

// Summary Rendering
function renderSummary() {
    document.getElementById('currentYear').textContent = appState.summaryYear;
    
    const receipts = getReceiptsByProperty(appState.currentProperty).filter(r => {
        return new Date(r.date).getFullYear() === appState.summaryYear;
    });

    const statsContainer = document.getElementById('summaryStats');
    statsContainer.innerHTML = '';

    // Calculate totals by category
    const categoryTotals = {};
    let grandTotal = 0;

    receipts.forEach(receipt => {
        const category = receipt.category || 'other';
        const amount = parseFloat(receipt.amount) || 0;
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        grandTotal += amount;
    });

    // Category icons
    const categoryIcons = {
        'maintenance': '🔧',
        'utilities': '💡',
        'insurance': '🛡️',
        'property-tax': '🏛️',
        'landscaping': '🌿',
        'management': '📋',
        'improvements': '🏗️',
        'other': '📄'
    };

    const categoryNames = {
        'maintenance': 'Maintenance & Repairs',
        'utilities': 'Utilities',
        'insurance': 'Insurance',
        'property-tax': 'Property Tax',
        'landscaping': 'Landscaping',
        'management': 'Management Fees',
        'improvements': 'Improvements',
        'other': 'Other'
    };

    // Display category totals
    Object.keys(categoryTotals).forEach(category => {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        statItem.innerHTML = `
            <div class="stat-label">
                <span>${categoryIcons[category]}</span>
                <span>${categoryNames[category]}</span>
            </div>
            <div class="stat-value">$${categoryTotals[category].toFixed(2)}</div>
        `;
        statsContainer.appendChild(statItem);
    });

    // Grand total
    const totalItem = document.createElement('div');
    totalItem.className = 'stat-item';
    totalItem.innerHTML = `
        <div class="stat-label" style="font-weight: 600;">Total Expenses</div>
        <div class="stat-value stat-total">$${grandTotal.toFixed(2)}</div>
    `;
    statsContainer.appendChild(totalItem);

    // Receipt count
    const countItem = document.createElement('div');
    countItem.className = 'stat-item';
    countItem.innerHTML = `
        <div class="stat-label">Total Receipts</div>
        <div class="stat-value">${receipts.length}</div>
    `;
    statsContainer.appendChild(countItem);
}

// Camera and Image Handling
function openCamera() {
    document.getElementById('cameraInput').click();
}

// Compress image to reduce storage size
function compressImage(file, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                // Create canvas and compress
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to compressed JPEG
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function handleImageCapture(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Compress image before storing
    compressImage(file, 1200, 0.7)
        .then(compressedImage => {
            // Create new receipt with compressed image
            const receipt = {
                id: Date.now().toString(),
                property: appState.currentProperty,
                image: compressedImage,
                date: new Date().toISOString().split('T')[0],
                amount: '',
                category: 'other',
                note: '',
                voiceNote: null
            };

            appState.currentReceipt = receipt;
            showReceiptModal(receipt);
        })
        .catch(error => {
            console.error('Error compressing image:', error);
            alert('Error processing image. Please try again.');
        });

    // Reset input
    event.target.value = '';
}

// Receipt Gallery
function showReceiptGallery(dateStr) {
    const receipts = getReceiptsByProperty(appState.currentProperty)
        .filter(r => r.date === dateStr);

    document.getElementById('galleryDate').textContent = 
        new Date(dateStr).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

    const grid = document.getElementById('receiptGrid');
    grid.innerHTML = '';

    if (receipts.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>No receipts for this date</p></div>';
        showScreen('galleryScreen');
        return;
    }

    receipts.forEach(receipt => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'receipt-thumbnail';
        
        let html = `<img src="${receipt.image}" alt="Receipt">`;
        
        if (receipt.voiceNote) {
            html += `
                <div class="voice-indicator">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 1C6.89543 1 6 1.89543 6 3V8C6 9.10457 6.89543 10 8 10C9.10457 10 10 9.10457 10 8V3C10 1.89543 9.10457 1 8 1Z"/>
                        <path d="M13 8C13 10.7614 10.7614 13 8 13C5.23858 13 3 10.7614 3 8"/>
                    </svg>
                </div>
            `;
        }

        if (receipt.amount) {
            html += `<div class="receipt-info">$${parseFloat(receipt.amount).toFixed(2)}</div>`;
        }

        thumbnail.innerHTML = html;
        thumbnail.addEventListener('click', () => {
            appState.currentReceipt = receipt;
            showReceiptModal(receipt);
        });

        grid.appendChild(thumbnail);
    });

    showScreen('galleryScreen');
}

function showCategoryReceipts(category) {
    const receipts = getReceiptsByProperty(appState.currentProperty)
        .filter(r => (r.category || 'other') === category);

    if (receipts.length === 0) return;

    // Group by date
    const byDate = {};
    receipts.forEach(receipt => {
        if (!byDate[receipt.date]) {
            byDate[receipt.date] = [];
        }
        byDate[receipt.date].push(receipt);
    });

    // Show most recent date
    const dates = Object.keys(byDate).sort().reverse();
    if (dates.length > 0) {
        showReceiptGallery(dates[0]);
    }
}

// Receipt Modal
function showReceiptModal(receipt) {
    document.getElementById('receiptImage').src = receipt.image;
    document.getElementById('receiptDate').value = receipt.date;
    document.getElementById('receiptAmount').value = receipt.amount;
    document.getElementById('receiptCategory').value = receipt.category || 'other';
    document.getElementById('receiptNote').value = receipt.note || '';

    // Voice note
    const voicePlayback = document.getElementById('voicePlayback');
    if (receipt.voiceNote) {
        voicePlayback.src = receipt.voiceNote;
        voicePlayback.style.display = 'block';
    } else {
        voicePlayback.style.display = 'none';
        voicePlayback.src = '';
    }

    document.getElementById('receiptModal').classList.add('active');
}

function closeModal() {
    document.getElementById('receiptModal').classList.remove('active');
    appState.currentReceipt = null;
    
    // Stop any recording
    if (appState.mediaRecorder && appState.mediaRecorder.state === 'recording') {
        appState.mediaRecorder.stop();
    }
}

async function saveReceipt() {
    if (!appState.currentReceipt) return;

    const receipt = appState.currentReceipt;
    receipt.date = document.getElementById('receiptDate').value;
    receipt.amount = document.getElementById('receiptAmount').value;
    receipt.category = document.getElementById('receiptCategory').value;
    receipt.note = document.getElementById('receiptNote').value;

    try {
        // Save to IndexedDB
        await saveReceiptToDB(receipt);
        closeModal();
        await updatePropertyDisplay();
    } catch (error) {
        console.error('Error saving receipt:', error);
        alert('Error saving receipt. Please try again.');
    }
}

async function deleteReceipt() {
    if (!appState.currentReceipt) return;

    if (confirm('Are you sure you want to delete this receipt?')) {
        try {
            await deleteReceiptFromDB(appState.currentReceipt.id);
            closeModal();
            
            // Refresh current view
            const currentScreen = document.querySelector('.screen.active').id;
            if (currentScreen === 'galleryScreen') {
                // Go back to property screen
                showScreen('propertyScreen');
                await updatePropertyDisplay();
            } else {
                await updatePropertyDisplay();
            }
        } catch (error) {
            console.error('Error deleting receipt:', error);
            alert('Error deleting receipt. Please try again.');
        }
    }
}

async function updatePropertyDisplay() {
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
        await switchTab(activeTab.dataset.tab);
    }
}

// Voice Recording
async function toggleVoiceRecording() {
    const button = document.getElementById('recordVoiceButton');
    const buttonText = document.getElementById('recordButtonText');

    if (!appState.mediaRecorder || appState.mediaRecorder.state === 'inactive') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            appState.mediaRecorder = new MediaRecorder(stream);
            appState.audioChunks = [];

            appState.mediaRecorder.ondataavailable = (event) => {
                appState.audioChunks.push(event.data);
            };

            appState.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(appState.audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Convert to base64 for storage
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (appState.currentReceipt) {
                        appState.currentReceipt.voiceNote = reader.result;
                        document.getElementById('voicePlayback').src = reader.result;
                        document.getElementById('voicePlayback').style.display = 'block';
                    }
                };
                reader.readAsDataURL(audioBlob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            appState.mediaRecorder.start();
            button.classList.add('recording');
            buttonText.textContent = 'Stop Recording';
        } catch (error) {
            alert('Could not access microphone. Please grant permission and try again.');
        }
    } else {
        appState.mediaRecorder.stop();
        button.classList.remove('recording');
        buttonText.textContent = 'Record';
    }
}

// Data Management
async function getAllReceipts() {
    try {
        return await getAllReceiptsFromDB();
    } catch (error) {
        console.error('Error getting receipts:', error);
        return [];
    }
}

async function getReceiptsByProperty(property) {
    const allReceipts = await getAllReceipts();
    return allReceipts.filter(r => r.property === property);
}

// Export Functions
function exportSummaryPDF() {
    const receipts = getReceiptsByProperty(appState.currentProperty).filter(r => {
        return new Date(r.date).getFullYear() === appState.summaryYear;
    });

    const propertyName = 
        appState.currentProperty === 'apartment' ? 'Block Apartment' :
        appState.currentProperty === 'triplex' ? 'Triplex' : 'House';

    let csvContent = `Property Receipt Summary\n`;
    csvContent += `Property: ${propertyName}\n`;
    csvContent += `Year: ${appState.summaryYear}\n\n`;
    csvContent += `Date,Category,Amount,Note\n`;

    receipts.forEach(receipt => {
        const category = receipt.category || 'other';
        const amount = receipt.amount || '0.00';
        const note = (receipt.note || '').replace(/,/g, ';');
        csvContent += `${receipt.date},${category},$${amount},${note}\n`;
    });

    // Calculate totals
    const categoryTotals = {};
    let total = 0;
    receipts.forEach(receipt => {
        const category = receipt.category || 'other';
        const amount = parseFloat(receipt.amount) || 0;
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        total += amount;
    });

    csvContent += `\nCategory Totals:\n`;
    Object.keys(categoryTotals).forEach(category => {
        csvContent += `${category},$${categoryTotals[category].toFixed(2)}\n`;
    });
    csvContent += `\nGrand Total,$${total.toFixed(2)}\n`;
    csvContent += `Total Receipts,${receipts.length}\n`;

    downloadFile(csvContent, `${propertyName}_Summary_${appState.summaryYear}.csv`, 'text/csv');
}

function exportAllReceipts() {
    const receipts = getReceiptsByProperty(appState.currentProperty).filter(r => {
        return new Date(r.date).getFullYear() === appState.summaryYear;
    });

    if (receipts.length === 0) {
        alert('No receipts to export for this year.');
        return;
    }

    alert(`Exporting ${receipts.length} receipt images. Each will download separately.`);

    receipts.forEach((receipt, index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = receipt.image;
            link.download = `receipt_${receipt.date}_${index + 1}.jpg`;
            link.click();
        }, index * 500); // Stagger downloads
    });
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
