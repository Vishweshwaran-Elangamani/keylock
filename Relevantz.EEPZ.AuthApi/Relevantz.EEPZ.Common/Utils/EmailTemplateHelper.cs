namespace Relevantz.EEPZ.Common.Utils
{
    public class EmailTemplateHelper
    {
        private const string BaseStyle = @"
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                :root {
                    color-scheme: light dark;
                    supported-color-schemes: light dark;
                }
                
                * {
                    margin: 0;
                    padding: 0;
                }
                
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background-color: #FAFAFA;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }
                
                @media (prefers-color-scheme: dark) {
                    body {
                        background-color: #0A0A0A;
                    }
                    
                    .email-container {
                        background-color: #1A1A1A;
                        border: 1px solid #2A2A2A;
                    }
                    
                    .brand-bar {
                        background-color: #2563EB;
                    }
                    
                    .header-section {
                        background-color: #1A1A1A;
                        border-bottom: 1px solid #2A2A2A;
                    }
                    
                    .brand-name {
                        color: #FFFFFF;
                    }
                    
                    .brand-subtitle {
                        color: #9CA3AF;
                    }
                    
                    .section-title {
                        background-color: #2A2A2A;
                        color: #E5E7EB;
                    }
                    
                    .content-area {
                        background-color: #1A1A1A;
                    }
                    
                    .text-primary {
                        color: #E5E7EB;
                    }
                    
                    .text-secondary {
                        color: #9CA3AF;
                    }
                    
                    .credential-table {
                        background-color: #111111;
                        border: 1px solid #2A2A2A;
                    }
                    
                    .credential-label {
                        color: #9CA3AF;
                        background-color: #1A1A1A;
                    }
                    
                    .credential-value {
                        color: #FFFFFF;
                        background-color: #2A2A2A;
                    }
                    
                    .notice-bar {
                        background-color: #2A2A2A;
                        border-left: 3px solid #F59E0B;
                    }
                    
                    .notice-bar.success {
                        border-left-color: #10B981;
                    }
                    
                    .notice-bar.error {
                        border-left-color: #EF4444;
                    }
                    
                    .notice-bar.info {
                        border-left-color: #3B82F6;
                    }
                    
                    .notice-text {
                        color: #D1D5DB;
                    }
                    
                    .highlight-container {
                        background-color: #1E293B;
                        border: 2px solid #3B82F6;
                    }
                    
                    .highlight-code {
                        color: #FFFFFF;
                    }
                    
                    .footer-section {
                        background-color: #111111;
                        border-top: 1px solid #2A2A2A;
                    }
                    
                    .footer-text {
                        color: #6B7280;
                    }
                    
                    .footer-link {
                        color: #60A5FA;
                    }
                    
                    .divider-line {
                        background-color: #2A2A2A;
                    }
                }
                
                table {
                    border-spacing: 0;
                    border-collapse: collapse;
                }
                
                td {
                    padding: 0;
                }
                
                .email-wrapper {
                    width: 100%;
                    background-color: #FAFAFA;
                    padding: 40px 0;
                }
                
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #FFFFFF;
                    border: 1px solid #E5E7EB;
                    overflow: hidden;
                }
                
                .brand-bar {
                    width: 4px;
                    background-color: #2563EB;
                    height: 100%;
                }
                
                .header-section {
                    background-color: #FFFFFF;
                    padding: 40px 48px;
                    border-bottom: 1px solid #E5E7EB;
                }
                
                .brand-name {
                    font-size: 32px;
                    font-weight: 700;
                    color: #111827;
                    letter-spacing: 4px;
                    margin: 0 0 8px 0;
                }
                
                .brand-subtitle {
                    font-size: 12px;
                    font-weight: 500;
                    color: #6B7280;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    margin: 0;
                }
                
                .section-title {
                    background-color: #F9FAFB;
                    padding: 16px 48px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #374151;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    border-top: 1px solid #E5E7EB;
                    border-bottom: 1px solid #E5E7EB;
                }
                
                .content-area {
                    padding: 40px 48px;
                    background-color: #FFFFFF;
                }
                
                .greeting-text {
                    font-size: 16px;
                    font-weight: 600;
                    color: #111827;
                    margin: 0 0 24px 0;
                    line-height: 1.5;
                }
                
                .text-primary {
                    font-size: 15px;
                    line-height: 1.7;
                    color: #374151;
                    margin: 0 0 16px 0;
                }
                
                .text-secondary {
                    font-size: 14px;
                    line-height: 1.6;
                    color: #6B7280;
                    margin: 0;
                }
                
                .credential-table {
                    width: 100%;
                    background-color: #F9FAFB;
                    border: 1px solid #E5E7EB;
                    margin: 32px 0;
                }
                
                .credential-row {
                    border-bottom: 1px solid #E5E7EB;
                }
                
                .credential-row:last-child {
                    border-bottom: none;
                }
                
                .credential-label {
                    padding: 20px 24px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #6B7280;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    background-color: #FAFAFA;
                    width: 35%;
                }
                
                .credential-value {
                    padding: 20px 24px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #111827;
                    font-family: 'Courier New', monospace;
                    background-color: #FFFFFF;
                }
                
                .highlight-container {
                    background-color: #EFF6FF;
                    border: 2px solid #3B82F6;
                    padding: 32px;
                    text-align: center;
                    margin: 32px 0;
                }
                
                .highlight-label {
                    font-size: 10px;
                    font-weight: 700;
                    color: #1E40AF;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin: 0 0 16px 0;
                }
                
                .highlight-code {
                    font-size: 42px;
                    font-weight: 700;
                    color: #1E3A8A;
                    letter-spacing: 16px;
                    font-family: 'Courier New', monospace;
                    margin: 0;
                }
                
                .highlight-expiry {
                    font-size: 12px;
                    font-weight: 500;
                    color: #1E40AF;
                    margin: 16px 0 0 0;
                }
                
                .notice-bar {
                    background-color: #F9FAFB;
                    border-left: 3px solid #F59E0B;
                    padding: 20px 24px;
                    margin: 28px 0;
                }
                
                .notice-bar.success {
                    border-left-color: #10B981;
                }
                
                .notice-bar.error {
                    border-left-color: #EF4444;
                }
                
                .notice-bar.info {
                    border-left-color: #3B82F6;
                }
                
                .notice-title {
                    font-size: 12px;
                    font-weight: 700;
                    color: #111827;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin: 0 0 8px 0;
                }
                
                .notice-text {
                    font-size: 14px;
                    color: #4B5563;
                    margin: 0;
                    line-height: 1.6;
                }
                
                .list-section {
                    margin: 28px 0;
                }
                
                .list-heading {
                    font-size: 13px;
                    font-weight: 700;
                    color: #111827;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin: 0 0 16px 0;
                }
                
                .list-item {
                    font-size: 14px;
                    color: #4B5563;
                    line-height: 1.7;
                    margin: 0 0 12px 0;
                    padding-left: 24px;
                    position: relative;
                }
                
                .list-item:before {
                    content: '•';
                    position: absolute;
                    left: 8px;
                    color: #3B82F6;
                    font-weight: bold;
                }
                
                .divider-line {
                    height: 1px;
                    background-color: #E5E7EB;
                    margin: 32px 0;
                }
                
                .footer-section {
                    background-color: #F9FAFB;
                    padding: 40px 48px;
                    border-top: 1px solid #E5E7EB;
                }
                
                .footer-brand {
                    text-align: center;
                    margin: 0 0 24px 0;
                }
                
                .footer-brand-name {
                    font-size: 18px;
                    font-weight: 700;
                    color: #111827;
                    letter-spacing: 3px;
                    margin: 0 0 4px 0;
                }
                
                .footer-brand-desc {
                    font-size: 11px;
                    color: #6B7280;
                    letter-spacing: 1px;
                    margin: 0;
                }
                
                .footer-text {
                    font-size: 13px;
                    color: #6B7280;
                    text-align: center;
                    line-height: 1.6;
                    margin: 12px 0;
                }
                
                .footer-link {
                    color: #2563EB;
                    text-decoration: none;
                    font-weight: 500;
                }
                
                .footer-link:hover {
                    color: #1D4ED8;
                }
                
                .footer-copyright {
                    font-size: 11px;
                    color: #9CA3AF;
                    text-align: center;
                    line-height: 1.7;
                    margin: 24px 0 0 0;
                }
                
                @media only screen and (max-width: 600px) {
                    .header-section,
                    .section-title,
                    .content-area,
                    .footer-section {
                        padding-left: 24px;
                        padding-right: 24px;
                    }
                    
                    .brand-name {
                        font-size: 26px;
                        letter-spacing: 3px;
                    }
                    
                    .highlight-code {
                        font-size: 32px;
                        letter-spacing: 10px;
                    }
                    
                    .credential-label,
                    .credential-value {
                        display: block;
                        width: 100%;
                    }
                    
                    .credential-label {
                        padding-bottom: 8px;
                    }
                    
                    .credential-value {
                        padding-top: 0;
                        word-break: break-all;
                    }
                }
            </style>
        ";

        public static string GetWelcomeEmailTemplate(string firstName, string email, string temporaryPassword)
        {
            return $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <meta http-equiv=""X-UA-Compatible"" content=""IE=edge"">
    <meta name=""color-scheme"" content=""light dark"">
    <meta name=""supported-color-schemes"" content=""light dark"">
    <title>Welcome to EEPZ</title>
    {BaseStyle}
</head>
<body>
    <table class=""email-wrapper"" width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
        <tr>
            <td align=""center"">
                <table class=""email-container"" width=""600"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                    <tr>
                        <td width=""4"" class=""brand-bar""></td>
                        <td>
                            <table width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                                <tr>
                                    <td class=""header-section"">
                                        <h1 class=""brand-name"">EEPZ</h1>
                                        <p class=""brand-subtitle"">Employee Engagement Platform</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td class=""section-title"">Account Created</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Welcome, {firstName}</p>
                                        
                                        <p class=""text-primary"">
                                            Your EEPZ account has been successfully created. You now have access to our employee engagement platform.
                                        </p>
                                        
                                        <p class=""text-secondary"">
                                            Below are your login credentials. Store them securely.
                                        </p>
                                        
                                        <table class=""credential-table"" width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                                            <tr class=""credential-row"">
                                                <td class=""credential-label"">Email</td>
                                                <td class=""credential-value"">{email}</td>
                                            </tr>
                                            <tr class=""credential-row"">
                                                <td class=""credential-label"">Password</td>
                                                <td class=""credential-value"">{temporaryPassword}</td>
                                            </tr>
                                        </table>
                                        
                                        <div class=""notice-bar info"">
                                            <p class=""notice-title"">Required Action</p>
                                            <p class=""notice-text"">
                                                You must change your password upon first login. This is a mandatory security requirement.
                                            </p>
                                        </div>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <div class=""list-section"">
                                            <p class=""list-heading"">Next Steps</p>
                                            <p class=""list-item"">Log in with your credentials</p>
                                            <p class=""list-item"">Complete password reset</p>
                                            <p class=""list-item"">Explore your dashboard</p>
                                            <p class=""list-item"">Update profile settings</p>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class=""footer-section"">
                                        <div class=""footer-brand"">
                                            <p class=""footer-brand-name"">EEPZ</p>
                                            <p class=""footer-brand-desc"">Employee Engagement Platform</p>
                                        </div>
                                        <p class=""footer-text"">
                                            Support: <a href=""mailto:eepzmailservice@gmail.com"" class=""footer-link"">eepzmailservice@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            © {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
                                            This is an automated message.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }

        public static string GetOtpEmailTemplate(string firstName, string otpCode, string otpType, int expirationMinutes)
        {
            string purpose = otpType switch
            {
                "Login2FA" => "complete secure authentication",
                "ForgotPassword" => "reset your password",
                "EmailVerification" => "verify your email address",
                _ => "complete verification"
            };

            return $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <meta http-equiv=""X-UA-Compatible"" content=""IE=edge"">
    <meta name=""color-scheme"" content=""light dark"">
    <meta name=""supported-color-schemes"" content=""light dark"">
    <title>Verification Code</title>
    {BaseStyle}
</head>
<body>
    <table class=""email-wrapper"" width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
        <tr>
            <td align=""center"">
                <table class=""email-container"" width=""600"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                    <tr>
                        <td width=""4"" class=""brand-bar""></td>
                        <td>
                            <table width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                                <tr>
                                    <td class=""header-section"">
                                        <h1 class=""brand-name"">EEPZ</h1>
                                        <p class=""brand-subtitle"">Employee Engagement Platform</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td class=""section-title"">Verification Required</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Hello, {firstName}</p>
                                        
                                        <p class=""text-primary"">
                                            You have requested to {purpose}. Use the verification code below to proceed.
                                        </p>
                                        
                                        <div class=""highlight-container"">
                                            <p class=""highlight-label"">Verification Code</p>
                                            <h2 class=""highlight-code"">{otpCode}</h2>
                                            <p class=""highlight-expiry"">Valid for {expirationMinutes} minutes</p>
                                        </div>
                                        
                                        <div class=""notice-bar"">
                                            <p class=""notice-title"">Important</p>
                                            <p class=""notice-text"">
                                                This code expires in {expirationMinutes} minutes. Never share this code with anyone.
                                            </p>
                                        </div>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <div class=""list-section"">
                                            <p class=""list-heading"">Security Guidelines</p>
                                            <p class=""list-item"">Never share this code</p>
                                            <p class=""list-item"">EEPZ will never request codes</p>
                                            <p class=""list-item"">Request new code if expired</p>
                                        </div>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <p class=""text-secondary"">
                                            If you did not request this code, please ignore this email.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td class=""footer-section"">
                                        <div class=""footer-brand"">
                                            <p class=""footer-brand-name"">EEPZ</p>
                                            <p class=""footer-brand-desc"">Employee Engagement Platform</p>
                                        </div>
                                        <p class=""footer-text"">
                                            Support: <a href=""mailto:eepzmailservice@gmail.com"" class=""footer-link"">eepzmailservice@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            © {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
                                            This is an automated message.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }

        public static string GetPasswordResetConfirmationTemplate(string firstName)
        {
            return $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <meta http-equiv=""X-UA-Compatible"" content=""IE=edge"">
    <meta name=""color-scheme"" content=""light dark"">
    <meta name=""supported-color-schemes"" content=""light dark"">
    <title>Password Reset Successful</title>
    {BaseStyle}
</head>
<body>
    <table class=""email-wrapper"" width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
        <tr>
            <td align=""center"">
                <table class=""email-container"" width=""600"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                    <tr>
                        <td width=""4"" class=""brand-bar""></td>
                        <td>
                            <table width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                                <tr>
                                    <td class=""header-section"">
                                        <h1 class=""brand-name"">EEPZ</h1>
                                        <p class=""brand-subtitle"">Employee Engagement Platform</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td class=""section-title"">Password Reset Complete</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Hello, {firstName}</p>
                                        
                                        <p class=""text-primary"">
                                            Your password has been successfully reset. You can now log in to your EEPZ account with your new credentials.
                                        </p>
                                        
                                        <div class=""notice-bar success"">
                                            <p class=""notice-title"">Confirmed</p>
                                            <p class=""notice-text"">
                                                Your account security has been updated successfully.
                                            </p>
                                        </div>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <div class=""list-section"">
                                            <p class=""list-heading"">Security Recommendations</p>
                                            <p class=""list-item"">Use unique passwords</p>
                                            <p class=""list-item"">Enable two-factor authentication</p>
                                            <p class=""list-item"">Update passwords regularly</p>
                                            <p class=""list-item"">Use password managers</p>
                                        </div>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <div class=""notice-bar error"">
                                            <p class=""notice-title"">Did Not Make This Change?</p>
                                            <p class=""notice-text"">
                                                If you did not reset your password, contact support immediately at eepzmailservice@gmail.com
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class=""footer-section"">
                                        <div class=""footer-brand"">
                                            <p class=""footer-brand-name"">EEPZ</p>
                                            <p class=""footer-brand-desc"">Employee Engagement Platform</p>
                                        </div>
                                        <p class=""footer-text"">
                                            Support: <a href=""mailto:eepzmailservice@gmail.com"" class=""footer-link"">eepzmailservice@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            © {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
                                            This is an automated message.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }

        public static string GetChangeRequestNotificationTemplate(string firstName, string changeType, string newValue)
        {
            string changeTypeDisplay = changeType switch
            {
                "Email" => "Email Address",
                "EmployeeCompanyId" => "Employee ID",
                "Mobile" => "Mobile Number",
                "Address" => "Address",
                _ => changeType
            };

            return $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <meta http-equiv=""X-UA-Compatible"" content=""IE=edge"">
    <meta name=""color-scheme"" content=""light dark"">
    <meta name=""supported-color-schemes"" content=""light dark"">
    <title>Change Request Submitted</title>
    {BaseStyle}
</head>
<body>
    <table class=""email-wrapper"" width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
        <tr>
            <td align=""center"">
                <table class=""email-container"" width=""600"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                    <tr>
                        <td width=""4"" class=""brand-bar""></td>
                        <td>
                            <table width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                                <tr>
                                    <td class=""header-section"">
                                        <h1 class=""brand-name"">EEPZ</h1>
                                        <p class=""brand-subtitle"">Employee Engagement Platform</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td class=""section-title"">Change Request Submitted</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Hello, {firstName}</p>
                                        
                                        <p class=""text-primary"">
                                            Your account information change request has been submitted and is pending administrative review.
                                        </p>
                                        
                                        <table class=""credential-table"" width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                                            <tr class=""credential-row"">
                                                <td class=""credential-label"">Change Type</td>
                                                <td class=""credential-value"">{changeTypeDisplay}</td>
                                            </tr>
                                            <tr class=""credential-row"">
                                                <td class=""credential-label"">New Value</td>
                                                <td class=""credential-value"">{newValue}</td>
                                            </tr>
                                            <tr class=""credential-row"">
                                                <td class=""credential-label"">Status</td>
                                                <td class=""credential-value"">Pending</td>
                                            </tr>
                                            <tr class=""credential-row"">
                                                <td class=""credential-label"">Submitted</td>
                                                <td class=""credential-value"">{DateTime.UtcNow:MMM dd, yyyy HH:mm} UTC</td>
                                            </tr>
                                        </table>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <div class=""list-section"">
                                            <p class=""list-heading"">Next Steps</p>
                                            <p class=""list-item"">Administrator reviews within 1-2 business days</p>
                                            <p class=""list-item"">Email notification upon decision</p>
                                            <p class=""list-item"">Automatic update if approved</p>
                                            <p class=""list-item"">Contact if more information needed</p>
                                        </div>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <div class=""notice-bar info"">
                                            <p class=""notice-title"">Track Request</p>
                                            <p class=""notice-text"">
                                                Monitor your request status in your EEPZ dashboard under My Requests.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class=""footer-section"">
                                        <div class=""footer-brand"">
                                            <p class=""footer-brand-name"">EEPZ</p>
                                            <p class=""footer-brand-desc"">Employee Engagement Platform</p>
                                        </div>
                                        <p class=""footer-text"">
                                            Support: <a href=""mailto:eepzmailservice@gmail.com"" class=""footer-link"">eepzmailservice@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            © {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
                                            This is an automated message.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }
    }
}
