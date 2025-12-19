# ✅ Network Solutions Deployment Checklist for panfi.li

Print this out and check off each step as you complete it!

---

## Before You Start

- [ ] I have panfi.li registered with Network Solutions
- [ ] I have my Network Solutions login credentials ready
- [ ] Files ready: index.html, styles.css, script.js, README.md

---

## Phase 1: Setup Hosting (10-15 minutes)

- [ ] Logged into NetworkSolutions.com
- [ ] Checked "My Services" for existing hosting
- [ ] If no hosting: Purchased hosting plan ($4-10/month)
- [ ] Hosting is activated for panfi.li
- [ ] Can access hosting control panel

---

## Phase 2: Upload Files (5-10 minutes)

- [ ] Opened File Manager in control panel
- [ ] Located web root folder (httpdocs or public_html)
- [ ] Deleted any default/sample files
- [ ] Uploaded index.html
- [ ] Uploaded styles.css
- [ ] Uploaded script.js
- [ ] Uploaded README.md (optional)
- [ ] Verified all files are in ROOT (not in a subfolder)
- [ ] Files show in File Manager correctly

---

## Phase 3: SSL Certificate (15-30 minutes)

**CRITICAL: App needs HTTPS for camera/microphone!**

- [ ] Found SSL/Security section in control panel
- [ ] Selected SSL certificate option (free if available)
- [ ] Applied SSL to panfi.li domain
- [ ] Clicked "Activate" or "Install"
- [ ] Waited 15-30 minutes for SSL activation
- [ ] SSL certificate shows as "Active" or "Installed"

### Enable HTTPS Redirect:
- [ ] Found .htaccess file or HTTPS redirect option
- [ ] Enabled "Force HTTPS" toggle OR
- [ ] Added redirect code to .htaccess
- [ ] Saved changes

---

## Phase 4: Test Basic Functionality (5 minutes)

- [ ] Opened browser
- [ ] Visited http://panfi.li
- [ ] Site loads and shows login screen
- [ ] URL shows https:// (not http://)
- [ ] Padlock icon appears in browser
- [ ] Entered password: Brandrew
- [ ] Successfully logged in
- [ ] All three properties show up
- [ ] Clicked on a property (e.g., Block Apartment)
- [ ] Property screen loads correctly

---

## Phase 5: Test Core Features (10 minutes)

- [ ] Can switch between tabs (Calendar, Categories, Summary)
- [ ] Calendar displays current month
- [ ] Can navigate months (prev/next buttons)
- [ ] Categories list shows all 8 categories
- [ ] Summary tab loads
- [ ] Can change years in Summary
- [ ] Back button returns to home
- [ ] Can switch between different properties
- [ ] Logout button works

---

## Phase 6: Mobile Testing (15 minutes)

**Test on your smartphone:**

- [ ] Opened Safari (iPhone) or Chrome (Android)
- [ ] Visited https://panfi.li
- [ ] Site loads properly on mobile
- [ ] Login works (entered Brandrew)
- [ ] Selected a property
- [ ] Clicked purple + button (bottom right)
- [ ] Camera permission prompt appeared
- [ ] Allowed camera access
- [ ] Camera opened successfully
- [ ] Took a photo of a test receipt
- [ ] Photo appeared in the modal
- [ ] Filled in receipt details:
  - [ ] Date selected
  - [ ] Amount entered
  - [ ] Category chosen
  - [ ] Text note added (optional)
- [ ] Tested voice note:
  - [ ] Clicked "Record" button
  - [ ] Microphone permission granted
  - [ ] Recorded a short test
  - [ ] Recording stopped
  - [ ] Playback worked
- [ ] Clicked "Save"
- [ ] Receipt saved successfully
- [ ] Receipt appears in calendar (date highlighted)
- [ ] Clicked date to see receipt
- [ ] Receipt thumbnail shows
- [ ] Clicked receipt to view details
- [ ] All data saved correctly
- [ ] Closed and reopened browser
- [ ] Data still there (LocalStorage working)

---

## Phase 7: Add to Home Screen (5 minutes)

**iPhone:**
- [ ] Tapped Share button (square with arrow)
- [ ] Scrolled and tapped "Add to Home Screen"
- [ ] Named it (e.g., "Property Manager")
- [ ] Tapped "Add"
- [ ] Icon appeared on home screen
- [ ] Opened from home screen
- [ ] App opens like native app

**Android:**
- [ ] Tapped menu (three dots)
- [ ] Selected "Add to Home Screen"
- [ ] Named it
- [ ] Tapped "Add"
- [ ] Icon appeared on home screen
- [ ] Opened from home screen
- [ ] Works correctly

---

## Phase 8: Final Verification

- [ ] Site works on desktop browser
- [ ] Site works on mobile browser
- [ ] HTTPS is enabled (padlock visible)
- [ ] Camera works on mobile
- [ ] Microphone works on mobile
- [ ] Data saves and persists
- [ ] Can add multiple receipts
- [ ] Can switch between properties
- [ ] Each property has separate data
- [ ] Categories update with receipt counts
- [ ] Summary shows totals
- [ ] Export buttons are visible (even if not used yet)

---

## Optional: Share with Others

- [ ] Shared https://panfi.li link with family/friends
- [ ] Confirmed they can access with password
- [ ] Explained password is: Brandrew
- [ ] Noted: Each person's data stays on their own device
- [ ] Reminded: Camera needs HTTPS (which you have!)

---

## Troubleshooting Reference

**If site doesn't load:**
- Wait 15-30 minutes, then try again
- Clear browser cache (Ctrl+F5)
- Try incognito/private mode
- Check DNS at whatsmydns.net

**If camera doesn't work:**
- Verify HTTPS padlock is showing
- Check browser allowed camera permission
- Try different browser
- Make sure you're on actual phone (not simulator)

**If data disappears:**
- Don't clear browser data/cookies
- Each browser has separate storage
- Each device has separate storage
- Use export feature to backup regularly

**Need help?**
- Network Solutions: 1-800-333-7680
- Reference: NETWORK_SOLUTIONS_GUIDE.md

---

## 🎉 Success!

When all items are checked:

✅ **Your Property Receipt Manager is LIVE at https://panfi.li**

✅ **Fully functional with camera and voice notes**

✅ **Ready to manage your property receipts!**

---

**Date Completed:** _______________

**Time Taken:** _______________

**Notes:**
_______________________________________
_______________________________________
_______________________________________
