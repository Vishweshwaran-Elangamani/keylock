@echo off
setlocal

:: Define the directories to remove
set "TARGET_DIRS=bin obj"

:: Define the starting directory (current directory by default)
:: You can change "." to a specific path like "C:\MyProjects"
set "START_DIR=."

echo.
echo Searching for and deleting "%TARGET_DIRS%" directories in "%START_DIR%"...
echo.

for %%d in (%TARGET_DIRS%) do (
    for /d /r "%START_DIR%" %%i in (%%d) do (
        if exist "%%i" (
            echo Deleting: "%%i"
            rd /s /q "%%i"
            if not exist "%%i" (
                echo Successfully deleted "%%i"
            ) else (
                echo Failed to delete "%%i" - it may be in use.
            )
        )
    )
)

echo.
echo Deletion process complete.
echo.
pause
endlocal