# Email Configuration Guide

## Status
✅ Contact form is fully implemented and ready to send emails
✅ Email endpoint is running in `dev-server.js`
✅ Default recipient is `bobclein1@gmail.com`
✅ All TypeScript errors fixed

## Quick Start (Development)

### 1. Start the dev proxy (in terminal 1)
```bash
npm run dev:proxy
```

You should see: `Dev proxy listening on 3001`

### 2. Start the app (in terminal 2)
```bash
npm run dev
```

The app will open at http://localhost:8080

### 3. Test the contact form
- Scroll to the Contact section (or go to http://localhost:8080/#contact)
- Fill in the form with any name, email, and message
- Click "Send Message"
- In development mode, you'll get a **preview URL** to see the email

## Setup Real Emails

### Option 1: SendGrid (Recommended for Production)

1. Create a free account at https://sendgrid.com
2. Get your API key from Settings → API Keys → Create API Key
3. Create `.env.local` file:
```env
SENDGRID_API_KEY=SG.your-actual-key-here
SENDGRID_FROM=noreply@example.com
CONTACT_RECIPIENT=bobclein1@gmail.com
```
4. Restart the dev proxy
5. Send a test email

### Option 2: Gmail SMTP

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Create `.env.local` file:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
CONTACT_RECIPIENT=bobclein1@gmail.com
```
4. Restart the dev proxy
5. Send a test email

### Option 3: Office 365 / Outlook

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=your-email@outlook.com
CONTACT_RECIPIENT=bobclein1@gmail.com
```

## Troubleshooting

**"Cannot reach API" error?**
- Make sure dev proxy is running: `npm run dev:proxy`
- Check it's listening on port 3001
- Ensure both terminals are running (dev proxy + app)

**Email not arriving?**
- Check the console output from dev proxy for error messages
- Verify credentials in `.env.local` are correct
- For Gmail: confirm you generated an App Password (not using main password)
- For SendGrid: ensure API key has "Mail Send" permission

**No email provider configured?**
- In development, the app uses Ethereal (free test email service)
- Check dev proxy console for preview URL
- Click the preview URL to see how the email looks
- To send real emails, add environment variables above

## Email Headers

When an email is sent, it includes:
- **To**: bobclein1@gmail.com (configured recipient)
- **From**: Your configured sender email
- **Subject**: New contact message from [Visitor Name]
- **Body**: Includes visitor's name, reply-to email, and message

## Files Modified

- ✅ Desktop.tsx - Fixed all TypeScript errors
- ✅ ContactSection.tsx - Already calls /api/contact
- ✅ dev-server.js - Contact endpoint ready
- ✅ All validation and error handling in place
