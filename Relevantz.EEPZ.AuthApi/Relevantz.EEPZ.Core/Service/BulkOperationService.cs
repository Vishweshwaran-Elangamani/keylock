using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using ClosedXML.Excel;
using System.IO;
using System.Text.RegularExpressions;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Core.Service
{
    public class BulkOperationService : IBulkOperationService
    {
        private readonly IUserManagementService _userManagementService;
        private readonly IUserAuthenticationRepository _userAuthRepository;
        private readonly IBulkOperationLogRepository _bulkOperationLogRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IEmployeeRepository _employeeRepository;

        public BulkOperationService(
            IUserManagementService userManagementService,
            IUserAuthenticationRepository userAuthRepository,
            IBulkOperationLogRepository bulkOperationLogRepository,
            IRoleRepository roleRepository,
            IDepartmentRepository departmentRepository,
            IEmployeeRepository employeeRepository)
        {
            _userManagementService = userManagementService;
            _userAuthRepository = userAuthRepository;
            _bulkOperationLogRepository = bulkOperationLogRepository;
            _roleRepository = roleRepository;
            _departmentRepository = departmentRepository;
            _employeeRepository = employeeRepository;
        }

        private List<string> ValidateUserData(CreateUserRequestDto user, int rowNumber)
        {
            var errors = new List<string>();
            var userIdentifier = !string.IsNullOrWhiteSpace(user.Email)
                ? user.Email
                : !string.IsNullOrWhiteSpace(user.EmployeeCompanyId)
                    ? user.EmployeeCompanyId
                    : "Unknown User";

            var rowPrefix = $"Row {rowNumber} ({userIdentifier})";

            if (string.IsNullOrWhiteSpace(user.FirstName))
            {
                errors.Add($"{rowPrefix}: First name is required");
            }
            else if (user.FirstName.Trim().Length < 2)
            {
                errors.Add($"{rowPrefix}: First name must be at least 2 characters");
            }
            else if (!Regex.IsMatch(user.FirstName.Trim(), @"^[a-zA-Z\s]+$"))
            {
                errors.Add($"{rowPrefix}: First name must contain only letters");
            }

            if (string.IsNullOrWhiteSpace(user.LastName))
            {
                errors.Add($"{rowPrefix}: Last name is required");
            }
            else if (user.LastName.Trim().Length < 2)
            {
                errors.Add($"{rowPrefix}: Last name must be at least 2 characters");
            }
            else if (!Regex.IsMatch(user.LastName.Trim(), @"^[a-zA-Z\s]+$"))
            {
                errors.Add($"{rowPrefix}: Last name must contain only letters");
            }

            if (string.IsNullOrWhiteSpace(user.Email))
            {
                errors.Add($"{rowPrefix}: Email is required");
            }
            else if (!Regex.IsMatch(user.Email.Trim(), @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
            {
                errors.Add($"{rowPrefix}: Invalid email format");
            }

            if (!string.IsNullOrWhiteSpace(user.MobileNumber))
            {
                var cleanedNumber = user.MobileNumber.Replace("+91-", "").Replace("+91", "").Trim();
                if (!Regex.IsMatch(cleanedNumber, @"^[6-9][0-9]{9}$"))
                {
                    errors.Add($"{rowPrefix}: Phone number must start with 6-9 and be exactly 10 digits");
                }
            }

            if (user.RoleId <= 0)
            {
                errors.Add($"{rowPrefix}: Valid Role is required");
            }

            if (user.DepartmentId <= 0)
            {
                errors.Add($"{rowPrefix}: Valid Department is required");
            }

            if (user.DateOfBirthOfficial.HasValue)
            {
                var dob = user.DateOfBirthOfficial.Value.ToDateTime(TimeOnly.MinValue);
                var today = DateTime.Today;
                var age = today.Year - dob.Year;

                if (dob > today)
                {
                    errors.Add($"{rowPrefix}: Date of birth cannot be in the future");
                }
                else if (age < 18)
                {
                    errors.Add($"{rowPrefix}: User must be at least 18 years old (current age: {age})");
                }
                else if (age > 100)
                {
                    errors.Add($"{rowPrefix}: Invalid date of birth (age cannot exceed 100 years)");
                }
            }

            return errors;
        }

        public async Task<BulkOperationResponseDto> BulkCreateUsersAsync(List<CreateUserRequestDto> users, int performedByUserId)
        {
            var successCount = 0;
            var failureCount = 0;
            var errors = new List<string>();
            var successfulUsers = new List<SuccessfulUserDto>();  
            var rowNumber = 1;

            var nextIdString = await _employeeRepository.GetNextEmployeeCompanyIdAsync();
            int nextEmployeeId = int.Parse(nextIdString);

            var roles = await _roleRepository.GetAllAsync();
            var departments = await _departmentRepository.GetAllAsync();

            EEPZBusinessLog.Information($"Starting bulk user creation with Employee ID: {nextEmployeeId}");

            foreach (var user in users)
            {
                rowNumber++;
                user.EmployeeCompanyId = nextEmployeeId.ToString();
                nextEmployeeId++;

                var validationErrors = ValidateUserData(user, rowNumber);

                if (validationErrors.Any())
                {
                    failureCount++;
                    errors.AddRange(validationErrors);
                    continue;
                }

                var result = await _userManagementService.CreateUserAsync(user, performedByUserId);
                if (result.Success)
                {
                    successCount++;

                    var role = roles?.FirstOrDefault(r => r.RoleId == user.RoleId);
                    var department = departments?.FirstOrDefault(d => d.DepartmentId == user.DepartmentId);

                    successfulUsers.Add(new SuccessfulUserDto
                    {
                        Email = user.Email,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        EmployeeCompanyId = user.EmployeeCompanyId,
                        Role = role?.RoleName ?? "Unknown",
                        Department = department?.DepartmentName ?? "Unknown"
                    });

                    EEPZBusinessLog.Information($"User created with Employee ID: {user.EmployeeCompanyId}");
                }
                else
                {
                    failureCount++;
                    errors.Add($"Row {rowNumber} ({user.Email}): {result.Message}");
                }
            }

            var bulkLog = new Bulkoperationlog
            {
                PerformedByUserId = performedByUserId,
                OperationType = "BulkUserCreation",
                TotalRecords = users.Count,
                SuccessCount = successCount,
                FailureCount = failureCount,
                ErrorDetails = errors.Any() ? string.Join("\n", errors) : null,
                PerformedAt = DateTime.UtcNow
            };

            await _bulkOperationLogRepository.CreateAsync(bulkLog);

            var response = new BulkOperationResponseDto
            {
                TotalRecords = users.Count,
                SuccessCount = successCount,
                FailureCount = failureCount,
                Errors = errors,
                SuccessfulUsers = successfulUsers,
                Message = $"Bulk operation completed: {successCount} successful, {failureCount} failed"
            };

            EEPZBusinessLog.Information($"Bulk user creation completed: {successCount}/{users.Count} successful. Employee IDs assigned: {nextIdString} to {nextEmployeeId - 1}");

            return response;
        }

        public async Task<BulkOperationResponseDto> BulkInactivateUsersAsync(BulkUserInactivateRequestDto request, int performedByUserId)
        {
            var successCount = 0;
            var failureCount = 0;
            var errors = new List<string>();

            foreach (var userId in request.UserIds)
            {
                var result = await _userManagementService.DeactivateUserAsync(userId);
                if (result.Success)
                {
                    successCount++;
                }
                else
                {
                    failureCount++;
                    errors.Add($"UserId {userId}: {result.Message}");
                }
            }

            var bulkLog = new Bulkoperationlog
            {
                PerformedByUserId = performedByUserId,
                OperationType = "BulkUserInactivation",
                TotalRecords = request.UserIds.Count,
                SuccessCount = successCount,
                FailureCount = failureCount,
                ErrorDetails = errors.Any() ? string.Join("\n", errors) : null,
                PerformedAt = DateTime.UtcNow
            };

            await _bulkOperationLogRepository.CreateAsync(bulkLog);

            var response = new BulkOperationResponseDto
            {
                TotalRecords = request.UserIds.Count,
                SuccessCount = successCount,
                FailureCount = failureCount,
                Errors = errors,
                Message = $"Bulk inactivation completed: {successCount} successful, {failureCount} failed"
            };

            EEPZBusinessLog.Information($"Bulk user inactivation completed: {successCount}/{request.UserIds.Count} successful");

            return response;
        }

        public async Task<BulkOperationResponseDto> BulkCreateUsersFromExcelAsync(Stream fileStream, int performedByUserId)
        {
            var users = new List<CreateUserRequestDto>();

            using var workbook = new XLWorkbook(fileStream);
            var worksheet = workbook.Worksheet(1);

            if (worksheet == null)
            {
                return new BulkOperationResponseDto
                {
                    SuccessCount = 0,
                    FailureCount = 1,
                    TotalRecords = 0,
                    Errors = new List<string> { ExcelMessages.NoWorksheetsError },
                    Message = ExcelMessages.NoWorksheetsError
                };
            }

            var rowCount = worksheet.LastRowUsed()?.RowNumber() ?? 0;
            if (rowCount < 2)
            {
                return new BulkOperationResponseDto
                {
                    SuccessCount = 0,
                    FailureCount = 1,
                    TotalRecords = 0,
                    Errors = new List<string> { ExcelMessages.NoDataRowsError },
                    Message = ExcelMessages.NoDataRowsError
                };
            }

            for (int row = 2; row <= rowCount; row++)
            {
                var emailCell = worksheet.Cell(row, 1);
                if (emailCell.IsEmpty() || string.IsNullOrWhiteSpace(emailCell.GetString()))
                    continue;

                bool isEmptyRow = true;
                for (int col = 1; col <= 11; col++)
                {
                    if (!worksheet.Cell(row, col).IsEmpty())
                    {
                        isEmptyRow = false;
                        break;
                    }
                }
                if (isEmptyRow) continue;

                var mobileCell = worksheet.Cell(row, 10);
                var mobileNumber = mobileCell.IsEmpty() 
                    ? null 
                    : mobileCell.GetString().Replace("+91-", "").Replace("+91", "").Replace("-", "").Replace(" ", "").Trim();

                var roleName = worksheet.Cell(row, 8).GetString().Trim();
                var roleId = await GetRoleIdByNameAsync(roleName);

                var departmentName = worksheet.Cell(row, 9).GetString().Trim();
                var departmentId = await GetDepartmentIdByNameAsync(departmentName);

                var user = new CreateUserRequestDto
                {
                    EmployeeCompanyId = "",
                    Email = worksheet.Cell(row, 1).GetString().Trim(),
                    FirstName = worksheet.Cell(row, 2).GetString().Trim(),
                    LastName = worksheet.Cell(row, 3).GetString().Trim(),
                    EmploymentType = worksheet.Cell(row, 4).IsEmpty() ? Constants.EmploymentTypes.Permanent : worksheet.Cell(row, 4).GetString().Trim(),
                    EmploymentStatus = worksheet.Cell(row, 5).IsEmpty() ? Constants.EmploymentStatuses.Active : worksheet.Cell(row, 5).GetString().Trim(),
                    JoiningDate = DateOnly.TryParse(worksheet.Cell(row, 6).GetString(), out var joinDate) ? joinDate : DateOnly.FromDateTime(DateTime.UtcNow),
                    EmployeeType = worksheet.Cell(row, 7).IsEmpty() ? Constants.EmployeeTypes.FullTime : worksheet.Cell(row, 7).GetString().Trim(),
                    RoleId = roleId,
                    DepartmentId = departmentId,
                    MobileNumber = mobileNumber,
                    Gender = worksheet.Cell(row, 11).IsEmpty() ? null : worksheet.Cell(row, 11).GetString().Trim()
                };

                users.Add(user);
            }

            if (users.Count == 0)
            {
                return new BulkOperationResponseDto
                {
                    SuccessCount = 0,
                    FailureCount = 1,
                    TotalRecords = 0,
                    Errors = new List<string> { ExcelMessages.NoValidUsersError },
                    Message = ExcelMessages.NoValidUsersError
                };
            }

            return await BulkCreateUsersAsync(users, performedByUserId);
        }

        private async Task<int> GetRoleIdByNameAsync(string roleName)
        {
            if (string.IsNullOrWhiteSpace(roleName)) return 0;

            var roles = await _roleRepository.GetAllAsync();
            var role = roles?.FirstOrDefault(r => r.RoleName.Equals(roleName, StringComparison.OrdinalIgnoreCase));
            return role?.RoleId ?? 0;
        }

        private async Task<int> GetDepartmentIdByNameAsync(string departmentName)
        {
            if (string.IsNullOrWhiteSpace(departmentName)) return 0;

            var departments = await _departmentRepository.GetAllAsync();
            var dept = departments?.FirstOrDefault(d => d.DepartmentName.Equals(departmentName, StringComparison.OrdinalIgnoreCase));
            return dept?.DepartmentId ?? 0;
        }

        public async Task<byte[]> GenerateExcelTemplateAsync()
        {
            var roles = await _roleRepository.GetAllAsync();
            var departments = await _departmentRepository.GetAllAsync();

            var availableRoles = roles?.Where(r => r.RoleName != "Admin").ToList() ?? new List<Role>();
            var availableDepartments = departments ?? new List<Department>();

            EEPZBusinessLog.Information($"Generating template with {availableRoles.Count} roles and {availableDepartments.Count} departments");

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Users");

            var headers = new[]
            {
                ExcelHeaders.Email,
                ExcelHeaders.FirstName,
                ExcelHeaders.LastName,
                ExcelHeaders.EmploymentType,
                ExcelHeaders.EmploymentStatus,
                ExcelHeaders.JoiningDate,
                ExcelHeaders.EmployeeType,
                ExcelHeaders.Role,
                ExcelHeaders.Department,
                ExcelHeaders.MobileNumber,
                ExcelHeaders.Gender
            };

            for (int i = 0; i < headers.Length; i++)
            {
                worksheet.Cell(1, i + 1).Value = headers[i];
            }

            // Header styling
            var headerRange = worksheet.Range(1, 1, 1, headers.Length);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Font.FontSize = 12;
            headerRange.Style.Fill.BackgroundColor = XLColor.FromArgb(79, 129, 189);
            headerRange.Style.Font.FontColor = XLColor.White;
            headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Column widths
            worksheet.Column(1).Width = 28;
            worksheet.Column(2).Width = 15;
            worksheet.Column(3).Width = 15;
            worksheet.Column(4).Width = 15;
            worksheet.Column(5).Width = 15;
            worksheet.Column(6).Width = 15;
            worksheet.Column(7).Width = 12;
            worksheet.Column(8).Width = 20;
            worksheet.Column(9).Width = 20;
            worksheet.Column(10).Width = 15;
            worksheet.Column(11).Width = 18;

            // Role dropdown (Column H)
            if (availableRoles.Any())
            {
                var roleRange = worksheet.Range("H2:H1000");
                var roleValidation = roleRange.SetDataValidation();
                roleValidation.List(string.Join(",", availableRoles.Select(r => $"\"{r.RoleName}\"")), true);
                roleValidation.ErrorTitle = "Invalid Role";
                roleValidation.ErrorMessage = "Select from dropdown";
                roleValidation.ErrorStyle = XLErrorStyle.Stop;
                roleValidation.InCellDropdown = true;
            }

            // Department dropdown (Column I)
            if (availableDepartments.Any())
            {
                var deptRange = worksheet.Range("I2:I1000");
                var deptValidation = deptRange.SetDataValidation();
                deptValidation.List(string.Join(",", availableDepartments.Select(d => $"\"{d.DepartmentName}\"")), true);
                deptValidation.ErrorTitle = "Invalid Department";
                deptValidation.ErrorMessage = "Select from dropdown";
                deptValidation.ErrorStyle = XLErrorStyle.Stop;
                deptValidation.InCellDropdown = true;
            }

            // Employment Type dropdown
            var empTypeRange = worksheet.Range("D2:D1000");
            var empTypeValidation = empTypeRange.SetDataValidation();
            empTypeValidation.List(EmploymentTypeValues.GetCommaSeparated(), true);
            empTypeValidation.InCellDropdown = true;

            // Employment Status dropdown
            var empStatusRange = worksheet.Range("E2:E1000");
            var empStatusValidation = empStatusRange.SetDataValidation();
            empStatusValidation.List(EmploymentStatusValues.GetCommaSeparated(), true);
            empStatusValidation.InCellDropdown = true;

            // Employee Type dropdown
            var employeeTypeRange = worksheet.Range("G2:G1000");
            var employeeTypeValidation = employeeTypeRange.SetDataValidation();
            employeeTypeValidation.List(EmployeeTypeValues.GetCommaSeparated(), true);
            employeeTypeValidation.InCellDropdown = true;

            // Gender dropdown
            var genderRange = worksheet.Range("K2:K1000");
            var genderValidation = genderRange.SetDataValidation();
            genderValidation.List(GenderValues.GetCommaSeparated(), true);
            genderValidation.IgnoreBlanks = true;
            genderValidation.InCellDropdown = true;

            // Instructions sheet
            var instructionSheet = workbook.Worksheets.Add("Instructions");
            instructionSheet.Cell(1, 1).Value = ExcelMessages.BulkImportInstructions;
            instructionSheet.Cell(1, 1).Style.Font.Bold = true;
            instructionSheet.Cell(1, 1).Style.Font.FontSize = 16;

            instructionSheet.Cell(3, 1).Value = ExcelMessages.EmployeeIdAutoGenerated;
            instructionSheet.Cell(3, 1).Style.Font.Bold = true;
            instructionSheet.Cell(3, 1).Style.Font.FontColor = XLColor.Red;
            instructionSheet.Cell(3, 1).Style.Font.FontSize = 14;

            instructionSheet.Cell(4, 1).Value = ExcelMessages.DoNotIncludeEmployeeId;
            instructionSheet.Cell(4, 1).Style.Font.FontColor = XLColor.Red;

            worksheet.Columns().AdjustToContents();
            instructionSheet.Columns().AdjustToContents();

            worksheet.SheetView.FreezeRows(1);

            EEPZBusinessLog.Information("Excel template generated successfully");

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }
    }
}
