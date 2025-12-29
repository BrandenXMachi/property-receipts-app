// App State
let appState = {
    isAuthenticated: false,
    currentProperty: null,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    summaryYear: new Date().getFullYear(),
    currentReceipt: null,
    currentImageIndex: 0,
    mediaRecorder: null,
    audioChunks: [],
    calendarView: 'month', // 'month' or 'year'
    loginAttempts: 0,
    lockoutUntil: null
};

// Constants
const MAX_PHOTOS_PER_RECEIPT = 10;

// Data Storage
const PASSWORD = 'brandrew';
const MAX_LOGIN_ATTEMPTS = 7;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Supabase Setup
const SUPABASE_URL = 'https://msquxcujurktuhtvfcju.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcXV4Y3VqdXJrdHVodHZmY2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyODY3NTAsImV4cCI6MjA4MTg2Mjc1MH0.QLACY3YIgsl67RLIgZeElB8In7zBTpKrGFk_W_nMWUA';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// IndexedDB Setup (keeping for local migration)
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
    
    // Begin button - navigate to home screen
    document.getElementById('beginButton').addEventListener('click', () => {
        showScreen('homeScreen');
        updatePropertyCounts();
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
    document.getElementById('fileInput').addEventListener('change', handleImageCapture);

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

    // Image carousel navigation
    document.getElementById('prevImage').addEventListener('click', showPreviousImage);
    document.getElementById('nextImage').addEventListener('click', showNextImage);
    
    // Add another photo button
    document.getElementById('addAnotherPhoto').addEventListener('click', addAnotherPhoto);
    
    // Photo source modal
    document.getElementById('useCameraBtn').addEventListener('click', () => {
        closePhotoSourceModal();
        document.getElementById('cameraInput').click();
    });
    
    document.getElementById('uploadFileBtn').addEventListener('click', () => {
        closePhotoSourceModal();
        document.getElementById('fileInput').click();
    });
    
    document.getElementById('cancelPhotoSourceBtn').addEventListener('click', closePhotoSourceModal);
    
    document.getElementById('photoSourceModal').addEventListener('click', (e) => {
        if (e.target.id === 'photoSourceModal') closePhotoSourceModal();
    });
    
    // Gallery + button
    document.getElementById('addReceiptToDateButton').addEventListener('click', addReceiptToCurrentDate);
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
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    const beginButton = document.getElementById('beginButton');

    if (password === PASSWORD) {
        appState.isAuthenticated = true;
        sessionStorage.setItem('authenticated', 'true');
        errorEl.textContent = '';
        
        // Clear lockout on successful login
        clearLockout();
        
        // Hide password input and login button with fade-out animation
        passwordInput.classList.add('fade-out');
        loginButton.classList.add('fade-out');
        
        // After fade-out completes, hide them and show Begin button
        setTimeout(() => {
            passwordInput.classList.add('hidden');
            loginButton.classList.add('hidden');
            
            // Show Begin button with fade-in animation
            beginButton.classList.remove('hidden');
            beginButton.classList.add('fade-in');
        }, 400); // Match the fade-out animation duration
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
async function renderYearView() {
    const yearGrid = document.getElementById('yearGrid');
    yearGrid.innerHTML = '';
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const receipts = await getReceiptsByProperty(appState.currentProperty);
    
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
async function renderCalendar() {
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
    const receipts = await getReceiptsByProperty(appState.currentProperty);

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
async function renderCategories() {
    const receipts = await getReceiptsByProperty(appState.currentProperty);
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
async function renderSummary() {
    document.getElementById('currentYear').textContent = appState.summaryYear;
    
    const allReceipts = await getReceiptsByProperty(appState.currentProperty);
    const receipts = allReceipts.filter(r => {
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
let currentGalleryDate = null; // Track the current date when in gallery view

function openCamera() {
    // Show photo source choice modal
    document.getElementById('photoSourceModal').classList.add('active');
}

function closePhotoSourceModal() {
    document.getElementById('photoSourceModal').classList.remove('active');
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
            // Create new receipt with compressed image array
            const receipt = {
                id: Date.now().toString(),
                property: appState.currentProperty,
                images: [compressedImage], // Array of images
                date: new Date().toISOString().split('T')[0],
                amount: '',
                category: 'other',
                note: '',
                voiceNote: null
            };

            appState.currentReceipt = receipt;
            appState.currentImageIndex = 0;
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
async function showReceiptGallery(dateStr) {
    const allReceipts = await getReceiptsByProperty(appState.currentProperty);
    const receipts = allReceipts.filter(r => r.date === dateStr);
    
    // Track the current date for adding new receipts
    currentGalleryDate = dateStr;

    // Fix timezone issue by parsing date components directly
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    document.getElementById('galleryDate').textContent = 
        date.toLocaleDateString('en-US', { 
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
        
        // Get first image (backward compatibility)
        const firstImage = receipt.images ? receipt.images[0] : (receipt.image || '');
        const imageCount = receipt.images ? receipt.images.length : (receipt.image ? 1 : 0);
        
        let html = `<img src="${firstImage}" alt="Receipt">`;
        
        // Show photo count badge if multiple photos
        if (imageCount > 1) {
            html += `<div class="photo-count-badge">📸 ${imageCount}</div>`;
        }
        
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

async function showCategoryReceipts(category) {
    const allReceipts = await getReceiptsByProperty(appState.currentProperty);
    const receipts = allReceipts.filter(r => (r.category || 'other') === category);

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
        await showReceiptGallery(dates[0]);
    }
}

// Receipt Modal
function showReceiptModal(receipt) {
    // Ensure receipt has images array (backward compatibility)
    if (!receipt.images && receipt.image) {
        receipt.images = [receipt.image];
    }
    
    appState.currentImageIndex = 0;
    
    // Set form values
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

    // Update image display
    updateImageDisplay();

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
        // Save to Supabase cloud storage
        await saveReceiptToSupabase(receipt);
        closeModal();
        await updatePropertyDisplay();
    } catch (error) {
        console.error('Error saving receipt:', error);
        alert(`Error saving receipt: ${error.message || 'Please try again.'}\n\nCheck console for details.`);
    }
}

async function deleteReceipt() {
    if (!appState.currentReceipt) return;

    if (confirm('Are you sure you want to delete this receipt?')) {
        try {
            await deleteReceiptFromSupabase(appState.currentReceipt.id);
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

// Supabase Storage Helper Functions
async function uploadImageToSupabase(imageData, receiptId, index = 0) {
    try {
        // Convert base64 to blob
        const response = await fetch(imageData);
        const blob = await response.blob();
        
        const fileName = `${receiptId}_${index}.jpg`;
        const { data, error } = await supabaseClient.storage
            .from('receipt-images')
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: true
            });
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
            .from('receipt-images')
            .getPublicUrl(fileName);
        
        return publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

async function uploadVoiceNoteToSupabase(voiceData, receiptId) {
    try {
        // Convert base64 to blob
        const response = await fetch(voiceData);
        const blob = await response.blob();
        
        const fileName = `${receiptId}.webm`;
        const { data, error } = await supabaseClient.storage
            .from('voice-notes')
            .upload(fileName, blob, {
                contentType: 'audio/webm',
                upsert: true
            });
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
            .from('voice-notes')
            .getPublicUrl(fileName);
        
        return publicUrl;
    } catch (error) {
        console.error('Error uploading voice note:', error);
        throw error;
    }
}

// Data Management - Supabase Functions
async function getAllReceipts() {
    try {
        const { data, error } = await supabaseClient
            .from('receipts')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        // Convert URLs back to data format for compatibility
        return data.map(receipt => {
            let images;
            try {
                // Try to parse as JSON array
                images = JSON.parse(receipt.image_url);
                if (!Array.isArray(images)) images = [receipt.image_url];
            } catch {
                // Fallback for old single-image format
                images = [receipt.image_url];
            }
            
            return {
                ...receipt,
                images: images,
                image: images[0], // Backward compatibility
                voiceNote: receipt.voice_note_url
            };
        });
    } catch (error) {
        console.error('Error getting receipts:', error);
        return [];
    }
}

async function getReceiptsByProperty(property) {
    try {
        const { data, error } = await supabaseClient
            .from('receipts')
            .select('*')
            .eq('property', property)
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        return data.map(receipt => {
            let images;
            try {
                // Try to parse as JSON array
                images = JSON.parse(receipt.image_url);
                if (!Array.isArray(images)) images = [receipt.image_url];
            } catch {
                // Fallback for old single-image format
                images = [receipt.image_url];
            }
            
            return {
                ...receipt,
                images: images,
                image: images[0], // Backward compatibility
                voiceNote: receipt.voice_note_url
            };
        });
    } catch (error) {
        console.error('Error getting receipts:', error);
        return [];
    }
}

async function saveReceiptToSupabase(receipt) {
    try {
        // Upload all images to storage
        const imageUrls = [];
        const images = receipt.images || (receipt.image ? [receipt.image] : []);
        
        for (let i = 0; i < images.length; i++) {
            const imageUrl = await uploadImageToSupabase(images[i], receipt.id, i);
            imageUrls.push(imageUrl);
        }
        
        // Upload voice note if exists
        let voiceNoteUrl = null;
        if (receipt.voiceNote) {
            voiceNoteUrl = await uploadVoiceNoteToSupabase(receipt.voiceNote, receipt.id);
        }
        
        // Save receipt metadata to database (store image URLs as JSON)
        const { data, error } = await supabaseClient
            .from('receipts')
            .upsert({
                id: receipt.id,
                property: receipt.property,
                date: receipt.date,
                amount: receipt.amount || null,
                category: receipt.category,
                note: receipt.note || '',
                image_url: JSON.stringify(imageUrls), // Store as JSON array
                voice_note_url: voiceNoteUrl,
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving receipt to Supabase:', error);
        throw error;
    }
}

async function deleteReceiptFromSupabase(receiptId) {
    try {
        // Delete image from storage
        await supabaseClient.storage
            .from('receipt-images')
            .remove([`${receiptId}.jpg`]);
        
        // Delete voice note from storage
        await supabaseClient.storage
            .from('voice-notes')
            .remove([`${receiptId}.webm`]);
        
        // Delete from database
        const { error } = await supabaseClient
            .from('receipts')
            .delete()
            .eq('id', receiptId);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error deleting receipt from Supabase:', error);
        throw error;
    }
}

// Multi-Photo Functions - Swipe Support
let touchStartX = 0;
let touchEndX = 0;

function handleSwipe() {
    const swipeThreshold = 50; // Minimum distance for a swipe
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swiped left - show next image
            showNextImage();
        } else {
            // Swiped right - show previous image
            showPreviousImage();
        }
    }
}

function showPreviousImage() {
    if (!appState.currentReceipt || !appState.currentReceipt.images) return;
    
    appState.currentImageIndex--;
    if (appState.currentImageIndex < 0) {
        appState.currentImageIndex = appState.currentReceipt.images.length - 1;
    }
    updateImageDisplay();
}

function showNextImage() {
    if (!appState.currentReceipt || !appState.currentReceipt.images) return;
    
    appState.currentImageIndex++;
    if (appState.currentImageIndex >= appState.currentReceipt.images.length) {
        appState.currentImageIndex = 0;
    }
    updateImageDisplay();
}

function updateImageDisplay() {
    const receipt = appState.currentReceipt;
    if (!receipt || !receipt.images || receipt.images.length === 0) return;
    
    const images = receipt.images;
    const index = appState.currentImageIndex;
    
    // Update main image
    const receiptImage = document.getElementById('receiptImage');
    receiptImage.src = images[index];
    
    // Add swipe event listeners for multi-photo navigation
    if (images.length > 1) {
        const carousel = document.querySelector('.image-carousel');
        
        // Remove old listeners to avoid duplicates
        carousel.ontouchstart = null;
        carousel.ontouchend = null;
        
        // Add touch event listeners
        carousel.ontouchstart = (e) => {
            touchStartX = e.changedTouches[0].screenX;
        };
        
        carousel.ontouchend = (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        };
    }
    
    // Update counter
    const counter = document.getElementById('imageCounter');
    if (images.length > 1) {
        counter.textContent = `${index + 1} / ${images.length}`;
        counter.style.display = 'block';
        
        // Show navigation buttons
        document.getElementById('prevImage').style.display = 'flex';
        document.getElementById('nextImage').style.display = 'flex';
    } else {
        counter.style.display = 'none';
        document.getElementById('prevImage').style.display = 'none';
        document.getElementById('nextImage').style.display = 'none';
    }
    
    // Update thumbnail strip
    updateThumbnailStrip();
    
    // Update "Add Another Photo" button
    updateAddPhotoButton();
}

function updateThumbnailStrip() {
    const receipt = appState.currentReceipt;
    if (!receipt || !receipt.images || receipt.images.length <= 1) {
        document.getElementById('thumbnailStrip').style.display = 'none';
        return;
    }
    
    const strip = document.getElementById('thumbnailStrip');
    strip.style.display = 'flex';
    strip.innerHTML = '';
    
    receipt.images.forEach((image, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumbnail-item';
        if (index === appState.currentImageIndex) {
            thumb.classList.add('active');
        }
        
        const img = document.createElement('img');
        img.src = image;
        thumb.appendChild(img);
        
        // Delete button
        if (receipt.images.length > 1) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'thumbnail-delete';
            deleteBtn.textContent = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteImage(index);
            };
            thumb.appendChild(deleteBtn);
        }
        
        // Click to select
        thumb.onclick = () => {
            appState.currentImageIndex = index;
            updateImageDisplay();
        };
        
        strip.appendChild(thumb);
    });
}

function updateAddPhotoButton() {
    const receipt = appState.currentReceipt;
    if (!receipt || !receipt.images) return;
    
    const button = document.getElementById('addAnotherPhoto');
    const text = document.getElementById('addPhotoText');
    
    if (receipt.images.length < MAX_PHOTOS_PER_RECEIPT) {
        button.style.display = 'flex';
        text.textContent = 'Add Another Photo';
    } else {
        button.style.display = 'none';
    }
}

function addAnotherPhoto() {
    if (!appState.currentReceipt || !appState.currentReceipt.images) return;
    if (appState.currentReceipt.images.length >= MAX_PHOTOS_PER_RECEIPT) {
        alert(`Maximum ${MAX_PHOTOS_PER_RECEIPT} photos per receipt.`);
        return;
    }
    
    // Trigger camera input
    const input = document.getElementById('cameraInput');
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        compressImage(file, 1200, 0.7)
            .then(compressedImage => {
                appState.currentReceipt.images.push(compressedImage);
                appState.currentImageIndex = appState.currentReceipt.images.length - 1;
                updateImageDisplay();
            })
            .catch(error => {
                console.error('Error compressing image:', error);
                alert('Error processing image. Please try again.');
            });
        
        // Reset input
        e.target.value = '';
        
        // Restore original onchange handler
        input.onchange = handleImageCapture;
    };
    
    input.click();
}

function deleteImage(index) {
    if (!appState.currentReceipt || !appState.currentReceipt.images) return;
    if (appState.currentReceipt.images.length <= 1) {
        alert('Cannot delete the only image. Delete the entire receipt instead.');
        return;
    }
    
    if (confirm('Delete this image?')) {
        appState.currentReceipt.images.splice(index, 1);
        
        // Adjust current index if needed
        if (appState.currentImageIndex >= appState.currentReceipt.images.length) {
            appState.currentImageIndex = appState.currentReceipt.images.length - 1;
        }
        
        updateImageDisplay();
    }
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

// Add receipt to current gallery date
function addReceiptToCurrentDate() {
    if (!currentGalleryDate) {
        alert('No date selected');
        return;
    }
    
    // Temporarily override handleImageCapture to set the date
    const originalHandler = window.handleImageCaptureOriginal || handleImageCapture;
    
    // Create a wrapper that sets the date
    const tempHandler = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        compressImage(file, 1200, 0.7)
            .then(compressedImage => {
                // Create new receipt with the gallery date
                const receipt = {
                    id: Date.now().toString(),
                    property: appState.currentProperty,
                    images: [compressedImage],
                    date: currentGalleryDate, // Use the current gallery date
                    amount: '',
                    category: 'other',
                    note: '',
                    voiceNote: null
                };

                appState.currentReceipt = receipt;
                appState.currentImageIndex = 0;
                showReceiptModal(receipt);
            })
            .catch(error => {
                console.error('Error compressing image:', error);
                alert('Error processing image. Please try again.');
            });

        // Reset input
        event.target.value = '';
        
        // Restore original handlers
        document.getElementById('cameraInput').onchange = originalHandler;
        document.getElementById('fileInput').onchange = originalHandler;
    };
    
    // Store original if not already stored
    if (!window.handleImageCaptureOriginal) {
        window.handleImageCaptureOriginal = handleImageCapture;
    }
    
    // Set temporary handlers
    document.getElementById('cameraInput').onchange = tempHandler;
    document.getElementById('fileInput').onchange = tempHandler;
    
    // Show photo source modal
    openCamera();
}
