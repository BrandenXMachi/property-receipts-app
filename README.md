# Property Receipt Manager

A professional, mobile-first web application for managing property receipts and expenses. Designed with an elegant aesthetic for middle-aged women property owners.

## Features

### 🔐 Password Protection
- Secure access with password: **Brandrew**
- Session-based authentication

### 🏘️ Three Property Management
- **Block Apartment**
- **Triplex**
- **House**

Each property maintains separate receipts and expenses.

### 📸 Camera-First Workflow
- Tap the + button to capture receipts
- Direct camera access on mobile devices
- Automatic date stamping

### 📅 Calendar View
- Monthly calendar grid
- Visual indicators for days with receipts
- Tap any date to view all receipts from that day

### 🗂️ Category Organization
- Maintenance & Repairs
- Utilities
- Insurance
- Property Tax
- Landscaping
- Management Fees
- Improvements
- Other

### 🎙️ Voice Notes
- Record voice memos for each receipt
- Microphone icon indicator on receipts with audio
- Playback directly from receipt details

### 📊 Summary & Reports
- Annual expense summaries by category
- Total expense calculations
- Export to CSV for accountants
- Batch download all receipt images

### 💾 Local Storage
- All data stored locally in your browser
- No server required
- Privacy-focused design

## How to Use

### Getting Started
1. Open `index.html` in a web browser
2. Enter password: **Brandrew**
3. Select a property to begin

### Adding a Receipt
1. Open a property
2. Tap the purple + button (bottom right)
3. Capture or select a photo
4. (Optional) Add:
   - Date
   - Amount
   - Category
   - Text note
   - Voice note
5. Tap "Save"

### Viewing Receipts
- **Calendar Tab**: Tap any date with receipts (indicated by purple highlighting)
- **Categories Tab**: Tap a category to see recent receipts
- **Gallery**: Tap any receipt thumbnail to view details

### Summary & Export
1. Go to "Summary" tab
2. Navigate between years
3. View category totals
4. Export summary as CSV
5. Download all receipt images

## Design Features

### Color Palette
- Primary: Soft purple (#8B7BA8)
- Accents: Rose and warm beige
- Background: Warm off-white (#FAF8F5)
- Professional, calming aesthetic

### Mobile Optimized
- Large touch targets (minimum 44x44px)
- One-handed operation friendly
- Responsive design for all screen sizes
- Smooth animations and transitions

### App-Like Interface
- Minimal navigation
- Clear visual hierarchy
- Intuitive icon-driven design
- Professional polish

## Technical Details

### Browser Requirements
- Modern browser with ES6+ support
- Camera access for receipt capture
- Microphone access for voice notes (optional)
- LocalStorage support

### File Structure
```
property-receipts-app/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling
├── script.js           # All functionality
└── README.md          # Documentation
```

### Data Storage
All data is stored in browser LocalStorage:
- Receipts (images stored as base64)
- Voice notes (audio stored as base64)
- Session authentication

### Privacy
- No external servers
- No data transmission
- 100% client-side application
- Data remains on device

## Browser Support

✅ Chrome/Edge (recommended)
✅ Safari (iOS & macOS)
✅ Firefox
✅ Mobile browsers

## Tips

1. **Use on mobile**: Best experience on smartphone with camera
2. **Regular backups**: Export data periodically
3. **Photo quality**: Ensure receipts are clearly legible
4. **Categories**: Assign categories for easy tax preparation
5. **Voice notes**: Great for recording context or details

## Support

For issues or questions, this is a standalone application with no external support. All functionality is contained within the three files provided.

---

**Version**: 1.0  
**Last Updated**: December 2025  
**License**: Private Use
