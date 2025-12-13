@echo off
echo Starting all 10 Web APIs...

:: Navigate to each API folder and run dotnet:
start cmd /k "cd /d Relevantz.EEPZ.AuthApi\Relevantz.EEPZ.Api && dotnet run --launch-profile http"
start cmd /k "cd /d Relevantz.EEPZ.FeedbackApi\Relevantz.EEPZ.Api && dotnet run --launch-profile http"
start cmd /k "cd /d Relevantz.EEPZ.GoalApi\Relevantz.EEPZ.Api && dotnet run --launch-profile http"
start cmd /k "cd /d Relevantz.EEPZ.HrOperationsApi\Relevantz.EEPZ.Api && dotnet run --launch-profile http"
start cmd /k "cd /d Relevantz.EEPZ.InternalOpportunityAPI\Relevantz.EEPZ.Api && dotnet run --launch-profile http"
start cmd /k "cd /d Relevantz.EEPZ.LnDApi\Relevantz.EEPZ.Api && dotnet run --launch-profile http"
start cmd /k "cd /d Relevantz.EEPZ.MOM^&MeetingApi\Relevantz.EEPZ.Api && dotnet run --launch-profile http"
start cmd /k "cd /d Relevantz.EEPZ.PerformanceManagementApi\Relevantz.EEPZ.Api && dotnet run --launch-profile http"
start cmd /k "cd /d Relevantz.EEPZ.ProjManagementApi\Relevantz.EEPZ.Api && dotnet run --launch-profile http"
start cmd /k "cd /d Relevantz.EEPZ.SLAApi\Relevantz.EEPZ.Api && dotnet run --launch-profile http"
