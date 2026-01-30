namespace Relevantz.EEPZ.Common.Utils
{
    public static class EmailTemplateHelper
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
                    body { background-color: #0A0A0A; }
                    .email-container { background-color: #1A1A1A; border: 1px solid #2A2A2A; }
                    .brand-bar { background-color: #2563EB; }
                    .header-section { background-color: #1A1A1A; border-bottom: 1px solid #2A2A2A; }
                    .brand-name { color: #FFFFFF; }
                    .brand-subtitle { color: #9CA3AF; }
                    .section-title { background-color: #2A2A2A; color: #E5E7EB; }
                    .content-area { background-color: #1A1A1A; }
                    .text-primary { color: #E5E7EB; }
                    .text-secondary { color: #9CA3AF; }
                    .credential-table { background-color: #111111; border: 1px solid #2A2A2A; }
                    .credential-label { color: #9CA3AF; background-color: #1A1A1A; }
                    .credential-value { color: #FFFFFF; background-color: #2A2A2A; }
                    .notice-bar { background-color: #2A2A2A; border-left: 3px solid #F59E0B; }
                    .notice-bar.success { border-left-color: #10B981; }
                    .notice-bar.error { border-left-color: #EF4444; }
                    .notice-bar.info { border-left-color: #3B82F6; }
                    .notice-text { color: #D1D5DB; }
                    .footer-section { background-color: #111111; border-top: 1px solid #2A2A2A; }
                    .footer-text { color: #6B7280; }
                    .footer-link { color: #60A5FA; }
                    .divider-line { background-color: #2A2A2A; }
                }
                
                table { border-spacing: 0; border-collapse: collapse; }
                td { padding: 0; }
                
                .email-wrapper { width: 100%; background-color: #FAFAFA; padding: 40px 0; }
                .email-container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E5E7EB; overflow: hidden; }
                .brand-bar { width: 4px; background-color: #2563EB; height: 100%; }
                .header-section { background-color: #FFFFFF; padding: 40px 48px; border-bottom: 1px solid #E5E7EB; }
                .brand-name { font-size: 32px; font-weight: 700; color: #111827; letter-spacing: 4px; margin: 0 0 8px 0; }
                .brand-subtitle { font-size: 12px; font-weight: 500; color: #6B7280; letter-spacing: 1.5px; text-transform: uppercase; margin: 0; }
                .section-title { background-color: #F9FAFB; padding: 16px 48px; font-size: 11px; font-weight: 700; color: #374151; letter-spacing: 2px; text-transform: uppercase; border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; }
                .content-area { padding: 40px 48px; background-color: #FFFFFF; }
                .greeting-text { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 24px 0; line-height: 1.5; }
                .text-primary { font-size: 15px; line-height: 1.7; color: #374151; margin: 0 0 16px 0; }
                .text-secondary { font-size: 14px; line-height: 1.6; color: #6B7280; margin: 0; }
                
                .credential-table { width: 100%; background-color: #F9FAFB; border: 1px solid #E5E7EB; margin: 32px 0; }
                .credential-row { border-bottom: 1px solid #E5E7EB; }
                .credential-row:last-child { border-bottom: none; }
                .credential-label { padding: 20px 24px; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 1.5px; background-color: #FAFAFA; width: 35%; }
                .credential-value { padding: 20px 24px; font-size: 14px; font-weight: 600; color: #111827; background-color: #FFFFFF; }
                
                .notice-bar { background-color: #F9FAFB; border-left: 3px solid #F59E0B; padding: 20px 24px; margin: 28px 0; }
                .notice-bar.success { border-left-color: #10B981; }
                .notice-bar.error { border-left-color: #EF4444; }
                .notice-bar.info { border-left-color: #3B82F6; }
                .notice-title { font-size: 12px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; }
                .notice-text { font-size: 14px; color: #4B5563; margin: 0; line-height: 1.6; }
                
                .list-section { margin: 28px 0; }
                .list-heading { font-size: 13px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; }
                .list-item { font-size: 14px; color: #4B5563; line-height: 1.7; margin: 0 0 12px 0; padding-left: 24px; position: relative; }
                .list-item:before { content: '•'; position: absolute; left: 8px; color: #3B82F6; font-weight: bold; }
                
                .divider-line { height: 1px; background-color: #E5E7EB; margin: 32px 0; }
                
                .footer-section { background-color: #F9FAFB; padding: 40px 48px; border-top: 1px solid #E5E7EB; }
                .footer-brand { text-align: center; margin: 0 0 24px 0; }
                .footer-brand-name { font-size: 18px; font-weight: 700; color: #111827; letter-spacing: 3px; margin: 0 0 4px 0; }
                .footer-brand-desc { font-size: 11px; color: #6B7280; letter-spacing: 1px; margin: 0; }
                .footer-text { font-size: 13px; color: #6B7280; text-align: center; line-height: 1.6; margin: 12px 0; }
                .footer-link { color: #2563EB; text-decoration: none; font-weight: 500; }
                .footer-link:hover { color: #1D4ED8; }
                .footer-copyright { font-size: 11px; color: #9CA3AF; text-align: center; line-height: 1.7; margin: 24px 0 0 0; }
                
                @media only screen and (max-width: 600px) {
                    .header-section, .section-title, .content-area, .footer-section { padding-left: 24px; padding-right: 24px; }
                    .brand-name { font-size: 26px; letter-spacing: 3px; }
                    .credential-label, .credential-value { display: block; width: 100%; }
                    .credential-label { padding-bottom: 8px; }
                    .credential-value { padding-top: 0; word-break: break-all; }
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
                                    <td class=""section-title"">Nomination Received</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Hi {employeeName},</p>
                                        
                                        <p class=""text-primary"">
                                            You have been nominated for the internal opportunity <strong>{opportunityName}</strong>.
                                        </p>
                                        
                                        <table class=""credential-table"" width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                                            <tr class=""credential-row"">
                                                <td class=""credential-label"">Opportunity</td>
                                                <td class=""credential-value"">{opportunityName}</td>
                                            </tr>
                                            <tr class=""credential-row"">
                                                <td class=""credential-label"">Nominated By</td>
                                                <td class=""credential-value"">{nominatedByName}</td>
                                            </tr>
                                        </table>
                                        
                                        <div class=""notice-bar info"">
                                            <p class=""notice-title"">Next Steps</p>
                                            <p class=""notice-text"">
                                                Please log in to the EEPZ portal to view more details about this opportunity and track your nomination status.
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
                                            Support: <a href=""mailto:eepz50532@gmail.com"" class=""footer-link"">eepz50532@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            &copy; {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
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
                                    <td class=""section-title"">Action Required: Review Nomination</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Hi {l2Name},</p>
                                        
                                        <p class=""text-primary"">
                                            <strong>{nomineeName}</strong> has been nominated for the internal opportunity <strong>{opportunityName}</strong>.
                                        </p>
                                        
                                        <p class=""text-secondary"">
                                            As the reporting manager (L2), your review is required.
                                        </p>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <div class=""notice-bar info"">
                                            <p class=""notice-title"">Action Required</p>
                                            <p class=""notice-text"">
                                                Please log in to the EEPZ portal to review and approve/reject this nomination.
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
                                            Support: <a href=""mailto:eepz50532@gmail.com"" class=""footer-link"">eepz50532@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            &copy; {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
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
                                    <td class=""section-title"">Manager Approval Received</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Hi {nomineeName},</p>
                                        
                                        <p class=""text-primary"">
                                            Good news! Your manager <strong>{l2Name}</strong> has approved your nomination for the internal opportunity <strong>{opportunityName}</strong>.
                                        </p>
                                        
                                        <table class=""credential-table"" width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                                            <tr class=""credential-row"">
                                                <td class=""credential-label"">Status</td>
                                                <td class=""credential-value"">✓ Manager Approved</td>
                                            </tr>
                                            <tr class=""credential-row"">
                                                <td class=""credential-label"">Next Stage</td>
                                                <td class=""credential-value"">Department Head Review</td>
                                            </tr>
                                        </table>
                                        
                                        <div class=""notice-bar success"">
                                            <p class=""notice-title"">Next Steps</p>
                                            <p class=""notice-text"">
                                                Your nomination is now pending Department Head review. You will be notified once the final decision is made.
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
                                            Support: <a href=""mailto:eepz50532@gmail.com"" class=""footer-link"">eepz50532@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            &copy; {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
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
                                    <td class=""section-title"">Nomination Status Update</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Hi {nomineeName},</p>
                                        
                                        <p class=""text-primary"">
                                            Unfortunately, your nomination for the internal opportunity <strong>{opportunityName}</strong> has been rejected by your manager <strong>{l2Name}</strong>.
                                        </p>
                                        
                                        <div class=""notice-bar error"">
                                            <p class=""notice-title"">Reason</p>
                                            <p class=""notice-text"">{reason}</p>
                                        </div>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <p class=""text-secondary"">
                                            If you have questions, please contact your manager for clarification. Keep developing your skills and watch for future opportunities!
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
                                            Support: <a href=""mailto:eepz50532@gmail.com"" class=""footer-link"">eepz50532@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            &copy; {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
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
                                    <td class=""section-title"">Action Required: Final Review</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Hi {deptHeadName},</p>
                                        
                                        <p class=""text-primary"">
                                            <strong>{nomineeName}</strong>'s nomination for the internal opportunity <strong>{opportunityName}</strong> requires your final approval.
                                        </p>
                                        
                                        <p class=""text-secondary"">
                                            The reporting manager has already approved this nomination.
                                        </p>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <div class=""notice-bar info"">
                                            <p class=""notice-title"">Action Required</p>
                                            <p class=""notice-text"">
                                                Please log in to the EEPZ portal to review and provide your final decision.
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
                                            Support: <a href=""mailto:eepz50532@gmail.com"" class=""footer-link"">eepz50532@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            &copy; {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
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
                                    <td class=""section-title"">🎉 Final Approval Received!</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Congratulations, {nomineeName}!</p>
                                        
                                        <p class=""text-primary"">
                                            Your nomination for the internal opportunity <strong>{opportunityName}</strong> has been <strong>APPROVED</strong> by Department Head <strong>{deptHeadName}</strong>.
                                        </p>
                                        
                                        <table class=""credential-table"" width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                                            <tr class=""credential-row"">
                                                <td class=""credential-label"">Status</td>
                                                <td class=""credential-value"">✓ Approved</td>
                                            </tr>
                                            <tr class=""credential-row"">
                                                <td class=""credential-label"">Approved By</td>
                                                <td class=""credential-value"">{deptHeadName}</td>
                                            </tr>
                                        </table>
                                        
                                        <div class=""notice-bar success"">
                                            <p class=""notice-title"">Next Steps</p>
                                            <p class=""notice-text"">
                                                This is the final approval. The HR team will contact you shortly with next steps. Well done!
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
                                            Support: <a href=""mailto:eepz50532@gmail.com"" class=""footer-link"">eepz50532@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            &copy; {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
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
                                    <td class=""section-title"">Nomination Approved</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Hi {l2Name},</p>
                                        
                                        <p class=""text-primary"">
                                            This is to inform you that <strong>{nomineeName}</strong>'s nomination for the internal opportunity <strong>{opportunityName}</strong> has been approved by the Department Head.
                                        </p>
                                        
                                        <div class=""notice-bar success"">
                                            <p class=""notice-title"">Congratulations</p>
                                            <p class=""notice-text"">
                                                Congratulations to your team member! The HR team will handle the next steps.
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
                                            Support: <a href=""mailto:eepz50532@gmail.com"" class=""footer-link"">eepz50532@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            &copy; {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
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
                                    <td class=""section-title"">Action Required: Re-review Nomination</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Hi {l2Name},</p>
                                        
                                        <p class=""text-primary"">
                                            The Department Head has sent back <strong>{nomineeName}</strong>'s nomination for the internal opportunity <strong>{opportunityName}</strong> for re-review.
                                        </p>
                                        
                                        <div class=""notice-bar info"">
                                            <p class=""notice-title"">Department Head Feedback</p>
                                            <p class=""notice-text"">{reason}</p>
                                        </div>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <p class=""text-secondary"">
                                            Please log in to the EEPZ portal to review this nomination again and provide your updated decision.
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
                                            Support: <a href=""mailto:eepz50532@gmail.com"" class=""footer-link"">eepz50532@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            &copy; {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
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
                                    <td class=""section-title"">Nomination Update</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Hi {nomineeName},</p>
                                        
                                        <p class=""text-primary"">
                                            Your nomination for the internal opportunity <strong>{opportunityName}</strong> is currently under re-review by your manager.
                                        </p>
                                        
                                        <div class=""notice-bar info"">
                                            <p class=""notice-title"">Department Head Feedback</p>
                                            <p class=""notice-text"">{reason}</p>
                                        </div>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <p class=""text-secondary"">
                                            You will be notified once your manager completes the re-review. Please check the EEPZ portal for updates.
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
                                            Support: <a href=""mailto:eepz50532@gmail.com"" class=""footer-link"">eepz50532@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            &copy; {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
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
                                    <td class=""section-title"">Manager Re-approved</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Hi {nomineeName},</p>
                                        
                                        <p class=""text-primary"">
                                            Good news! Your manager <strong>{l2Name}</strong> has re-approved your nomination for the internal opportunity <strong>{opportunityName}</strong>.
                                        </p>
                                        
                                        <div class=""notice-bar success"">
                                            <p class=""notice-title"">Next Steps</p>
                                            <p class=""notice-text"">
                                                Your nomination is now pending Department Head final review. You will be notified once the final decision is made.
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
                                            Support: <a href=""mailto:eepz50532@gmail.com"" class=""footer-link"">eepz50532@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            &copy; {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
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
                                    <td class=""section-title"">Action Required: Re-review Nomination</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Hi {deptHeadName},</p>
                                        
                                        <p class=""text-primary"">
                                            <strong>{nomineeName}</strong>'s nomination for the internal opportunity <strong>{opportunityName}</strong> has been re-approved by the reporting manager.
                                        </p>
                                        
                                        <div class=""notice-bar info"">
                                            <p class=""notice-title"">Action Required</p>
                                            <p class=""notice-text"">
                                                Please log in to the EEPZ portal to review this nomination again for final approval.
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
                                            Support: <a href=""mailto:eepz50532@gmail.com"" class=""footer-link"">eepz50532@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            &copy; {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
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
                                    <td class=""section-title"">Final Decision</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Hi {nomineeName},</p>
                                        
                                        <p class=""text-primary"">
                                            Unfortunately, your nomination for the internal opportunity <strong>{opportunityName}</strong> has been rejected by your manager <strong>{l2Name}</strong> after re-review.
                                        </p>
                                        
                                        <div class=""notice-bar error"">
                                            <p class=""notice-title"">Reason</p>
                                            <p class=""notice-text"">{reason}</p>
                                        </div>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <p class=""text-secondary"">
                                            This is a <strong>final decision</strong>. If you have questions, please contact your manager for clarification. Keep developing your skills and watch for future opportunities!
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
                                            Support: <a href=""mailto:eepz50532@gmail.com"" class=""footer-link"">eepz50532@gmail.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            &copy; {DateTime.UtcNow.Year} EEPZ. All rights reserved.<br>
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
