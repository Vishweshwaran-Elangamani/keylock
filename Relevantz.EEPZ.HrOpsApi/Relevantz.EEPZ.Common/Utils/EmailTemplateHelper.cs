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
                
                .goal-list {
                    margin: 16px 0;
                }
                
                .goal-card {
                    background-color: #f8f9fa;
                    border-left: 3px solid #2563eb;
                    padding: 14px 16px;
                    margin: 10px 0;
                    border-radius: 4px;
                }
                
                .goal-number {
                    font-size: 11px;
                    font-weight: 600;
                    color: #2563eb;
                    margin: 0 0 6px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .goal-text {
                    font-size: 14px;
                    color: #1a1a1a;
                    margin: 0;
                    line-height: 1.5;
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
                
                .button-container {
                    text-align: center;
                    margin: 20px 0;
                }
                
                .primary-button {
                    display: inline-block;
                    padding: 12px 28px;
                    background-color: #2563eb;
                    color: #ffffff;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                    border-radius: 6px;
                    letter-spacing: 0.3px;
                }
                
                .primary-button:hover {
                    background-color: #1d4ed8;
                }
                
                .divider {
                    height: 1px;
                    background-color: #e5e7eb;
                    margin: 20px 0;
                }
                
                .section-heading {
                    font-size: 15px;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin: 0 0 12px 0;
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
                    
                    .goal-card {
                        background-color: #262626;
                        border-left-color: #3b82f6;
                    }
                    
                    .goal-number {
                        color: #60a5fa;
                    }
                    
                    .goal-text {
                        color: #e5e5e5;
                    }
                    
                    .section-heading {
                        color: #f5f5f5;
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
                    
                    .goal-card {
                        padding: 12px 14px;
                    }
                }
            </style>
        ";

        public static string GetGoalReminderEmailTemplate(string userName, List<string> goalSuggestions)
        {
            var suggestionsHtml = string.Empty;
            if (goalSuggestions != null && goalSuggestions.Any())
            {
                suggestionsHtml = string.Join("", goalSuggestions.Select((s, i) =>
                    $@"<div class=""goal-card"">
                        <p class=""goal-number"">Goal {i + 1}</p>
                        <p class=""goal-text"">{s}</p>
                    </div>"
                ));
            }

            return $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <meta http-equiv=""X-UA-Compatible"" content=""IE=edge"">
    <meta name=""color-scheme"" content=""light dark"">
    <meta name=""supported-color-schemes"" content=""light dark"">
    <title>Set Your Career Development Goals</title>
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
                            <p class=""header-tag"">Career Development Goals</p>
                        </td>
                    </tr>
                    <tr>
                        <td class=""content"">
                            <h2 class=""title"">Action Required</h2>
                            <p class=""subtitle"">Dear {userName}, we noticed you haven't set your professional development goals yet. Setting clear goals is essential for your career progression.</p>
                            
                            <p class=""section-heading"">Why Set Goals</p>
                            
                            <div class=""steps"">
                                <div class=""step"">Focus on skills you want to develop</div>
                                <div class=""step"">Track your career progress</div>
                                <div class=""step"">Get support from your manager</div>
                                <div class=""step"">Align work with your career path</div>
                            </div>
                            
                            {(goalSuggestions != null && goalSuggestions.Any() ? $@"
                            <div class=""divider""></div>
                            
                            <p class=""section-heading"">Goal Suggestions For You</p>
                            
                            <div class=""goal-list"">
                                {suggestionsHtml}
                            </div>" : "")}
                            
                            <div class=""divider""></div>
                            
                            <div class=""button-container"">
                                <a href=""https://portal.company.com/goals"" class=""primary-button"">Set Your Goals Now</a>
                            </div>
                            
                            <div class=""divider""></div>
                            
                            <div class=""alert alert-info"">
                                <strong>Action Needed:</strong> Please set 2-3 goals by <strong>{DateTime.UtcNow.AddDays(14):MMMM dd, yyyy}</strong> to align your development plan with organizational objectives.
                            </div>
                            
                            <p class=""subtitle"">Need help choosing goals? Contact HR at <a href=""mailto:emailserviceeepz@gmail.com"" class=""footer-link"">emailserviceeepz@gmail.com</a></p>
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
