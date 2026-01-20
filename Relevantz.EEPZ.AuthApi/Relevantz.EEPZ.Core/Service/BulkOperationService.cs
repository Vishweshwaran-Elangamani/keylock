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
 
 
        public async Task<ApiResponseDto<BulkOperationResponseDto>> BulkCreateUsersAsync(List<CreateUserRequestDto> users, int performedByUserId)
        {
            var successCount = 0;
            var failureCount = 0;
            var errors = new List<string>();
            var successfulUsers = new List<SuccessfulUserDto>();  
            var rowNumber = 1;
 
 
            var nextIdString = await _employeeRepository.GetNextEmployeeCompanyIdAsync();
            int nextEmployeeId = int.Parse(nextIdString);
 
 
            //  LOAD ROLES AND DEPARTMENTS FOR MAPPING
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
 
 
            return ApiResponseDto<BulkOperationResponseDto>.SuccessResponse(response, "Bulk operation completed");
        }
 
 
 
        public async Task<ApiResponseDto<BulkOperationResponseDto>> BulkInactivateUsersAsync(BulkUserInactivateRequestDto request, int performedByUserId)
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
 
 
            return ApiResponseDto<BulkOperationResponseDto>.SuccessResponse(response, "Bulk operation completed");
        }
 
 
        public async Task<ApiResponseDto<BulkOperationResponseDto>> BulkCreateUsersFromExcelAsync(Stream fileStream, int performedByUserId)
        {
            var users = new List<CreateUserRequestDto>();
            var parseErrors = new List<string>();
 
 
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
                    var isEmptyRow = true;
                    for (int col = 1; col <= 11; col++)
                    {
                        if (worksheet.Cells[row, col].Value != null &&
                            !string.IsNullOrWhiteSpace(worksheet.Cells[row, col].Value.ToString()))
                        {
                            isEmptyRow = false;
                            break;
                        }
                    }
 
 
                    if (isEmptyRow) continue;
                    var mobileNumber = worksheet.Cells[row, 10].Value?.ToString();
                    if (!string.IsNullOrWhiteSpace(mobileNumber))
                    {
                        mobileNumber = mobileNumber.Replace("+91-", "").Replace("+91", "").Replace("-", "").Replace(" ", "").Trim();
                    }
 
 
                    var roleName = worksheet.Cells[row, 8].Value?.ToString()?.Trim() ?? string.Empty;
                    var roleId = await GetRoleIdByNameAsync(roleName);
 
 
                    var departmentName = worksheet.Cells[row, 9].Value?.ToString()?.Trim() ?? string.Empty;
                    var departmentId = await GetDepartmentIdByNameAsync(departmentName);
 
 
                    var user = new CreateUserRequestDto
                    {
                        EmployeeCompanyId = string.Empty,
                        Email = worksheet.Cells[row, 1].Value?.ToString()?.Trim() ?? string.Empty,
                        FirstName = worksheet.Cells[row, 2].Value?.ToString()?.Trim() ?? string.Empty,
                        LastName = worksheet.Cells[row, 3].Value?.ToString()?.Trim() ?? string.Empty,
                        EmploymentType = worksheet.Cells[row, 4].Value?.ToString()?.Trim() ?? Constants.EmploymentTypes.Permanent,
                        EmploymentStatus = worksheet.Cells[row, 5].Value?.ToString()?.Trim() ?? Constants.EmploymentStatuses.Active,
                        JoiningDate = DateOnly.TryParse(worksheet.Cells[row, 6].Value?.ToString(), out var joinDate) ? joinDate : DateOnly.FromDateTime(DateTime.UtcNow),
                        EmployeeType = worksheet.Cells[row, 7].Value?.ToString()?.Trim() ?? Constants.EmployeeTypes.FullTime,
                        RoleId = roleId,
                        DepartmentId = departmentId,
                        MobileNumber = mobileNumber,
                        Gender = worksheet.Cells[row, 11].Value?.ToString()?.Trim()
                    };
 
 
                    users.Add(user);
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
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
 
 
            var roles = await _roleRepository.GetAllAsync();
            var departments = await _departmentRepository.GetAllAsync();
 
 
            var availableRoles = roles?.Where(r => r.RoleName != "Admin").ToList() ?? new List<Role>();
            var availableDepartments = departments ?? new List<Department>();
 
 
            EEPZBusinessLog.Information($"Generating template with {availableRoles.Count} roles and {availableDepartments.Count} departments");
 
 
            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("Users");
 
 
            var headers = new[]
            {
                "Email", "FirstName", "LastName",
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
 
 
            CreateReferenceDataSheet(package, availableRoles, availableDepartments);
 
 
            AddExcelValidations(worksheet, availableRoles, availableDepartments);
 
 
            var instructionSheet = package.Workbook.Worksheets.Add("Instructions");
            instructionSheet.Cells[1, 1].Value = "Bulk User Import Instructions";
            instructionSheet.Cells[1, 1].Style.Font.Bold = true;
            instructionSheet.Cells[1, 1].Style.Font.Size = 16;
 
 
            instructionSheet.Cells[3, 1].Value = "IMPORTANT: Employee IDs are AUTO-GENERATED";
            instructionSheet.Cells[3, 1].Style.Font.Bold = true;
            instructionSheet.Cells[3, 1].Style.Font.Color.SetColor(Color.Red);
            instructionSheet.Cells[3, 1].Style.Font.Size = 14;
 
 
            instructionSheet.Cells[4, 1].Value = "Do NOT include Employee ID column. IDs will be assigned automatically starting from the last used ID (e.g., 1000, 1001, 1002...)";
            instructionSheet.Cells[4, 1].Style.Font.Color.SetColor(Color.Red);
 
 
            instructionSheet.Cells[6, 1].Value = "Column Definitions:";
            instructionSheet.Cells[6, 1].Style.Font.Bold = true;
 
 
            var instructions = new[]
            {
                "Email: Valid email address (required) - must be in proper email format",
                "FirstName: Employee first name (required) - min 2 characters, only letters",
                "LastName: Employee last name (required) - min 2 characters, only letters",
                "EmploymentType: Select from dropdown (Permanent, Contract, Temporary, Intern, Probation)",
                "EmploymentStatus: Select from dropdown (Active, Inactive, OnLeave)",
                "JoiningDate: Date in format YYYY-MM-DD (e.g., 2025-01-15)",
                "EmployeeType: Select from dropdown (FullTime, PartTime, Intern)",
                $"Role: Select from dropdown ({availableRoles.Count} roles available - excludes Admin role)",
                $"Department: Select from dropdown ({availableDepartments.Count} departments available)",
                "MobileNumber: 10-digit phone number starting with 6-9 (e.g., 9876543210) - optional, WITHOUT +91 prefix",
                "Gender: Select from dropdown (Male, Female, PreferNotToSay) - optional"
            };
 
 
            for (int i = 0; i < instructions.Length; i++)
            {
                instructionSheet.Cells[i + 7, 1].Value = $"{i + 1}. {instructions[i]}";
            }
 
 
            instructionSheet.Cells[20, 1].Value = "Validation Rules:";
            instructionSheet.Cells[20, 1].Style.Font.Bold = true;
            instructionSheet.Cells[20, 1].Style.Font.Size = 14;
 
 
            var validationRules = new[]
            {
                "Employee IDs are AUTOMATICALLY assigned - sequential numbering",
                "Names must contain only letters (no numbers or special characters)",
                "Email must be in valid format (example@domain.com)",
                "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits (NO +91 prefix)",
                "Role and Department: Use dropdown lists (values from database)",
                "All required fields must be filled",
                "Use dropdown lists for all fields that have them"
            };
 
 
            for (int i = 0; i < validationRules.Length; i++)
            {
                instructionSheet.Cells[i + 21, 1].Value = validationRules[i];
            }
 
 
            instructionSheet.Cells[30, 1].Value = "TIP: Start entering data from Row 2 onwards. Header is in Row 1. Use dropdowns for Role and Department.";
            instructionSheet.Cells[30, 1].Style.Font.Bold = true;
            instructionSheet.Cells[30, 1].Style.Font.Color.SetColor(Color.Green);
            instructionSheet.Cells[30, 1].Style.Font.Size = 12;
 
 
            worksheet.Cells.AutoFitColumns();
            instructionSheet.Cells.AutoFitColumns();
 
 
            EEPZBusinessLog.Information("Excel template generated successfully with dynamic dropdowns");
 
 
            return package.GetAsByteArray();
        }
 
 
        private void CreateReferenceDataSheet(ExcelPackage package, List<Role> roles, List<Department> departments)
        {
            var refSheet = package.Workbook.Worksheets.Add("ReferenceData");
 
 
            refSheet.Cells[1, 1].Value = "Roles";
            refSheet.Cells[1, 1].Style.Font.Bold = true;
 
 
            for (int i = 0; i < roles.Count; i++)
            {
                refSheet.Cells[i + 2, 1].Value = roles[i].RoleName;
            }
 
 
            refSheet.Cells[1, 2].Value = "Departments";
            refSheet.Cells[1, 2].Style.Font.Bold = true;
 
 
            for (int i = 0; i < departments.Count; i++)
            {
                refSheet.Cells[i + 2, 2].Value = departments[i].DepartmentName;
            }
 
 
            refSheet.Hidden = eWorkSheetHidden.VeryHidden;
 
 
            EEPZBusinessLog.Information($"Reference data sheet created with {roles.Count} roles and {departments.Count} departments");
        }
 
 
        private void AddExcelValidations(ExcelWorksheet worksheet, List<Role> roles, List<Department> departments)
        {
            int dataStartRow = 2;
            int dataEndRow = 1000;
 
 
            var emailVal = worksheet.DataValidations.AddTextLengthValidation($"A{dataStartRow}:A{dataEndRow}");
            emailVal.Operator = ExcelDataValidationOperator.greaterThan;
            emailVal.Formula.Value = 5;
            emailVal.ShowErrorMessage = true;
            emailVal.ErrorTitle = "Invalid Email";
            emailVal.Error = "Email must be at least 5 characters";
 
 
            var firstNameVal = worksheet.DataValidations.AddTextLengthValidation($"B{dataStartRow}:B{dataEndRow}");
            firstNameVal.Operator = ExcelDataValidationOperator.greaterThanOrEqual;
            firstNameVal.Formula.Value = 2;
            firstNameVal.ShowErrorMessage = true;
            firstNameVal.ErrorTitle = "Invalid First Name";
            firstNameVal.Error = "Must be at least 2 characters";
 
 
            var lastNameVal = worksheet.DataValidations.AddTextLengthValidation($"C{dataStartRow}:C{dataEndRow}");
            lastNameVal.Operator = ExcelDataValidationOperator.greaterThanOrEqual;
            lastNameVal.Formula.Value = 2;
            lastNameVal.ShowErrorMessage = true;
            lastNameVal.ErrorTitle = "Invalid Last Name";
            lastNameVal.Error = "Must be at least 2 characters";
 
 
            var empTypeVal = worksheet.DataValidations.AddListValidation($"D{dataStartRow}:D{dataEndRow}");
            empTypeVal.Formula.Values.Add("Permanent");
            empTypeVal.Formula.Values.Add("Contract");
            empTypeVal.Formula.Values.Add("Temporary");
            empTypeVal.Formula.Values.Add("Intern");
            empTypeVal.Formula.Values.Add("Probation");
            empTypeVal.ShowErrorMessage = true;
            empTypeVal.ErrorTitle = "Invalid Employment Type";
            empTypeVal.Error = "Select from dropdown";
 
 
            var empStatusVal = worksheet.DataValidations.AddListValidation($"E{dataStartRow}:E{dataEndRow}");
            empStatusVal.Formula.Values.Add("Active");
            empStatusVal.Formula.Values.Add("Inactive");
            empStatusVal.Formula.Values.Add("OnLeave");
            empStatusVal.ShowErrorMessage = true;
            empStatusVal.ErrorTitle = "Invalid Employment Status";
            empStatusVal.Error = "Select from dropdown";
 
 
            var dateVal = worksheet.DataValidations.AddDateTimeValidation($"F{dataStartRow}:F{dataEndRow}");
            dateVal.Operator = ExcelDataValidationOperator.greaterThanOrEqual;
            dateVal.Formula.Value = new DateTime(1900, 1, 1);
            dateVal.ShowErrorMessage = true;
            dateVal.ErrorTitle = "Invalid Date";
            dateVal.Error = "Enter date as YYYY-MM-DD";
 
 
            var empTypeDropdown = worksheet.DataValidations.AddListValidation($"G{dataStartRow}:G{dataEndRow}");
            empTypeDropdown.Formula.Values.Add("FullTime");
            empTypeDropdown.Formula.Values.Add("PartTime");
            empTypeDropdown.Formula.Values.Add("Intern");
            empTypeDropdown.ShowErrorMessage = true;
            empTypeDropdown.ErrorTitle = "Invalid Employee Type";
            empTypeDropdown.Error = "Select from dropdown";
 
 
            if (roles != null && roles.Any())
            {
                var roleValidation = worksheet.DataValidations.AddListValidation($"H{dataStartRow}:H{dataEndRow}");
                roleValidation.ShowErrorMessage = true;
                roleValidation.ErrorTitle = "Invalid Role";
                roleValidation.Error = "Select a role from the dropdown list";
                roleValidation.ShowInputMessage = true;
                roleValidation.PromptTitle = "Select Role";
                roleValidation.Prompt = $"Choose from {roles.Count} available roles";
                roleValidation.Formula.ExcelFormula = $"ReferenceData!$A$2:$A${roles.Count + 1}";
 
 
                EEPZBusinessLog.Information($"Role dropdown created with {roles.Count} options");
            }
 
 
            if (departments != null && departments.Any())
            {
                var deptValidation = worksheet.DataValidations.AddListValidation($"I{dataStartRow}:I{dataEndRow}");
                deptValidation.ShowErrorMessage = true;
                deptValidation.ErrorTitle = "Invalid Department";
                deptValidation.Error = "Select a department from the dropdown list";
                deptValidation.ShowInputMessage = true;
                deptValidation.PromptTitle = "Select Department";
                deptValidation.Prompt = $"Choose from {departments.Count} available departments";
                deptValidation.Formula.ExcelFormula = $"ReferenceData!$B$2:$B${departments.Count + 1}";
 
 
                EEPZBusinessLog.Information($"Department dropdown created with {departments.Count} options");
            }
 
 
            var mobileVal = worksheet.DataValidations.AddTextLengthValidation($"J{dataStartRow}:J{dataEndRow}");
            mobileVal.Operator = ExcelDataValidationOperator.equal;
            mobileVal.Formula.Value = 10;
            mobileVal.AllowBlank = true;
            mobileVal.ShowErrorMessage = true;
            mobileVal.ErrorTitle = "Invalid Phone";
            mobileVal.Error = "Must be exactly 10 digits or blank";
 
 
            var genderVal = worksheet.DataValidations.AddListValidation($"K{dataStartRow}:K{dataEndRow}");
            genderVal.Formula.Values.Add("Male");
            genderVal.Formula.Values.Add("Female");
            genderVal.Formula.Values.Add("PreferNotToSay");
            genderVal.AllowBlank = true;
            genderVal.ShowErrorMessage = true;
            genderVal.ErrorTitle = "Invalid Gender";
            genderVal.Error = "Select from dropdown or leave blank";
 
 
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
 
 
            worksheet.View.FreezePanes(2, 1);
        }
    }
}
