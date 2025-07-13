# EmailJS Setup Guide for Bug Reports & Feature Requests

## 1. Create EmailJS Account

1. Go to [https://www.emailjs.com](https://www.emailjs.com)
2. Click **Sign Up** (it's free for up to 200 emails/month)
3. Sign up with your email or GitHub account
4. Verify your email address

## 2. Create an Email Service

1. In your EmailJS dashboard, click **Email Services**
2. Click **Add New Service**
3. Choose your email provider:
   - **Gmail** (recommended if you have Gmail)
   - **Outlook/Hotmail**
   - **Yahoo**
   - **Custom SMTP** (for other providers)

### For Gmail Setup:
1. Select **Gmail**
2. Click **Connect Account**
3. Sign in with your Google account
4. Allow EmailJS permissions
5. Give your service a name like "Meal Planner Bug Reports"
6. Click **Create Service**
7. **Copy your Service ID** (you'll need this later)

## 3. Create Email Template

1. In your EmailJS dashboard, click **Email Templates**
2. Click **Create New Template**
3. Use this template configuration:

### Template Settings:
- **Template Name**: `Bug Report - Meal Planner`
- **Template ID**: Keep the auto-generated ID (copy this - you'll need it)

### Email Template Content:

**Subject Line:**
```
[Meal Planner] {{report_type}}: {{subject}}
```

**Email Body:**
```
NEW REPORT FROM MEAL PLANNER APP
================================

Report Type: {{report_type}}
Subject: {{subject}}
From: {{from_name}} ({{from_email}})
Timestamp: {{timestamp}}

DESCRIPTION:
------------
{{message}}

TECHNICAL DETAILS:
------------------
Current URL: {{current_url}}
User Agent: {{user_agent}}

Browser Information:
{{browser_info}}

---
This email was automatically generated from the Meal Planner app bug reporting system.
```

### Template Variables:
Make sure these variables are defined in your template:
- `{{report_type}}` - Bug Report, Feature Request, etc.
- `{{subject}}` - Brief description
- `{{from_name}}` - User's name (optional)
- `{{from_email}}` - User's email (optional)
- `{{message}}` - Detailed description
- `{{timestamp}}` - When the report was sent
- `{{current_url}}` - App URL
- `{{user_agent}}` - Browser details
- `{{browser_info}}` - System information

4. Click **Save** and copy your **Template ID**

## 4. Configure EmailJS Settings

1. Go to **Account > General**
2. Copy your **User ID** (also called Public Key)
3. Optional: Set up email quotas and restrictions

## 5. Get Your Configuration Values

You now need these three values:

1. **User ID** (Public Key) - from Account > General
2. **Service ID** - from your email service
3. **Template ID** - from your email template

## 6. Add Configuration to Your App

Add this script tag to your `index.html` file, before the other script tags:

```html
<script>
// EmailJS configuration
window.VITE_EMAILJS_USER_ID = 'your_user_id_here';
window.VITE_EMAILJS_SERVICE_ID = 'your_service_id_here';
window.VITE_EMAILJS_TEMPLATE_ID = 'your_template_id_here';
</script>
```

Replace the placeholder values with your actual IDs from steps above.

## 7. Test the Bug Report System

1. Open your meal planner app
2. Click the bug report icon (⚠️) in the header
3. Fill out a test report:
   - Type: Bug Report
   - Name: Test User
   - Email: your-email@example.com
   - Subject: Testing bug report system
   - Description: This is a test of the bug reporting system
4. Click **Send Report**
5. Check your email for the bug report

## 8. Email Template Examples

### Example 1: Bug Report Email
```
Subject: [Meal Planner] Bug Report: Recipe picker not working

NEW REPORT FROM MEAL PLANNER APP
================================

Report Type: Bug Report
Subject: Recipe picker not working
From: John Doe (john@example.com)
Timestamp: 2024-01-15T10:30:00.000Z

DESCRIPTION:
------------
When I click the 📖 button on Monday breakfast, the recipe picker modal doesn't appear. This happens consistently in Chrome on my MacBook.

Steps to reproduce:
1. Go to planner tab
2. Click 📖 button on any meal slot
3. Nothing happens

Expected: Recipe picker modal should open
Actual: Nothing happens

TECHNICAL DETAILS:
------------------
Current URL: https://your-app.vercel.app
User Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36

Browser Information:
{"userAgent":"Mozilla/5.0...","language":"en-US","platform":"MacIntel","cookieEnabled":true,"onLine":true,"screen":{"width":1440,"height":900,"colorDepth":24},"viewport":{"width":1200,"height":800}}
```

### Example 2: Feature Request Email
```
Subject: [Meal Planner] Feature Request: Add grocery list export to PDF

NEW REPORT FROM MEAL PLANNER APP
================================

Report Type: Feature Request
Subject: Add grocery list export to PDF
From: Jane Smith (jane@example.com)
Timestamp: 2024-01-15T14:20:00.000Z

DESCRIPTION:
------------
It would be great to export the grocery lists to PDF format so I can print them out for shopping. Currently I have to screenshot or copy-paste the list.

Suggested implementation:
- Add "Export to PDF" button next to the grocery list
- Include categorized sections (Proteins, Produce, etc.)
- Make it printer-friendly with checkboxes

This would be really helpful for offline shopping!

TECHNICAL DETAILS:
------------------
Current URL: https://your-app.vercel.app
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)

Browser Information:
{"userAgent":"Mozilla/5.0...","language":"en-US","platform":"iPhone","cookieEnabled":true,"onLine":true,"screen":{"width":375,"height":812,"colorDepth":32},"viewport":{"width":375,"height":664}}
```

## 9. Troubleshooting

### Common Issues:

**"EmailJS not initialized" error:**
- Check that your User ID is correct
- Make sure the script loads before trying to send emails

**"Service or template ID not configured" error:**
- Verify your Service ID and Template ID are correct
- Check for typos in the configuration

**Emails not sending:**
- Check your EmailJS dashboard for quota limits
- Verify your email service is still connected
- Test with a simple template first

**Template variables not showing:**
- Make sure variable names match exactly (case-sensitive)
- Check that variables are wrapped in double curly braces: `{{variable_name}}`

### Testing Tips:

1. Start with a simple template to test the connection
2. Add variables one by one to identify issues
3. Check the browser console for detailed error messages
4. Use the EmailJS dashboard to monitor email sending

## 10. Security Notes

- The User ID and Service ID are safe to expose in frontend code
- Template ID is also safe to expose
- EmailJS handles rate limiting and spam protection
- Consider setting up domain restrictions in EmailJS settings for production

Your bug reporting system is now ready! Users can report issues directly from the app, and you'll receive detailed emails with all the technical information needed to debug problems.