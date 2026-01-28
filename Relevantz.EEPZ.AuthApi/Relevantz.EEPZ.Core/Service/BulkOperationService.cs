using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using ClosedXML.Excel;
using System.Text.RegularExpressions;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Constants;
using System.Globalization;
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
        // Compiled regex for performance
        private static readonly Regex NameRegex = new(@"^[a-zA-Z\s]+$", RegexOptions.Compiled);
        private static readonly Regex EmailRegex = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        private static readonly Regex PhoneRegex = new(@"^[6-9][0-9]{9}$", RegexOptions.Compiled);
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
            // First Name
            if (string.IsNullOrWhiteSpace(user.FirstName))
            {
                errors.Add($"{rowPrefix}: First name is required");
            }
            else
            {
                var fn = user.FirstName.Trim();
                if (fn.Length < 2)
                    errors.Add($"{rowPrefix}: First name must be at least 2 characters");
                else if (!NameRegex.IsMatch(fn))
                    errors.Add($"{rowPrefix}: First name must contain only letters");
            }
            // Last Name
            if (string.IsNullOrWhiteSpace(user.LastName))
            {
                errors.Add($"{rowPrefix}: Last name is required");
            }
            else
            {
                var ln = user.LastName.Trim();
                if (ln.Length < 2)
                    errors.Add($"{rowPrefix}: Last name must be at least 2 characters");
                else if (!NameRegex.IsMatch(ln))
                    errors.Add($"{rowPrefix}: Last name must contain only letters");
            }
            // Email
            if (string.IsNullOrWhiteSpace(user.Email))
            {
                errors.Add($"{rowPrefix}: Email is required");
            }
            else
            {
                var em = user.Email.Trim();
                if (!EmailRegex.IsMatch(em))
                    errors.Add($"{rowPrefix}: Invalid email format");
            }
            // Phone
            if (!string.IsNullOrWhiteSpace(user.MobileNumber))
            {
                var cleanedNumber = CleanIndianMobile(user.MobileNumber);
                if (!PhoneRegex.IsMatch(cleanedNumber))
                    errors.Add($"{rowPrefix}: Phone number must start with 6-9 and be exactly 10 digits");
            }
            // Role/Department
            if (user.RoleId <= 0)
                errors.Add($"{rowPrefix}: Valid Role is required");
            if (user.DepartmentId <= 0)
                errors.Add($"{rowPrefix}: Valid Department is required");
            // DOB official (if present)
            if (user.DateOfBirthOfficial.HasValue)
            {
                var dob = user.DateOfBirthOfficial.Value.ToDateTime(TimeOnly.MinValue);
                var today = DateTime.Today;
                var age = today.Year - dob.Year;
                if (dob > today)
                    errors.Add($"{rowPrefix}: Date of birth cannot be in the future");
                else
                {
                    if (dob.Date > today.AddYears(-age)) age--; // adjust if birthday not yet reached
                    if (age < 18)
                        errors.Add($"{rowPrefix}: User must be at least 18 years old (current age: {age})");
                    else if (age > 100)
                        errors.Add($"{rowPrefix}: Invalid date of birth (age cannot exceed 100 years)");
                }
            }
            return errors;
        }
        public async Task<BulkOperationResponseDto> BulkCreateUsersAsync(List<CreateUserRequestDto> users, int performedByUserId)
        {
            // Pre-allocate to reduce re-allocations
            var errors = new List<string>(capacity: Math.Max(16, users.Count / 10));
            var successfulUsers = new List<SuccessfulUserDto>(capacity: Math.Max(16, users.Count / 2));
            var successCount = 0;
            var failureCount = 0;
            var rowNumber = 1;
            var nextIdString = await _employeeRepository.GetNextEmployeeCompanyIdAsync();
            if (!int.TryParse(nextIdString, NumberStyles.Integer, CultureInfo.InvariantCulture, out int nextEmployeeId))
            {
                // Fallback if repository returns unexpected format
                EEPZBusinessLog.Warning($"GetNextEmployeeCompanyIdAsync returned non-integer '{nextIdString}'. Falling back to 1.");
                nextEmployeeId = 1;
            }
            var roles = await _roleRepository.GetAllAsync() ?? new List<Role>();
            var departments = await _departmentRepository.GetAllAsync() ?? new List<Department>();
            // Build fast lookup for Role/Department names by Id to avoid per-row LINQ scans
            var roleNameById = roles.GroupBy(r => r.RoleId).ToDictionary(g => g.Key, g => g.First().RoleName);
            var departmentNameById = departments.GroupBy(d => d.DepartmentId).ToDictionary(g => g.Key, g => g.First().DepartmentName);
            EEPZBusinessLog.Information($"Starting bulk user creation with starting EmployeeCompanyId: {nextEmployeeId}");
            foreach (var user in users)
            {
                rowNumber++;
                user.EmployeeCompanyId = nextEmployeeId.ToString(CultureInfo.InvariantCulture);
                nextEmployeeId++;
                var validationErrors = ValidateUserData(user, rowNumber);
                if (validationErrors.Any())
                {
                    failureCount++;
                    errors.AddRange(validationErrors);
                    continue;
                }
                try
                {
                    await _userManagementService.CreateUserAsync(user, performedByUserId);
                    successCount++;
                    var roleName = roleNameById.TryGetValue(user.RoleId, out var rname) ? rname : "Unknown";
                    var departmentName = departmentNameById.TryGetValue(user.DepartmentId, out var dname) ? dname : "Unknown";
                    successfulUsers.Add(new SuccessfulUserDto
                    {
                        Email = user.Email,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        EmployeeCompanyId = user.EmployeeCompanyId,
                        Role = roleName,
                        Department = departmentName
                    });
                }
                catch (Exception ex)
                {
                    failureCount++;
                    errors.Add($"Row {rowNumber} ({user.Email}): {ex.Message}");
                    EEPZBusinessLog.Warning($"Failed to create user at row {rowNumber}: {ex.Message}");
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
            EEPZBusinessLog.Information($"Bulk user creation completed: {successCount}/{users.Count} successful. EmployeeCompanyIds assigned: {nextIdString} to {nextEmployeeId - 1}");
            return response;
        }
        public async Task<BulkOperationResponseDto> BulkInactivateUsersAsync(BulkUserInactivateRequestDto request, int performedByUserId)
        {
            var successCount = 0;
            var failureCount = 0;
            var errors = new List<string>();
            foreach (var userId in request.UserIds)
            {
                try
                {
                    await _userManagementService.DeactivateUserAsync(userId);
                    successCount++;
                }
                catch (Exception ex)
                {
                    failureCount++;
                    errors.Add($"UserId {userId}: {ex.Message}");
                    EEPZBusinessLog.Warning($"Failed to deactivate user {userId}: {ex.Message}");
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
            var users = new List<CreateUserRequestDto>(capacity: 256);
            using var workbook = new XLWorkbook(fileStream);
            var worksheet = workbook.Worksheet(1);
            if (worksheet == null)
            {
                throw new InvalidOperationException(ExcelMessages.NoWorksheetsError);
            }
            var rowCount = worksheet.LastRowUsed()?.RowNumber() ?? 0;
            if (rowCount < 2)
            {
                throw new InvalidOperationException(ExcelMessages.NoDataRowsError);
            }
            // Preload roles/departments ONCE to avoid O(N^2) repository calls
            var roles = await _roleRepository.GetAllAsync() ?? new List<Role>();
            var departments = await _departmentRepository.GetAllAsync() ?? new List<Department>();
            // Build name -> Id dictionary for O(1) mapping (case-insensitive/trimmed)
            var rolesByName = roles
                .Where(r => !string.IsNullOrWhiteSpace(r.RoleName))
                .ToDictionary(r => r.RoleName.Trim().ToLowerInvariant(), r => r.RoleId);
            var departmentsByName = departments
                .Where(d => !string.IsNullOrWhiteSpace(d.DepartmentName))
                .ToDictionary(d => d.DepartmentName.Trim().ToLowerInvariant(), d => d.DepartmentId);
            // Read Excel rows (ClosedXML)
            for (int row = 2; row <= rowCount; row++)
            {
                // Skip empty rows quickly by checking 11 columns
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
                var emailCell = worksheet.Cell(row, 1);
                var email = emailCell.IsEmpty() ? null : emailCell.GetString()?.Trim();
                if (string.IsNullOrWhiteSpace(email))
                    continue; // keep behavior: ignore rows without email
                var firstName = worksheet.Cell(row, 2).GetString().Trim();
                var lastName = worksheet.Cell(row, 3).GetString().Trim();
                var employmentType = worksheet.Cell(row, 4).IsEmpty()
                    ? Constants.EmploymentTypes.Permanent
                    : worksheet.Cell(row, 4).GetString().Trim();
                var employmentStatus = worksheet.Cell(row, 5).IsEmpty()
                    ? Constants.EmploymentStatuses.Active
                    : worksheet.Cell(row, 5).GetString().Trim();
                // Joining Date (robust parsing)
                var jdCell = worksheet.Cell(row, 6);
                var joiningDate = TryReadDateOnly(jdCell) ?? DateOnly.FromDateTime(DateTime.UtcNow);
                var employeeType = worksheet.Cell(row, 7).IsEmpty()
                    ? Constants.EmployeeTypes.FullTime
                    : worksheet.Cell(row, 7).GetString().Trim();
                var roleName = worksheet.Cell(row, 8).GetString().Trim();
                var departmentName = worksheet.Cell(row, 9).GetString().Trim();
                var mobileCell = worksheet.Cell(row, 10);
                var rawMobile = mobileCell.IsEmpty() ? null : mobileCell.GetString();
                var mobileNumber = string.IsNullOrWhiteSpace(rawMobile) ? null : CleanIndianMobile(rawMobile);
                var gender = worksheet.Cell(row, 11).IsEmpty() ? null : worksheet.Cell(row, 11).GetString().Trim();
                // Map names to IDs via dictionaries (no awaits inside the loop)
                var roleId = 0;
                if (!string.IsNullOrWhiteSpace(roleName))
                {
                    rolesByName.TryGetValue(roleName.Trim().ToLowerInvariant(), out roleId);
                }
                var departmentId = 0;
                if (!string.IsNullOrWhiteSpace(departmentName))
                {
                    departmentsByName.TryGetValue(departmentName.Trim().ToLowerInvariant(), out departmentId);
                }
                var user = new CreateUserRequestDto
                {
                    EmployeeCompanyId = "", // generated later
                    Email = email,
                    FirstName = firstName,
                    LastName = lastName,
                    EmploymentType = employmentType,
                    EmploymentStatus = employmentStatus,
                    JoiningDate = joiningDate,
                    EmployeeType = employeeType,
                    RoleId = roleId,
                    DepartmentId = departmentId,
                    MobileNumber = mobileNumber,
                    Gender = gender
                };
                users.Add(user);
            }
            if (users.Count == 0)
            {
                throw new InvalidOperationException(ExcelMessages.NoValidUsersError);
            }
            // Continue to the existing flow
            return await BulkCreateUsersAsync(users, performedByUserId);
        }
        private static string CleanIndianMobile(string? mobile)
        {
            if (string.IsNullOrWhiteSpace(mobile)) return string.Empty;
            // Normalize +91-, +91, spaces, dashes
            var cleaned = mobile
                .Replace("+91-", "", StringComparison.Ordinal)
                .Replace("+91", "", StringComparison.Ordinal)
                .Replace("-", "", StringComparison.Ordinal)
                .Replace(" ", "", StringComparison.Ordinal)
                .Trim();
            return cleaned;
        }
        private static DateOnly? TryReadDateOnly(IXLCell cell)
        {
            if (cell.IsEmpty()) return null;
            try
            {
                if (cell.DataType == XLDataType.DateTime)
                {
                    var dt = cell.GetDateTime();
                    return DateOnly.FromDateTime(dt);
                }
                var str = cell.GetString();
                if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsed))
                {
                    return DateOnly.FromDateTime(parsed);
                }
                // Excel serial number scenario
                if (double.TryParse(str, NumberStyles.Float, CultureInfo.InvariantCulture, out var oa))
                {
                    var dt = DateTime.FromOADate(oa);
                    return DateOnly.FromDateTime(dt);
                }
            }
            catch
            {
                // swallow and return null to keep previous behavior (default to UtcNow at caller)
            }
            return null;
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
            var headerRange = worksheet.Range(1, 1, 1, headers.Length);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Font.FontSize = 12;
            headerRange.Style.Fill.BackgroundColor = XLColor.FromArgb(79, 129, 189);
            headerRange.Style.Font.FontColor = XLColor.White;
            headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
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
            var empTypeRange = worksheet.Range("D2:D1000");
            var empTypeValidation = empTypeRange.SetDataValidation();
            empTypeValidation.List(EmploymentTypeValues.GetCommaSeparated(), true);
            empTypeValidation.InCellDropdown = true;
            var empStatusRange = worksheet.Range("E2:E1000");
            var empStatusValidation = empStatusRange.SetDataValidation();
            empStatusValidation.List(EmploymentStatusValues.GetCommaSeparated(), true);
            empStatusValidation.InCellDropdown = true;
            var employeeTypeRange = worksheet.Range("G2:G1000");
            var employeeTypeValidation = employeeTypeRange.SetDataValidation();
            employeeTypeValidation.List(EmployeeTypeValues.GetCommaSeparated(), true);
            employeeTypeValidation.InCellDropdown = true;
            var genderRange = worksheet.Range("K2:K1000");
            var genderValidation = genderRange.SetDataValidation();
            genderValidation.List(GenderValues.GetCommaSeparated(), true);
            genderValidation.IgnoreBlanks = true;
            genderValidation.InCellDropdown = true;
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