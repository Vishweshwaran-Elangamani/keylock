namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public static class EmailTemplates
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

        public static string SlaReminder(string name, string slaType, DateTime dueDate)
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
    <title>SLA Reminder</title>
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
                            <p class=""header-tag"">SLA Reminder</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">SLA Due Soon</h2>
                            <p class=""subtitle"">Hello <strong>{name}</strong>, this is a reminder that the following SLA is approaching its due date.</p>
                            
                            <table class=""info-table"" cellpadding=""0"" cellspacing=""0"">
                                <tr class=""info-row"">
                                    <td class=""info-label"">SLA Type</td>
                                    <td class=""info-value"">{slaType}</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">Due Date</td>
                                    <td class=""info-value"">{dueDate:MMMM dd, yyyy}</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">Days Remaining</td>
                                    <td class=""info-value"">{(dueDate - DateTime.UtcNow).Days} days</td>
                                </tr>
                            </table>
                            
                            <div class=""alert alert-warning"">
                                <strong>Action Required:</strong> Please review and complete this SLA before the due date to avoid escalation.
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

        public static string SlaOverdue(string name, string slaType, DateTime dueDate, int days)
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
    <title>SLA Overdue</title>
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
                            <p class=""header-tag"">SLA Overdue</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Urgent: SLA Overdue</h2>
                            <p class=""subtitle"">Hello <strong>{name}</strong>, the following SLA has passed its due date and requires immediate attention.</p>
                            
                            <table class=""info-table"" cellpadding=""0"" cellspacing=""0"">
                                <tr class=""info-row"">
                                    <td class=""info-label"">SLA Type</td>
                                    <td class=""info-value"">{slaType}</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">Due Date</td>
                                    <td class=""info-value"">{dueDate:MMMM dd, yyyy}</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">Overdue By</td>
                                    <td class=""info-value"">{days} day{(days != 1 ? "s" : "")}</td>
                                </tr>
                            </table>
                            
                            <div class=""alert alert-error"">
                                <strong>Immediate Action Required:</strong> This SLA is overdue by {days} day{(days != 1 ? "s" : "")}. Please address this urgently to avoid further escalation.
                            </div>
                            
                            <div class=""divider""></div>
                            
                            <p class=""subtitle"">Contact your manager if you need assistance or require an extension.</p>
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

        public static string Escalation(string name, string slaType, string reason)
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
    <title>SLA Escalation</title>
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
                            <p class=""header-tag"">SLA Escalation</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Escalation Submitted</h2>
                            <p class=""subtitle""><strong>{name}</strong> has escalated an SLA for management review.</p>
                            
                            <table class=""info-table"" cellpadding=""0"" cellspacing=""0"">
                                <tr class=""info-row"">
                                    <td class=""info-label"">Escalated By</td>
                                    <td class=""info-value"">{name}</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">SLA Type</td>
                                    <td class=""info-value"">{slaType}</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">Escalation Date</td>
                                    <td class=""info-value"">{DateTime.UtcNow:MMMM dd, yyyy HH:mm} UTC</td>
                                </tr>
                            </table>
                            
                            <div class=""divider""></div>
                            
                            <div class=""alert alert-warning"">
                                <strong>Escalation Reason:</strong><br/>
                                {reason}
                            </div>
                            
                            <div class=""divider""></div>
                            
                            <p class=""subtitle"">Management will review this escalation and provide guidance. Check the EEPZ portal for updates.</p>
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

        public static string Completion(string name, string slaType, DateTime date)
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
    <title>SLA Completed</title>
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
                            <p class=""header-tag"">SLA Completed</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">SLA Completed Successfully</h2>
                            <p class=""subtitle"">Hello <strong>{name}</strong>, the following SLA has been completed.</p>
                            
                            <table class=""info-table"" cellpadding=""0"" cellspacing=""0"">
                                <tr class=""info-row"">
                                    <td class=""info-label"">SLA Type</td>
                                    <td class=""info-value"">{slaType}</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">Completed On</td>
                                    <td class=""info-value"">{date:MMMM dd, yyyy}</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">Status</td>
                                    <td class=""info-value"">Completed</td>
                                </tr>
                            </table>
                            
                            <div class=""alert alert-success"">
                                <strong>Well Done!</strong> This SLA has been successfully completed. Thank you for your timely action.
                            </div>
                            
                            <div class=""divider""></div>
                            
                            <p class=""subtitle"">You can view the completion details in the EEPZ portal under your SLA dashboard.</p>
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
