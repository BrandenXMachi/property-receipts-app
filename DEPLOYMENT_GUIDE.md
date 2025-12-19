# Deployment Guide for panfi.li

## 🌐 Deploying Your Property Receipt Manager to panfi.li

Since your app is a **static website** (HTML, CSS, JavaScript with no backend), you have several excellent hosting options. All are free or very affordable!

---

## 🚀 RECOMMENDED OPTION 1: Netlify (Easiest & Free)

### Why Netlify?
- ✅ **FREE** forever plan
- ✅ Automatic HTTPS/SSL
- ✅ Custom domain support (panfi.li)
- ✅ Drag & drop deployment
- ✅ Continuous deployment from GitHub
- ✅ Global CDN for fast loading

### Steps:

#### 1. Sign up for Netlify
1. Go to [netlify.com](https://www.netlify.com)
2. Click "Sign up" (free account)
3. Sign up with email, GitHub, or GitLab

#### 2. Deploy Your Site
**Option A: Drag & Drop (Simplest)**
1. Log into Netlify
2. Go to "Sites" tab
3. Drag your entire `property-receipts-app` folder into the upload area
4. Wait 30 seconds - your site is live!
5. Netlify gives you a URL like `random-name-12345.netlify.app`

**Option B: GitHub (Better for updates)**
1. Create a GitHub account if you don't have one
2. Create a new repository called "property-receipts-app"
3. Upload your 4 files to GitHub
4. In Netlify, click "Add new site" → "Import an existing project"
5. Connect to GitHub and select your repository
6. Click "Deploy site"

#### 3. Connect Your Custom Domain (panfi.li)
1. In Netlify, go to your site's dashboard
2. Click "Domain settings"
3. Click "Add custom domain"
4. Enter: `panfi.li`
5. Netlify will provide DNS settings

#### 4. Update Your Domain DNS Settings
1. Log into your domain registrar (where you bought panfi.li)
2. Find DNS settings
3. Add the following records:

**Primary Method - Using Netlify DNS:**
- Update nameservers to Netlify's nameservers (they'll provide them)

**Alternative Method - Using A Record:**
- Add an A record pointing to: `75.2.60.5`
- Add a CNAME for `www` pointing to: `your-site-name.netlify.app`

#### 5. Enable HTTPS (Automatic)
- Netlify automatically provisions a free SSL certificate
- Within 24 hours, your site will be secure with HTTPS

**Done!** Your app will be live at `https://panfi.li`

---

## 🚀 OPTION 2: GitHub Pages (Free)

### Steps:

#### 1. Create GitHub Account
1. Go to [github.com](https://github.com)
2. Sign up for free account

#### 2. Create Repository
1. Click "New repository"
2. Name it: `property-receipts-app`
3. Make it Public
4. Click "Create repository"

#### 3. Upload Your Files
1. Click "uploading an existing file"
2. Drag all 4 files (index.html, styles.css, script.js, README.md)
3. Click "Commit changes"

#### 4. Enable GitHub Pages
1. Go to repository Settings
2. Click "Pages" in left sidebar
3. Under "Source", select "main" branch
4. Click "Save"
5. Your site will be at: `https://yourusername.github.io/property-receipts-app`

#### 5. Connect Custom Domain
1. In GitHub Pages settings, enter `panfi.li` in "Custom domain"
2. Click "Save"
3. In your domain registrar DNS settings:
   - Add A records:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Add CNAME record for `www`: `yourusername.github.io`

#### 6. Enable HTTPS
- Check "Enforce HTTPS" in GitHub Pages settings
- May take 24 hours to activate

---

## 🚀 OPTION 3: Vercel (Free)

### Steps:

#### 1. Sign Up
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub or email

#### 2. Deploy
1. Click "Add New" → "Project"
2. Import from GitHub (or drag & drop files)
3. Click "Deploy"
4. Site goes live instantly

#### 3. Add Custom Domain
1. Go to Project Settings → Domains
2. Add `panfi.li`
3. Update DNS at your registrar:
   - Add A record: `76.76.21.21`
   - Add CNAME for `www`: `cname.vercel-dns.com`

---

## 🚀 OPTION 4: Traditional Web Hosting

If your domain registrar offers web hosting (GoDaddy, Namecheap, Bluehost, etc.):

### Steps:

#### 1. Purchase/Activate Web Hosting
- Most registrars offer $2-5/month hosting
- Or may include free hosting with domain

#### 2. Access File Manager or FTP
- Log into your hosting control panel (cPanel)
- Find "File Manager" or get FTP credentials

#### 3. Upload Files
1. Navigate to `public_html` or `www` folder
2. Upload all 4 files:
   - index.html
   - styles.css
   - script.js
   - README.md

#### 4. Visit Your Site
- Go to `https://panfi.li`
- Your app should be live!

---

## 📋 Pre-Deployment Checklist

Before deploying, make sure:
- ✅ All files are in the same folder
- ✅ Test locally by opening index.html in browser
- ✅ Password works (Brandrew)
- ✅ Camera/microphone permissions work on mobile
- ✅ All features function correctly

---

## 🔧 Post-Deployment Tasks

### 1. Test on Mobile
- Visit panfi.li on your phone
- Test camera capture
- Test voice notes
- Ensure responsive design works

### 2. Bookmark
- Add to home screen on mobile for app-like experience

### 3. SSL Certificate
- Ensure HTTPS is working (padlock in browser)
- Most modern hosts provide free SSL

### 4. Performance
- Test loading speed
- All your data stays local (nothing to optimize server-side)

---

## 🆘 Troubleshooting

### Site not loading after DNS change
- **Wait 24-48 hours** - DNS changes take time to propagate
- Clear browser cache
- Try incognito/private mode

### Camera not working
- Ensure site uses HTTPS (required for camera access)
- Check browser permissions

### Data not saving
- Check browser allows LocalStorage
- Not related to hosting - purely client-side

---

## 💡 My Recommendation

**Use Netlify** - It's:
- Completely FREE
- Easiest to set up
- Automatic HTTPS
- Super fast global CDN
- No technical knowledge required
- Great support

You can literally have your site live in 5 minutes using drag & drop!

---

## 📞 Need Help?

Common domain registrars and their DNS settings:
- **GoDaddy**: Domain Settings → DNS → Manage DNS
- **Namecheap**: Domain List → Manage → Advanced DNS
- **Google Domains**: DNS → Custom records
- **Cloudflare**: DNS → Records

---

## 🎉 Next Steps

1. Choose a hosting option (I recommend Netlify)
2. Follow the steps above
3. Update your domain's DNS settings
4. Wait for DNS propagation (up to 48 hours)
5. Visit https://panfi.li and enjoy!

---

**Questions?** Feel free to ask for help with any step!
