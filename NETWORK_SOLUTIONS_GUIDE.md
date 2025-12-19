# 🌐 Deploy to panfi.li using Network Solutions

## Overview

Network Solutions is perfect for your app since they're likely your domain registrar. This guide will show you how to host your Property Receipt Manager on Network Solutions.

---

## Prerequisites

✅ You own panfi.li through Network Solutions
✅ You need a web hosting plan (if you don't have one yet)

---

## Step 1: Get Web Hosting (if needed)

### Check if you have hosting:
1. Go to **https://www.networksolutions.com**
2. Log into your account
3. Click "My Services" or "My Account"
4. Look for "Web Hosting" in your services

### If you don't have hosting yet:
1. Go to Network Solutions website
2. Navigate to "Web Hosting" plans
3. Choose a basic plan (usually $4-10/month)
   - **Starter plan** is perfect for your app
   - Look for "Shared Hosting" or "Basic Hosting"
4. Add hosting to your panfi.li domain
5. Complete purchase

**Note:** Some domain purchases include free hosting for the first year - check for this!

---

## Step 2: Access Your Hosting Control Panel

### Option A: Using File Manager (Easiest - No FTP needed)

1. Log into your Network Solutions account
2. Go to "My Services" → "Web Hosting"
3. Click "Manage" next to your panfi.li hosting
4. Look for **"File Manager"** or **"Website Files"**
5. Click to open File Manager

### Option B: Using FTP (Alternative method)

1. In your hosting control panel, find **FTP credentials**
2. Note down:
   - FTP Host (usually: ftp.panfi.li or your-server-name)
   - FTP Username
   - FTP Password
3. Download an FTP client like **FileZilla** (free)
4. Connect using your credentials

---

## Step 3: Upload Your Files

### Using File Manager:

1. **Navigate to the web root folder:**
   - Usually called: `httpdocs` or `public_html` or `www`
   - This is where your website files go

2. **Delete default files (if any):**
   - Remove any default "coming soon" or sample files
   - Keep the folder empty or clean

3. **Upload your 4 files:**
   - Click "Upload" button in File Manager
   - Select these files from your computer:
     - ✅ `index.html`
     - ✅ `styles.css`
     - ✅ `script.js`
     - ✅ `README.md` (optional, but good to keep)
   
4. **Verify upload:**
   - Make sure all 4 files are in the root web folder
   - They should NOT be in a subfolder
   - Files should be at the same level

### Using FTP (FileZilla):

1. Open FileZilla
2. Connect to your server with FTP credentials
3. Navigate to `httpdocs` or `public_html` folder (right side)
4. On left side, navigate to your `property-receipts-app` folder
5. Select all 4 files and drag to right side
6. Wait for upload to complete

---

## Step 4: Configure Your Domain

Since you registered panfi.li with Network Solutions and are hosting with them, your domain should automatically point to your hosting. But let's verify:

### Check Domain Settings:

1. In Network Solutions account, go to **"Manage Domain"**
2. Click on **panfi.li**
3. Look for **"DNS Settings"** or **"Edit DNS"**
4. Verify these settings exist:

**If hosting with Network Solutions:**
- Should have an A record pointing to their server IP
- Usually auto-configured when you add hosting
- **You typically don't need to change anything!**

**If you need to point elsewhere:**
- A Record: `@` → (Your server IP - Network Solutions will provide this)
- CNAME: `www` → `panfi.li`

---

## Step 5: Enable SSL/HTTPS (IMPORTANT!)

Your app **requires HTTPS** for camera and microphone features!

### In Network Solutions:

1. Go to your hosting control panel
2. Look for **"SSL Certificate"** or **"Security"**
3. Network Solutions offers SSL certificates:
   - **Free SSL** (Let's Encrypt) - some plans include this
   - **Paid SSL** ($69+/year) - more comprehensive

### To activate SSL:

1. Click "Add SSL Certificate"
2. Choose the free option if available
3. Select your domain: `panfi.li`
4. Click "Activate" or "Install"
5. Wait 15-30 minutes for activation

### Enable HTTPS redirect:

1. In hosting control panel, find **".htaccess"** file
2. Add this code to redirect all traffic to HTTPS:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

**Or** Network Solutions may have a simple toggle: "Force HTTPS" - turn it ON

---

## Step 6: Test Your Site

### Immediate test:
1. Open a browser
2. Go to: **http://panfi.li**
3. Your Property Receipt Manager should load!

### If site doesn't load:
- Wait 15-30 minutes for servers to update
- Clear browser cache (Ctrl+F5)
- Try different browser or incognito mode

### Full testing checklist:
- ✅ Password login works (Brandrew)
- ✅ Can select a property
- ✅ Can navigate between tabs
- ✅ Calendar displays correctly
- ✅ HTTPS padlock shows in browser
- ✅ (On mobile) Camera button works
- ✅ (On mobile) Can capture receipt
- ✅ Receipt saves and displays
- ✅ Voice notes work
- ✅ Data persists after refresh

---

## 🚨 Important Notes

### SSL Certificate is CRITICAL:
- Without HTTPS, camera and microphone will NOT work
- This is a browser security requirement, not an app issue
- All modern browsers block camera access on non-HTTPS sites

### File Permissions:
- Your files should have read permissions (644 or 755)
- Network Solutions usually sets this automatically
- If site shows "Forbidden" error, check file permissions in control panel

### Data Storage:
- All user data is stored in browser LocalStorage
- Nothing is stored on your Network Solutions server
- Server only delivers the HTML/CSS/JS files
- Each user's device has its own data

---

## 📱 Mobile Testing

Once live:
1. Open Safari (iPhone) or Chrome (Android)
2. Go to **https://panfi.li**
3. Test camera capture
4. Add to home screen:
   - iPhone: Tap Share → "Add to Home Screen"
   - Android: Menu → "Add to Home Screen"
5. Opens like a native app!

---

## 🔄 Making Updates

When you want to update your app:

1. Make changes to files on your computer
2. Log into Network Solutions File Manager
3. Delete old file (e.g., old script.js)
4. Upload new version
5. Clear cache and refresh browser
6. Changes are live immediately!

**Pro tip:** Keep a backup of your files locally!

---

## 💰 Cost Breakdown

- **Domain (panfi.li):** You already own this
- **Web Hosting:** $4-10/month (varies by plan)
- **SSL Certificate:** Free to $69/year (get free if possible)
- **Total:** Around $5-15/month typically

---

## 🆘 Troubleshooting

### "Site not found" or 404 error:
- Files may be in wrong folder
- Move files to root of `httpdocs` or `public_html`
- Don't put them in a subfolder

### "Forbidden" or 403 error:
- Check file permissions in File Manager
- Set to 644 or make files "readable"

### Camera doesn't work:
- **MUST have SSL/HTTPS enabled**
- Check browser for padlock icon
- Allow camera permissions when prompted

### Site is slow:
- Network Solutions servers can be slower than modern hosts
- Consider compressing images if you add any
- Basic hosting should be fine for this app

### DNS issues:
- DNS changes can take 24-48 hours
- Try `https://www.whatsmydns.net` to check propagation
- Enter panfi.li to see if it's resolving globally

---

## 📞 Network Solutions Support

If you need help:
- **Phone:** 1-800-333-7680
- **Live Chat:** Available on their website
- **Control Panel:** Usually has built-in help guides
- **Support:** Ask them to help with "uploading website files" or "SSL installation"

---

## ✅ Quick Checklist

- [ ] Web hosting activated for panfi.li
- [ ] Logged into Network Solutions control panel
- [ ] Accessed File Manager
- [ ] Found httpdocs/public_html folder
- [ ] Uploaded all 4 files to root
- [ ] Files are in correct location (not subfolder)
- [ ] SSL certificate activated
- [ ] HTTPS redirect enabled
- [ ] Tested https://panfi.li in browser
- [ ] Password login works
- [ ] Tested camera on mobile with HTTPS
- [ ] Added to home screen on phone

---

## 🎉 You're Done!

Your Property Receipt Manager is now live at **https://panfi.li**!

The app is fully functional, camera-ready, and accessible from any device. All user data stays private on their own devices.

**Congratulations on your deployment!** 🏡📱
