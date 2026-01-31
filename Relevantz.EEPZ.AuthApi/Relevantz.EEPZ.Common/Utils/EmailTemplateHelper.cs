namespace Relevantz.EEPZ.Common.Utils
{
    public class EmailTemplateHelper
    {
        private const string BaseStyle = @"
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                :root {
                    color-scheme: light dark;
                    supported-color-schemes: light dark;
                }
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Inter', Arial, sans-serif;
                    background-color: #f5f5f5;
                    color: #333333;
                }
                
                table {
                    border-spacing: 0;
                    border-collapse: collapse;
                }
                
                .email-wrapper {
                    width: 100%;
                    background-color: #f5f5f5;
                    padding: 20px 10px;
                }
                
                .email-container {
                    max-width: 580px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }
                
                .header {
                    background-color: #2563eb;
                    padding: 20px 24px;
                    text-align: center;
                }
                
                .header-logo {
                    font-size: 24px;
                    font-weight: 700;
                    color: #ffffff;
                    letter-spacing: 3px;
                    margin: 0;
                }
                
                .header-tag {
                    font-size: 11px;
                    color: rgba(255,255,255,0.9);
                    margin: 4px 0 0 0;
                    font-weight: 500;
                }
                
                .content {
                    padding: 24px;
                }
                
                .title {
                    font-size: 20px;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin: 0 0 8px 0;
                }
                
                .subtitle {
                    font-size: 14px;
                    color: #666666;
                    margin: 0 0 20px 0;
                    line-height: 1.5;
                }
                
                .info-table {
                    width: 100%;
                    background-color: #f8f9fa;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    margin: 16px 0;
                }
                
                .info-row {
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .info-row:last-child {
                    border-bottom: none;
                }
                
                .info-label {
                    padding: 12px 16px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #6b7280;
                    width: 35%;
                    vertical-align: top;
                }
                
                .info-value {
                    padding: 12px 16px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #1a1a1a;
                    word-break: break-word;
                }
                
                .code-container {
                    background-color: #eff6ff;
                    border: 2px solid #2563eb;
                    border-radius: 6px;
                    padding: 20px;
                    text-align: center;
                    margin: 16px 0;
                }
                
                .code-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #2563eb;
                    margin: 0 0 10px 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .code-number {
                    font-size: 36px;
                    font-weight: 700;
                    color: #1e40af;
                    letter-spacing: 8px;
                    margin: 8px 0;
                    font-family: 'Courier New', monospace;
                }
                
                .code-expiry {
                    font-size: 12px;
                    color: #4b5563;
                    margin: 10px 0 0 0;
                }
                
                .alert {
                    padding: 12px 16px;
                    border-radius: 6px;
                    margin: 16px 0;
                    font-size: 13px;
                    line-height: 1.5;
                    border-left: 3px solid;
                }
                
                .alert-info {
                    background-color: #e0f2fe;
                    border-left-color: #0ea5e9;
                    color: #0c4a6e;
                }
                
                .alert-success {
                    background-color: #d1fae5;
                    border-left-color: #10b981;
                    color: #065f46;
                }
                
                .alert-warning {
                    background-color: #fef3c7;
                    border-left-color: #f59e0b;
                    color: #78350f;
                }
                
                .alert-error {
                    background-color: #fee2e2;
                    border-left-color: #ef4444;
                    color: #7f1d1d;
                }
                
                .steps {
                    margin: 16px 0;
                }
                
                .step {
                    padding: 8px 0;
                    font-size: 14px;
                    color: #4b5563;
                    padding-left: 24px;
                    position: relative;
                }
                
                .step:before {
                    content: '→';
                    position: absolute;
                    left: 0;
                    color: #2563eb;
                    font-weight: 700;
                }
                
                .divider {
                    height: 1px;
                    background-color: #e5e7eb;
                    margin: 20px 0;
                }
                
                .footer {
                    background-color: #f8f9fa;
                    padding: 20px 24px;
                    text-align: center;
                    border-top: 1px solid #e5e7eb;
                }
                
                .footer-brand {
                    font-size: 14px;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin: 0 0 8px 0;
                }
                
                .footer-text {
                    font-size: 12px;
                    color: #6b7280;
                    margin: 4px 0;
                    line-height: 1.5;
                }
                
                .footer-link {
                    color: #2563eb;
                    text-decoration: none;
                }
                
                @media (prefers-color-scheme: dark) {
                    body {
                        background-color: #0a0a0a;
                        color: #e5e5e5;
                    }
                    
                    .email-wrapper {
                        background-color: #0a0a0a;
                    }
                    
                    .email-container {
                        background-color: #1a1a1a;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    }
                    
                    .header {
                        background-color: #1e40af;
                    }
                    
                    .content {
                        background-color: #1a1a1a;
                    }
                    
                    .title {
                        color: #f5f5f5;
                    }
                    
                    .subtitle {
                        color: #a3a3a3;
                    }
                    
                    .info-table {
                        background-color: #262626;
                        border-color: #404040;
                    }
                    
                    .info-row {
                        border-color: #404040;
                    }
                    
                    .info-label {
                        color: #a3a3a3;
                    }
                    
                    .info-value {
                        color: #e5e5e5;
                    }
                    
                    .code-container {
                        background-color: #1e293b;
                        border-color: #3b82f6;
                    }
                    
                    .code-label {
                        color: #60a5fa;
                    }
                    
                    .code-number {
                        color: #93c5fd;
                    }
                    
                    .code-expiry {
                        color: #cbd5e1;
                    }
                    
                    .alert-info {
                        background-color: #0c2340;
                        border-left-color: #3b82f6;
                        color: #bfdbfe;
                    }
                    
                    .alert-success {
                        background-color: #052e16;
                        border-left-color: #22c55e;
                        color: #bbf7d0;
                    }
                    
                    .alert-warning {
                        background-color: #422006;
                        border-left-color: #f59e0b;
                        color: #fde68a;
                    }
                    
                    .alert-error {
                        background-color: #450a0a;
                        border-left-color: #ef4444;
                        color: #fecaca;
                    }
                    
                    .step {
                        color: #a3a3a3;
                    }
                    
                    .step:before {
                        color: #3b82f6;
                    }
                    
                    .divider {
                        background-color: #404040;
                    }
                    
                    .footer {
                        background-color: #0d0d0d;
                        border-top-color: #404040;
                    }
                    
                    .footer-brand {
                        color: #f5f5f5;
                    }
                    
                    .footer-text {
                        color: #737373;
                    }
                    
                    .footer-link {
                        color: #60a5fa;
                    }
                }
                
                @media only screen and (max-width: 600px) {
                    .email-wrapper {
                        padding: 10px 5px;
                    }
                    
                    .content,
                    .footer {
                        padding: 20px 16px;
                    }
                    
                    .header {
                        padding: 16px;
                    }
                    
                    .code-number {
                        font-size: 28px;
                        letter-spacing: 6px;
                    }
                    
                    .info-label,
                    .info-value {
                        display: block;
                        width: 100%;
                        padding: 10px 12px;
                    }
                    
                    .info-label {
                        padding-bottom: 4px;
                        border-bottom: none;
                    }
                    
                    .info-value {
                        padding-top: 0;
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
    <table class=""email-wrapper"" width=""100%"" cellpadding=""0"" cellspacing=""0"">
        <tr>
            <td align=""center"">
                <table class=""email-container"" cellpadding=""0"" cellspacing=""0"">
                    <tr>
                        <td class=""header"">
                            <h1 class=""header-logo"">EEPZ</h1>
                            <p class=""header-tag"">Employee Engagement Platform Zone</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Welcome, {firstName}!</h2>
                            <p class=""subtitle"">Your account has been created successfully. Use the credentials below to access your account.</p>
                            
                            <table class=""info-table"" cellpadding=""0"" cellspacing=""0"">
                                <tr class=""info-row"">
                                    <td class=""info-label"">Email</td>
                                    <td class=""info-value"">{email}</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">Password</td>
                                    <td class=""info-value"">{temporaryPassword}</td>
                                </tr>
                            </table>
                            
                            <div class=""alert alert-info"">
                                You must change your password on first login for security.
                            </div>
                            
                            <div class=""divider""></div>
                            
                            <div class=""steps"">
                                <div class=""step"">Login with your credentials</div>
                                <div class=""step"">Complete password reset</div>
                                <div class=""step"">Update your profile</div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class=""footer"">
                            <p class=""footer-brand"">EEPZ</p>
                            <p class=""footer-text"">
                                Support: <a href=""mailto:emailserviceeepz@gmail.com"" class=""footer-link"">emailserviceeepz@gmail.com</a>
                            </p>
                            <p class=""footer-text"">© {DateTime.UtcNow.Year} EEPZ. All rights reserved.</p>
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
                "Login2FA" => "two-factor authentication",
                "ForgotPassword" => "password reset",
                "EmailVerification" => "email verification",
                _ => "verification"
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
    <table class=""email-wrapper"" width=""100%"" cellpadding=""0"" cellspacing=""0"">
        <tr>
            <td align=""center"">
                <table class=""email-container"" cellpadding=""0"" cellspacing=""0"">
                    <tr>
                        <td class=""header"">
                            <h1 class=""header-logo"">EEPZ</h1>
                            <p class=""header-tag"">Verification Required</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Hello, {firstName}</h2>
                            <p class=""subtitle"">Your verification code for {purpose}.</p>
                            
                            <div class=""code-container"">
                                <p class=""code-label"">Verification Code</p>
                                <div class=""code-number"">{otpCode}</div>
                                <p class=""code-expiry"">Expires in {expirationMinutes} minutes</p>
                            </div>
                            
                            <div class=""alert alert-warning"">
                                Never share this code. EEPZ will never ask for it via email or phone.
                            </div>
                            
                            <div class=""divider""></div>
                            
                            <p class=""subtitle"">If you didn't request this code, please ignore this email.</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""footer"">
                            <p class=""footer-brand"">EEPZ</p>
                            <p class=""footer-text"">
                                Support: <a href=""mailto:emailserviceeepz@gmail.com"" class=""footer-link"">emailserviceeepz@gmail.com</a>
                            </p>
                            <p class=""footer-text"">© {DateTime.UtcNow.Year} EEPZ. All rights reserved.</p>
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
    <table class=""email-wrapper"" width=""100%"" cellpadding=""0"" cellspacing=""0"">
        <tr>
            <td align=""center"">
                <table class=""email-container"" cellpadding=""0"" cellspacing=""0"">
                    <tr>
                        <td class=""header"">
                            <h1 class=""header-logo"">EEPZ</h1>
                            <p class=""header-tag"">Password Updated</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Password Reset Complete</h2>
                            <p class=""subtitle"">Hello {firstName}, your password has been successfully reset. You can now login with your new password.</p>
                            
                            <div class=""alert alert-success"">
                                Your account security has been updated successfully.
                            </div>
                            
                            <div class=""divider""></div>
                            
                            <div class=""steps"">
                                <div class=""step"">Use unique passwords for each account</div>
                                <div class=""step"">Enable two-factor authentication</div>
                                <div class=""step"">Update passwords regularly</div>
                            </div>
                            
                            <div class=""divider""></div>
                            
                            <div class=""alert alert-error"">
                                Didn't make this change? Contact support immediately at emailserviceeepz@gmail.com
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class=""footer"">
                            <p class=""footer-brand"">EEPZ</p>
                            <p class=""footer-text"">
                                Support: <a href=""mailto:emailserviceeepz@gmail.com"" class=""footer-link"">emailserviceeepz@gmail.com</a>
                            </p>
                            <p class=""footer-text"">© {DateTime.UtcNow.Year} EEPZ. All rights reserved.</p>
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
    <table class=""email-wrapper"" width=""100%"" cellpadding=""0"" cellspacing=""0"">
        <tr>
            <td align=""center"">
                <table class=""email-container"" cellpadding=""0"" cellspacing=""0"">
                    <tr>
                        <td class=""header"">
                            <h1 class=""header-logo"">EEPZ</h1>
                            <p class=""header-tag"">Change Request Pending</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Request Submitted</h2>
                            <p class=""subtitle"">Hello {firstName}, your change request has been submitted and is under review.</p>
                            
                            <table class=""info-table"" cellpadding=""0"" cellspacing=""0"">
                                <tr class=""info-row"">
                                    <td class=""info-label"">Change Type</td>
                                    <td class=""info-value"">{changeTypeDisplay}</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">New Value</td>
                                    <td class=""info-value"">{newValue}</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">Status</td>
                                    <td class=""info-value"">Pending Review</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">Submitted</td>
                                    <td class=""info-value"">{DateTime.UtcNow:MMM dd, yyyy HH:mm} UTC</td>
                                </tr>
                            </table>
                            
                            <div class=""alert alert-info"">
                                Track your request status in Dashboard → My Requests
                            </div>
                            
                            <div class=""divider""></div>
                            
                            <div class=""steps"">
                                <div class=""step"">Admin reviews within 1-2 business days</div>
                                <div class=""step"">Email notification on decision</div>
                                <div class=""step"">Automatic update if approved</div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class=""footer"">
                            <p class=""footer-brand"">EEPZ</p>
                            <p class=""footer-text"">
                                Support: <a href=""mailto:emailserviceeepz@gmail.com"" class=""footer-link"">emailserviceeepz@gmail.com</a>
                            </p>
                            <p class=""footer-text"">© {DateTime.UtcNow.Year} EEPZ. All rights reserved.</p>
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
