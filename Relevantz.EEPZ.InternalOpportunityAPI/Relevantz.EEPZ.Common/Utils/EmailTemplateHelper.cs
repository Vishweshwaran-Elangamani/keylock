namespace Relevantz.EEPZ.Common.Utils
{
    public static class EmailTemplateHelper
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

        public static string GetNominationCreatedTemplate(string employeeName, string opportunityName, string nominatedByName)
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
    <title>Nomination Received</title>
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
                            <p class=""header-tag"">Nomination Received</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Congratulations, {employeeName}!</h2>
                            <p class=""subtitle"">You have been nominated for an internal opportunity.</p>
                            
                            <table class=""info-table"" cellpadding=""0"" cellspacing=""0"">
                                <tr class=""info-row"">
                                    <td class=""info-label"">Opportunity</td>
                                    <td class=""info-value"">{opportunityName}</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">Nominated By</td>
                                    <td class=""info-value"">{nominatedByName}</td>
                                </tr>
                            </table>
                            
                            <div class=""alert alert-info"">
                                <strong>Next Steps:</strong> Log in to the EEPZ portal to view details and track your nomination status.
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

        public static string GetL2ReviewRequestTemplate(string l2Name, string nomineeName, string opportunityName)
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
    <title>Review Request</title>
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
                            <p class=""header-tag"">Action Required</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Review Nomination</h2>
                            <p class=""subtitle"">Hi {l2Name}, <strong>{nomineeName}</strong> has been nominated for <strong>{opportunityName}</strong>. Your review is required as the reporting manager.</p>
                            
                            <div class=""alert alert-info"">
                                <strong>Action Required:</strong> Log in to the EEPZ portal to review and approve/reject this nomination.
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

        public static string GetL2ApprovedTemplate(string nomineeName, string opportunityName, string l2Name)
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
    <title>Nomination Approved</title>
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
                            <p class=""header-tag"">Manager Approved</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Great News!</h2>
                            <p class=""subtitle"">Hi {nomineeName}, your manager <strong>{l2Name}</strong> has approved your nomination for <strong>{opportunityName}</strong>.</p>
                            
                            <table class=""info-table"" cellpadding=""0"" cellspacing=""0"">
                                <tr class=""info-row"">
                                    <td class=""info-label"">Status</td>
                                    <td class=""info-value"">✓ Manager Approved</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">Next Stage</td>
                                    <td class=""info-value"">Department Head Review</td>
                                </tr>
                            </table>
                            
                            <div class=""alert alert-success"">
                                <strong>Next Steps:</strong> Your nomination is pending Department Head review. You'll be notified once a decision is made.
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

        public static string GetL2RejectedTemplate(string nomineeName, string opportunityName, string l2Name, string reason)
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
    <title>Nomination Status Update</title>
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
                            <p class=""header-tag"">Nomination Update</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Nomination Status</h2>
                            <p class=""subtitle"">Hi {nomineeName}, your nomination for <strong>{opportunityName}</strong> has been rejected by your manager <strong>{l2Name}</strong>.</p>
                            
                            <div class=""alert alert-error"">
                                <strong>Reason:</strong> {reason}
                            </div>
                            
                            <div class=""divider""></div>
                            
                            <p class=""subtitle"">Contact your manager for clarification. Keep developing your skills for future opportunities!</p>
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

        public static string GetDeptHeadReviewRequestTemplate(string deptHeadName, string nomineeName, string opportunityName)
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
    <title>Final Review Required</title>
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
                            <p class=""header-tag"">Final Review Required</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Final Approval Needed</h2>
                            <p class=""subtitle"">Hi {deptHeadName}, <strong>{nomineeName}</strong>'s nomination for <strong>{opportunityName}</strong> requires your final approval. The reporting manager has already approved.</p>
                            
                            <div class=""alert alert-info"">
                                <strong>Action Required:</strong> Log in to the EEPZ portal to review and provide your final decision.
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

        public static string GetDeptHeadApprovedTemplate(string nomineeName, string opportunityName, string deptHeadName)
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
    <title>Nomination Approved!</title>
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
                            <p class=""header-tag"">🎉 Approved!</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Congratulations, {nomineeName}!</h2>
                            <p class=""subtitle"">Your nomination for <strong>{opportunityName}</strong> has been <strong>APPROVED</strong> by Department Head <strong>{deptHeadName}</strong>.</p>
                            
                            <table class=""info-table"" cellpadding=""0"" cellspacing=""0"">
                                <tr class=""info-row"">
                                    <td class=""info-label"">Status</td>
                                    <td class=""info-value"">✓ Approved</td>
                                </tr>
                                <tr class=""info-row"">
                                    <td class=""info-label"">Approved By</td>
                                    <td class=""info-value"">{deptHeadName}</td>
                                </tr>
                            </table>
                            
                            <div class=""alert alert-success"">
                                <strong>Next Steps:</strong> This is the final approval. HR will contact you shortly. Well done!
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

        public static string GetDeptHeadApprovedToL2Template(string l2Name, string nomineeName, string opportunityName)
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
    <title>Nomination Approved</title>
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
                            <p class=""header-tag"">Nomination Approved</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Team Member Success</h2>
                            <p class=""subtitle"">Hi {l2Name}, <strong>{nomineeName}</strong>'s nomination for <strong>{opportunityName}</strong> has been approved by the Department Head.</p>
                            
                            <div class=""alert alert-success"">
                                <strong>Congratulations</strong> to your team member! HR will handle the next steps.
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

        public static string GetDeptHeadRejectedToL2Template(string l2Name, string nomineeName, string opportunityName, string reason)
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
    <title>Re-review Required</title>
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
                            <p class=""header-tag"">Re-review Required</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Action Required</h2>
                            <p class=""subtitle"">Hi {l2Name}, the Department Head has sent back <strong>{nomineeName}</strong>'s nomination for <strong>{opportunityName}</strong> for re-review.</p>
                            
                            <div class=""alert alert-info"">
                                <strong>Department Head Feedback:</strong> {reason}
                            </div>
                            
                            <div class=""divider""></div>
                            
                            <p class=""subtitle"">Log in to the EEPZ portal to review and provide your updated decision.</p>
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

        public static string GetDeptHeadRejectedToNomineeTemplate(string nomineeName, string opportunityName, string reason)
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
    <title>Nomination Status Update</title>
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
                            <p class=""header-tag"">Under Re-review</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Nomination Update</h2>
                            <p class=""subtitle"">Hi {nomineeName}, your nomination for <strong>{opportunityName}</strong> is under re-review by your manager.</p>
                            
                            <div class=""alert alert-info"">
                                <strong>Department Head Feedback:</strong> {reason}
                            </div>
                            
                            <div class=""divider""></div>
                            
                            <p class=""subtitle"">You'll be notified once your manager completes the re-review. Check the EEPZ portal for updates.</p>
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

        public static string GetL2ReApprovedTemplate(string nomineeName, string opportunityName, string l2Name)
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
    <title>Nomination Re-approved</title>
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
                            <p class=""header-tag"">Re-approved</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Great News!</h2>
                            <p class=""subtitle"">Hi {nomineeName}, your manager <strong>{l2Name}</strong> has re-approved your nomination for <strong>{opportunityName}</strong>.</p>
                            
                            <div class=""alert alert-success"">
                                <strong>Next Steps:</strong> Your nomination is pending Department Head final review. You'll be notified once a decision is made.
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

        public static string GetL2ReApprovedToDeptHeadTemplate(string deptHeadName, string nomineeName, string opportunityName)
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
    <title>Re-review Required</title>
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
                            <p class=""header-tag"">Re-review Required</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Action Required</h2>
                            <p class=""subtitle"">Hi {deptHeadName}, <strong>{nomineeName}</strong>'s nomination for <strong>{opportunityName}</strong> has been re-approved by the reporting manager.</p>
                            
                            <div class=""alert alert-info"">
                                <strong>Action Required:</strong> Log in to the EEPZ portal to review this nomination again for final approval.
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

        public static string GetL2ReRejectedTemplate(string nomineeName, string opportunityName, string l2Name, string reason)
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
    <title>Nomination Rejected - FINAL</title>
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
                            <p class=""header-tag"">Final Decision</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Final Decision</h2>
                            <p class=""subtitle"">Hi {nomineeName}, your nomination for <strong>{opportunityName}</strong> has been rejected by your manager <strong>{l2Name}</strong> after re-review.</p>
                            
                            <div class=""alert alert-error"">
                                <strong>Reason:</strong> {reason}
                            </div>
                            
                            <div class=""divider""></div>
                            
                            <p class=""subtitle"">This is a <strong>final decision</strong>. Contact your manager for clarification. Keep developing your skills for future opportunities!</p>
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
