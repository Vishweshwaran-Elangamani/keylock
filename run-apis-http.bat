
@echo off
echo Starting all 10 Web APIs...

rem Base folder: D:\pull on 5-12\eepz

start "" /D "D:\pull on 5-12\eepz\Relevantz.EEPZ.AuthApi\Relevantz.EEPZ.Api" cmd /k dotnet run --launch-profile http
start "" /D "D:\pull on 5-12\eepz\Relevantz.EEPZ.FeedbackApi\Relevantz.EEPZ.Api" cmd /k dotnet run --launch-profile http
start "" /D "D:\pull on 5-12\eepz\Relevantz.EEPZ.GoalApi\Relevantz.EEPZ.Api" cmd /k dotnet run --launch-profile http
start "" /D "D:\pull on 5-12\eepz\Relevantz.EEPZ.HrOperationsApi\Relevantz.EEPZ.Api" cmd /k dotnet run --launch-profile http
start "" /D "D:\pull on 5-12\eepz\Relevantz.EEPZ.InternalOpportunityAPI\Relevantz.EEPZ.Api" cmd /k dotnet run --launch-profile http
start "" /D "D:\pull on 5-12\eepz\Relevantz.EEPZ.LnDApi\Relevantz.EEPZ.Api" cmd /k dotnet run --launch-profile http
start "" /D "D:\pull on 5-12\eepz\Relevantz.EEPZ.MOM&MeetingApi\Relevantz.EEPZ.Api" cmd /k dotnet run --launch-profile http
start "" /D "D:\pull on 5-12\eepz\Relevantz.EEPZ.PerformanceManagementApi\Relevantz.EEPZ.Api" cmd /k dotnet run --launch-profile http
start "" /D "D:\pull on 5-12\eepz\Relevantz.EEPZ.ProjManagementApi\Relevantz.EEPZ.Api" cmd /k dotnet run --launch-profile http
start "" /D "D:\pull on 5-12\eepz\Relevantz.EEPZ.SLAApi\Relevantz.EEPZ.Api" cmd /k dotnet run --launch-profile http

echo Done launching windows. Check each console for build/run output.
