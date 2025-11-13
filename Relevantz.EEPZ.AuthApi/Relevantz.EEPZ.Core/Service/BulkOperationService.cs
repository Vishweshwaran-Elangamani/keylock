
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using OfficeOpenXml.DataValidation;
using OfficeOpenXml.DataValidation.Contracts;
using System.Drawing;
using System.Text.RegularExpressions;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Service
{
    public class BulkOperationService : IBulkOperationService
    {
        private readonly IUserManagementService _userManagementService;
        private readonly IUserAuthenticationRepository _userAuthRepository;
        private readonly IBulkOperationLogRepository _bulkOperationLogRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IDepartmentRepository _departmentRepository;

        public BulkOperationService(
            IUserManagementService userManagementService,
            IUserAuthenticationRepository userAuthRepository,
            IBulkOperationLogRepository bulkOperationLogRepository,
            IRoleRepository roleRepository,
            IDepartmentRepository departmentRepository)
        {
            _userManagementService = userManagementService;
            _userAuthRepository = userAuthRepository;
            _bulkOperationLogRepository = bulkOperationLogRepository;
            _roleRepository = roleRepository;
            _departmentRepository = departmentRepository;
        }

        private List<string> ValidateUserData(CreateUserRequestDto user, int rowNumber)
        {
            var errors = new List<string>();
            var rowPrefix = $"Row {rowNumber}";

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

            if (string.IsNullOrWhiteSpace(user.EmployeeCompanyId))
            {
                errors.Add($"{rowPrefix}: Employee Company ID is required");
            }
            else if (user.EmployeeCompanyId.Trim().Length < 3)
            {
                errors.Add($"{rowPrefix}: Employee Company ID must be at least 3 characters");
            }
            else if (!Regex.IsMatch(user.EmployeeCompanyId.Trim(), @"^[a-zA-Z0-9_]+$"))
            {
                errors.Add($"{rowPrefix}: Employee Company ID must contain only letters, numbers, and underscores");
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
                    errors.Add($"{rowPrefix}: User must be at least 18 years old");
                }
                else if (age > 100)
                {
                    errors.Add($"{rowPrefix}: Invalid date of birth");
                }
            }

            return errors;
        }

        public async Task<ApiResponseDto<BulkOperationResponseDto>> BulkCreateUsersAsync(List<CreateUserRequestDto> users, int performedByUserId)
        {
            var successCount = 0;
            var failureCount = 0;
            var errors = new List<string>();
            var rowNumber = 1;

            try
            {
                foreach (var user in users)
                {
                    rowNumber++;
                    try
                    {
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
                        }
                        else
                        {
                            failureCount++;
                            errors.Add($"Row {rowNumber} ({user.Email}): {result.Message}");
                        }
                    }
                    catch (Exception ex)
                    {
                        failureCount++;
                        errors.Add($"Row {rowNumber} ({user.Email}): {ex.Message}");
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
                    Message = $"Bulk operation completed: {successCount} successful, {failureCount} failed"
                };

                EEPZBusinessLog.Information($"Bulk user creation completed: {successCount}/{users.Count} successful");

                return ApiResponseDto<BulkOperationResponseDto>.SuccessResponse(response, "Bulk operation completed");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error("Error during bulk user creation", ex);
                return ApiResponseDto<BulkOperationResponseDto>.FailureResponse("An error occurred during bulk operation");
            }
        }

        public async Task<ApiResponseDto<BulkOperationResponseDto>> BulkInactivateUsersAsync(BulkUserInactivateRequestDto request, int performedByUserId)
        {
            var successCount = 0;
            var failureCount = 0;
            var errors = new List<string>();

            try
            {
                foreach (var userId in request.UserIds)
                {
                    try
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
                    catch (Exception ex)
                    {
                        failureCount++;
                        errors.Add($"UserId {userId}: {ex.Message}");
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

                return ApiResponseDto<BulkOperationResponseDto>.SuccessResponse(response, "Bulk operation completed");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error("Error during bulk user inactivation", ex);
                return ApiResponseDto<BulkOperationResponseDto>.FailureResponse("An error occurred during bulk operation");
            }
        }

        public async Task<ApiResponseDto<BulkOperationResponseDto>> BulkCreateUsersFromExcelAsync(Stream fileStream, int performedByUserId)
        {
            var users = new List<CreateUserRequestDto>();
            var parseErrors = new List<string>();

            try
            {
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                using (var package = new ExcelPackage(fileStream))
                {
                    if (package.Workbook.Worksheets.Count == 0)
                    {
                        return ApiResponseDto<BulkOperationResponseDto>.FailureResponse("Excel file contains no worksheets");
                    }

                    var worksheet = package.Workbook.Worksheets[0];
                    
                    if (worksheet.Dimension == null)
                    {
                        return ApiResponseDto<BulkOperationResponseDto>.FailureResponse("Excel worksheet is empty");
                    }

                    var rowCount = worksheet.Dimension.Rows;

                    if (rowCount < 2)
                    {
                        return ApiResponseDto<BulkOperationResponseDto>.FailureResponse("Excel file must contain at least one data row besides the header");
                    }

                    for (int row = 2; row <= rowCount; row++)
                    {
                        try
                        {
                            var isEmptyRow = true;
                            for (int col = 1; col <= 12; col++)
                            {
                                if (worksheet.Cells[row, col].Value != null && 
                                    !string.IsNullOrWhiteSpace(worksheet.Cells[row, col].Value.ToString()))
                                {
                                    isEmptyRow = false;
                                    break;
                                }
                            }

                            if (isEmptyRow) continue;

                            var mobileNumber = worksheet.Cells[row, 11].Value?.ToString();
                            if (!string.IsNullOrWhiteSpace(mobileNumber))
                            {
                                mobileNumber = mobileNumber.Replace("+91-", "").Replace("+91", "").Trim();
                                if (mobileNumber.Length == 10)
                                {
                                    mobileNumber = $"+91-{mobileNumber}";
                                }
                            }

                            var roleName = worksheet.Cells[row, 9].Value?.ToString()?.Trim() ?? string.Empty;
                            var roleId = await GetRoleIdByNameAsync(roleName);

                            var departmentName = worksheet.Cells[row, 10].Value?.ToString()?.Trim() ?? string.Empty;
                            var departmentId = await GetDepartmentIdByNameAsync(departmentName);

                            var user = new CreateUserRequestDto
                            {
                                EmployeeCompanyId = worksheet.Cells[row, 1].Value?.ToString()?.Trim() ?? string.Empty,
                                Email = worksheet.Cells[row, 2].Value?.ToString()?.Trim() ?? string.Empty,
                                FirstName = worksheet.Cells[row, 3].Value?.ToString()?.Trim() ?? string.Empty,
                                LastName = worksheet.Cells[row, 4].Value?.ToString()?.Trim() ?? string.Empty,
                                EmploymentType = worksheet.Cells[row, 5].Value?.ToString()?.Trim() ?? Constants.EmploymentTypes.Permanent,
                                EmploymentStatus = worksheet.Cells[row, 6].Value?.ToString()?.Trim() ?? Constants.EmploymentStatuses.Active,
                                JoiningDate = DateOnly.TryParse(worksheet.Cells[row, 7].Value?.ToString(), out var joinDate) ? joinDate : DateOnly.FromDateTime(DateTime.UtcNow),
                                EmployeeType = worksheet.Cells[row, 8].Value?.ToString()?.Trim() ?? Constants.EmployeeTypes.FullTime,
                                RoleId = roleId,
                                DepartmentId = departmentId,
                                MobileNumber = mobileNumber,
                                Gender = worksheet.Cells[row, 12].Value?.ToString()?.Trim()
                            };

                            users.Add(user);
                        }
                        catch (Exception ex)
                        {
                            parseErrors.Add($"Row {row}: Failed to parse - {ex.Message}");
                        }
                    }
                }

                if (users.Count == 0)
                {
                    var errorMessage = parseErrors.Any() 
                        ? $"No valid users found. Parse errors: {string.Join("; ", parseErrors.Take(3))}" 
                        : "No valid users found in Excel file";
                        
                    return ApiResponseDto<BulkOperationResponseDto>.FailureResponse(errorMessage);
                }

                return await BulkCreateUsersAsync(users, performedByUserId);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error("Error parsing Excel file for bulk user creation", ex);
                return ApiResponseDto<BulkOperationResponseDto>.FailureResponse($"An error occurred while parsing Excel file: {ex.Message}");
            }
        }

        private async Task<int> GetRoleIdByNameAsync(string roleName)
        {
            if (string.IsNullOrWhiteSpace(roleName)) return 0;
            
            try
            {
                var roles = await _roleRepository.GetAllAsync();
                var role = roles?.FirstOrDefault(r => r.RoleName.Equals(roleName, StringComparison.OrdinalIgnoreCase));
                return role?.RoleId ?? 0;
            }
            catch
            {
                return 0;
            }
        }

        private async Task<int> GetDepartmentIdByNameAsync(string departmentName)
        {
            if (string.IsNullOrWhiteSpace(departmentName)) return 0;
            
            try
            {
                var departments = await _departmentRepository.GetAllAsync();
                var dept = departments?.FirstOrDefault(d => d.DepartmentName.Equals(departmentName, StringComparison.OrdinalIgnoreCase));
                return dept?.DepartmentId ?? 0;
            }
            catch
            {
                return 0;
            }
        }

        public byte[] GenerateExcelTemplate()
        {
            try
            {
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                using var package = new ExcelPackage();
                var worksheet = package.Workbook.Worksheets.Add("Users");

                var headers = new[]
                {
                    "EmployeeCompanyId", "Email", "FirstName", "LastName",
                    "EmploymentType", "EmploymentStatus", "JoiningDate",
                    "EmployeeType", "Role", "Department", "MobileNumber", "Gender"
                };

                for (int i = 0; i < headers.Length; i++)
                {
                    worksheet.Cells[1, i + 1].Value = headers[i];
                }

                using (var range = worksheet.Cells[1, 1, 1, headers.Length])
                {
                    range.Style.Font.Bold = true;
                    range.Style.Font.Size = 12;
                    range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    range.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(79, 129, 189));
                    range.Style.Font.Color.SetColor(Color.White);
                    range.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                    range.Style.VerticalAlignment = ExcelVerticalAlignment.Center;
                }

                AddExcelValidations(worksheet);

                var instructionSheet = package.Workbook.Worksheets.Add("Instructions");
                instructionSheet.Cells[1, 1].Value = "Bulk User Import Instructions";
                instructionSheet.Cells[1, 1].Style.Font.Bold = true;
                instructionSheet.Cells[1, 1].Style.Font.Size = 16;

                instructionSheet.Cells[3, 1].Value = "Column Definitions:";
                instructionSheet.Cells[3, 1].Style.Font.Bold = true;

                var instructions = new[]
                {
                    "EmployeeCompanyId: Unique employee ID - min 3 characters, only letters/numbers/underscores (e.g., 12592)",
                    "Email: Valid email address (required) - must be in proper email format",
                    "FirstName: Employee first name (required) - min 2 characters, only letters",
                    "LastName: Employee last name (required) - min 2 characters, only letters",
                    "EmploymentType: Permanent, Contract, Temporary, Intern, Probation (select from dropdown)",
                    "EmploymentStatus: Active, Inactive, OnLeave (select from dropdown)",
                    "JoiningDate: Date in format YYYY-MM-DD (e.g., 2025-01-15)",
                    "EmployeeType: FullTime, PartTime, Intern (select from dropdown)",
                    "Role: Type role name (e.g., Admin, Manager, Employee, HR)",
                    "Department: Type department name (e.g., IT, HR, Finance, Operations)",
                    "MobileNumber: 10-digit phone number starting with 6-9 (e.g., 9876543210) - optional",
                    "Gender: Male, Female, PreferNotToSay (select from dropdown) - optional"
                };

                for (int i = 0; i < instructions.Length; i++)
                {
                    instructionSheet.Cells[i + 4, 1].Value = $"{i + 1}. {instructions[i]}";
                }

                instructionSheet.Cells[18, 1].Value = "Validation Rules:";
                instructionSheet.Cells[18, 1].Style.Font.Bold = true;
                instructionSheet.Cells[18, 1].Style.Font.Size = 14;

                var validationRules = new[]
                {
                    "✓ Names must contain only letters (no numbers or special characters)",
                    "✓ Employee Company ID must be at least 3 characters",
                    "✓ Email must be in valid format (example@domain.com)",
                    "✓ Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits",
                    "✓ Role and Department names must match exactly with system data",
                    "✓ All required fields must be filled",
                    "✓ Use dropdown lists where available for consistency"
                };

                for (int i = 0; i < validationRules.Length; i++)
                {
                    instructionSheet.Cells[i + 19, 1].Value = validationRules[i];
                }

                instructionSheet.Cells[28, 1].Value = " TIP: Start entering data from Row 2 onwards. Header is in Row 1.";
                instructionSheet.Cells[28, 1].Style.Font.Bold = true;
                instructionSheet.Cells[28, 1].Style.Font.Color.SetColor(Color.Green);
                instructionSheet.Cells[28, 1].Style.Font.Size = 12;

                worksheet.Cells.AutoFitColumns();
                instructionSheet.Cells.AutoFitColumns();

                EEPZBusinessLog.Information("Excel template generated successfully");

                return package.GetAsByteArray();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error("Error generating Excel template", ex);
                throw new Exception("Failed to generate Excel template", ex);
            }
        }

        private void AddExcelValidations(ExcelWorksheet worksheet)
        {
            int dataStartRow = 2;
            int dataEndRow = 1000;

            // 1️ EmployeeCompanyId
            var companyIdVal = worksheet.DataValidations.AddTextLengthValidation($"A{dataStartRow}:A{dataEndRow}");
            companyIdVal.Operator = ExcelDataValidationOperator.greaterThanOrEqual;
            companyIdVal.Formula.Value = 3;
            companyIdVal.ShowErrorMessage = true;
            companyIdVal.ErrorTitle = "Invalid Employee ID";
            companyIdVal.Error = "Must be at least 3 characters";

            // 2 Email
            var emailVal = worksheet.DataValidations.AddTextLengthValidation($"B{dataStartRow}:B{dataEndRow}");
            emailVal.Operator = ExcelDataValidationOperator.greaterThan;
            emailVal.Formula.Value = 5;
            emailVal.ShowErrorMessage = true;
            emailVal.ErrorTitle = "Invalid Email";
            emailVal.Error = "Email must be at least 5 characters";

            // 3️ FirstName
            var firstNameVal = worksheet.DataValidations.AddTextLengthValidation($"C{dataStartRow}:C{dataEndRow}");
            firstNameVal.Operator = ExcelDataValidationOperator.greaterThanOrEqual;
            firstNameVal.Formula.Value = 2;
            firstNameVal.ShowErrorMessage = true;
            firstNameVal.ErrorTitle = "Invalid First Name";
            firstNameVal.Error = "Must be at least 2 characters";

            // 4️ LastName
            var lastNameVal = worksheet.DataValidations.AddTextLengthValidation($"D{dataStartRow}:D{dataEndRow}");
            lastNameVal.Operator = ExcelDataValidationOperator.greaterThanOrEqual;
            lastNameVal.Formula.Value = 2;
            lastNameVal.ShowErrorMessage = true;
            lastNameVal.ErrorTitle = "Invalid Last Name";
            lastNameVal.Error = "Must be at least 2 characters";

            // 5️ EmploymentType - Dropdown
            var empTypeVal = worksheet.DataValidations.AddListValidation($"E{dataStartRow}:E{dataEndRow}");
            empTypeVal.Formula.Values.Add("Permanent");
            empTypeVal.Formula.Values.Add("Contract");
            empTypeVal.Formula.Values.Add("Temporary");
            empTypeVal.Formula.Values.Add("Intern");
            empTypeVal.Formula.Values.Add("Probation");
            empTypeVal.ShowErrorMessage = true;
            empTypeVal.ErrorTitle = "Invalid Employment Type";
            empTypeVal.Error = "Select from dropdown";

            // 6️ EmploymentStatus - Dropdown
            var empStatusVal = worksheet.DataValidations.AddListValidation($"F{dataStartRow}:F{dataEndRow}");
            empStatusVal.Formula.Values.Add("Active");
            empStatusVal.Formula.Values.Add("Inactive");
            empStatusVal.Formula.Values.Add("OnLeave");
            empStatusVal.ShowErrorMessage = true;
            empStatusVal.ErrorTitle = "Invalid Employment Status";
            empStatusVal.Error = "Select from dropdown";

            // 7️ JoiningDate - Date
            var dateVal = worksheet.DataValidations.AddDateTimeValidation($"G{dataStartRow}:G{dataEndRow}");
            dateVal.Operator = ExcelDataValidationOperator.greaterThanOrEqual;
            dateVal.Formula.Value = new DateTime(1900, 1, 1);
            dateVal.ShowErrorMessage = true;
            dateVal.ErrorTitle = "Invalid Date";
            dateVal.Error = "Enter date as YYYY-MM-DD";

            // 8️ EmployeeType - Dropdown
            var empTypeDropdown = worksheet.DataValidations.AddListValidation($"H{dataStartRow}:H{dataEndRow}");
            empTypeDropdown.Formula.Values.Add("FullTime");
            empTypeDropdown.Formula.Values.Add("PartTime");
            empTypeDropdown.Formula.Values.Add("Intern");
            empTypeDropdown.ShowErrorMessage = true;
            empTypeDropdown.ErrorTitle = "Invalid Employee Type";
            empTypeDropdown.Error = "Select from dropdown";

            // 9️ Role - Text Input
            var roleVal = worksheet.DataValidations.AddTextLengthValidation($"I{dataStartRow}:I{dataEndRow}");
            roleVal.Operator = ExcelDataValidationOperator.greaterThanOrEqual;
            roleVal.Formula.Value = 2;
            roleVal.ShowErrorMessage = true;
            roleVal.ErrorTitle = "Invalid Role";
            roleVal.Error = "Type role name (min 2 characters)";

            //  Department - Text Input
            var deptVal = worksheet.DataValidations.AddTextLengthValidation($"J{dataStartRow}:J{dataEndRow}");
            deptVal.Operator = ExcelDataValidationOperator.greaterThanOrEqual;
            deptVal.Formula.Value = 2;
            deptVal.ShowErrorMessage = true;
            deptVal.ErrorTitle = "Invalid Department";
            deptVal.Error = "Type department name (min 2 characters)";

            // 1 MobileNumber
            var mobileVal = worksheet.DataValidations.AddTextLengthValidation($"K{dataStartRow}:K{dataEndRow}");
            mobileVal.Operator = ExcelDataValidationOperator.equal;
            mobileVal.Formula.Value = 10;
            mobileVal.AllowBlank = true;
            mobileVal.ShowErrorMessage = true;
            mobileVal.ErrorTitle = "Invalid Phone";
            mobileVal.Error = "Must be exactly 10 digits or blank";

            // 1 Gender - Dropdown
            var genderVal = worksheet.DataValidations.AddListValidation($"L{dataStartRow}:L{dataEndRow}");
            genderVal.Formula.Values.Add("Male");
            genderVal.Formula.Values.Add("Female");
            genderVal.Formula.Values.Add("PreferNotToSay");
            genderVal.AllowBlank = true;
            genderVal.ShowErrorMessage = true;
            genderVal.ErrorTitle = "Invalid Gender";
            genderVal.Error = "Select from dropdown or leave blank";

            // Set column widths
            worksheet.Column(1).Width = 18;
            worksheet.Column(2).Width = 28;
            worksheet.Column(3).Width = 15;
            worksheet.Column(4).Width = 15;
            worksheet.Column(5).Width = 15;
            worksheet.Column(6).Width = 15;
            worksheet.Column(7).Width = 15;
            worksheet.Column(8).Width = 12;
            worksheet.Column(9).Width = 15;
            worksheet.Column(10).Width = 15;
            worksheet.Column(11).Width = 15;
            worksheet.Column(12).Width = 18;

            // Freeze header row
            worksheet.View.FreezePanes(2, 1);
        }
    }
}
