@echo off

echo Building all 10 Web APIs...

:: Navigate to each API folder and build dotnet:
start cmd /k "cd /d Relevantz.EEPZ.AuthApi\Relevantz.EEPZ.Api && dotnet build"
start cmd /k "cd /d Relevantz.EEPZ.FeedbackApi\Relevantz.EEPZ.Api && dotnet build"
start cmd /k "cd /d Relevantz.EEPZ.GoalApi\Relevantz.EEPZ.Api && dotnet build"
start cmd /k "cd /d Relevantz.EEPZ.HrOperationsApi\Relevantz.EEPZ.Api && dotnet build"
start cmd /k "cd /d Relevantz.EEPZ.InternalOpportunityAPI\Relevantz.EEPZ.Api && dotnet build"
start cmd /k "cd /d Relevantz.EEPZ.LnDApi\Relevantz.EEPZ.Api && dotnet build"
start cmd /k "cd /d Relevantz.EEPZ.MOM^&MeetingApi\Relevantz.EEPZ.Api && dotnet build"
start cmd /k "cd /d Relevantz.EEPZ.PerformanceManagementApi\Relevantz.EEPZ.Api && dotnet build"
start cmd /k "cd /d Relevantz.EEPZ.ProjManagementApi\Relevantz.EEPZ.Api && dotnet build"
start cmd /k "cd /d Relevantz.EEPZ.SLAApi\Relevantz.EEPZ.Api && dotnet build"

