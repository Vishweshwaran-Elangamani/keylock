using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Core.Service
{
    public class ExportService : IExportService
    {
        private readonly IRoleRepository _roleRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IUserAuthenticationRepository _userAuthRepository;
        private const string EXPORT_PASSWORD = ExcelPasswordConstant.EXPORT_PASSWORD;

        public ExportService(
            IRoleRepository roleRepository,
            IDepartmentRepository departmentRepository,
            IUserAuthenticationRepository userAuthRepository)
        {
            _roleRepository = roleRepository;
            _departmentRepository = departmentRepository;
            _userAuthRepository = userAuthRepository;
        }

        public string GetLastExportPassword()
        {
            return EXPORT_PASSWORD;
        }

        public async Task<byte[]> ExportRolesToExcelAsync()
        {
            var roles = await _roleRepository.GetAllAsync();
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add(ExportConstants.SheetNames.Roles);
            
            worksheet.Cells[1, 1].Value = ExportConstants.ColumnHeaders.Roles.RoleId;
            worksheet.Cells[1, 2].Value = ExportConstants.ColumnHeaders.Roles.RoleName;
            worksheet.Cells[1, 3].Value = ExportConstants.ColumnHeaders.Roles.RoleCode;
            worksheet.Cells[1, 4].Value = ExportConstants.ColumnHeaders.Roles.Description;
            worksheet.Cells[1, 5].Value = ExportConstants.ColumnHeaders.Roles.IsSystemRole;
            worksheet.Cells[1, 6].Value = ExportConstants.ColumnHeaders.Roles.CreatedAt;
            worksheet.Cells[1, 7].Value = ExportConstants.ColumnHeaders.Roles.UpdatedAt;
            
            using (var range = worksheet.Cells[1, 1, 1, 7])
            {
                range.Style.Font.Bold = true;
                range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(ExportConstants.Styling.HeaderBackgroundColor);
                range.Style.Font.Color.SetColor(ExportConstants.Styling.HeaderFontColor);
                range.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            }
            
            int row = 2;
            foreach (var role in roles)
            {
                worksheet.Cells[row, 1].Value = role.RoleId;
                worksheet.Cells[row, 2].Value = role.RoleName;
                worksheet.Cells[row, 3].Value = role.RoleCode;
                worksheet.Cells[row, 4].Value = role.Description ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 5].Value = role.IsSystemRole == true ? ExportConstants.Defaults.Yes : ExportConstants.Defaults.No;
                worksheet.Cells[row, 6].Value = role.CreatedAt.ToString(ExportConstants.DateFormats.DateTimeFormat);
                worksheet.Cells[row, 7].Value = role.UpdatedAt?.ToString(ExportConstants.DateFormats.DateTimeFormat) ?? ExportConstants.Defaults.NotAvailable;
                row++;
            }
            
            worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();
            
            using (var range = worksheet.Cells[1, 1, row - 1, 7])
            {
                range.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                range.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                range.Style.Border.Right.Style = ExcelBorderStyle.Thin;
                range.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
            }

            package.Encryption.IsEncrypted = true;
            package.Encryption.Password = EXPORT_PASSWORD;

            EEPZBusinessLog.Information($"{ExportConstants.LogMessages.RolesExported} - Password protected");
            return package.GetAsByteArray();
        }

        public async Task<byte[]> ExportDepartmentsToExcelAsync()
        {
            var departments = await _departmentRepository.GetAllAsync();
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add(ExportConstants.SheetNames.Departments);
            
            worksheet.Cells[1, 1].Value = ExportConstants.ColumnHeaders.Departments.DepartmentId;
            worksheet.Cells[1, 2].Value = ExportConstants.ColumnHeaders.Departments.DepartmentName;
            worksheet.Cells[1, 3].Value = ExportConstants.ColumnHeaders.Departments.BudgetAllocated;
            worksheet.Cells[1, 4].Value = ExportConstants.ColumnHeaders.Departments.CostCenter;
            worksheet.Cells[1, 5].Value = ExportConstants.ColumnHeaders.Departments.CreatedAt;
            worksheet.Cells[1, 6].Value = ExportConstants.ColumnHeaders.Departments.UpdatedAt;
            
            using (var range = worksheet.Cells[1, 1, 1, 6])
            {
                range.Style.Font.Bold = true;
                range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(ExportConstants.Styling.HeaderBackgroundColor);
                range.Style.Font.Color.SetColor(ExportConstants.Styling.HeaderFontColor);
                range.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            }
            
            int row = 2;
            foreach (var dept in departments)
            {
                worksheet.Cells[row, 1].Value = dept.DepartmentId;
                worksheet.Cells[row, 2].Value = dept.DepartmentName;
                worksheet.Cells[row, 3].Value = dept.BudgetAllocated?.ToString(ExportConstants.NumberFormats.DecimalFormat) ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 4].Value = dept.CostCenter ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 5].Value = dept.CreatedAt.ToString(ExportConstants.DateFormats.DateTimeFormat);
                worksheet.Cells[row, 6].Value = dept.UpdatedAt?.ToString(ExportConstants.DateFormats.DateTimeFormat) ?? ExportConstants.Defaults.NotAvailable;
                row++;
            }
            
            worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();
            
            using (var range = worksheet.Cells[1, 1, row - 1, 6])
            {
                range.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                range.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                range.Style.Border.Right.Style = ExcelBorderStyle.Thin;
                range.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
            }

            package.Encryption.IsEncrypted = true;
            package.Encryption.Password = EXPORT_PASSWORD;

            EEPZBusinessLog.Information($"{ExportConstants.LogMessages.DepartmentsExported} - Password protected");
            return package.GetAsByteArray();
        }

        public async Task<byte[]> ExportUsersToExcelAsync()
        {
            var users = await _userAuthRepository.GetAllAsync();
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add(ExportConstants.SheetNames.Users);
            
            worksheet.Cells[1, 1].Value = ExportConstants.ColumnHeaders.Users.UserId;
            worksheet.Cells[1, 2].Value = ExportConstants.ColumnHeaders.Users.EmployeeCompanyId;
            worksheet.Cells[1, 3].Value = ExportConstants.ColumnHeaders.Users.Email;
            worksheet.Cells[1, 4].Value = ExportConstants.ColumnHeaders.Users.FirstName;
            worksheet.Cells[1, 5].Value = ExportConstants.ColumnHeaders.Users.LastName;
            worksheet.Cells[1, 6].Value = ExportConstants.ColumnHeaders.Users.MobileNumber;
            worksheet.Cells[1, 7].Value = ExportConstants.ColumnHeaders.Users.Gender;
            worksheet.Cells[1, 8].Value = ExportConstants.ColumnHeaders.Users.EmploymentType;
            worksheet.Cells[1, 9].Value = ExportConstants.ColumnHeaders.Users.EmploymentStatus;
            worksheet.Cells[1, 10].Value = ExportConstants.ColumnHeaders.Users.EmployeeType;
            worksheet.Cells[1, 11].Value = ExportConstants.ColumnHeaders.Users.JoiningDate;
            worksheet.Cells[1, 12].Value = ExportConstants.ColumnHeaders.Users.WorkLocation;
            worksheet.Cells[1, 13].Value = ExportConstants.ColumnHeaders.Users.RoleName;
            worksheet.Cells[1, 14].Value = ExportConstants.ColumnHeaders.Users.DepartmentName;
            worksheet.Cells[1, 15].Value = ExportConstants.ColumnHeaders.Users.Status;
            worksheet.Cells[1, 16].Value = ExportConstants.ColumnHeaders.Users.IsActive;
            worksheet.Cells[1, 17].Value = ExportConstants.ColumnHeaders.Users.LastLogin;
            worksheet.Cells[1, 18].Value = ExportConstants.ColumnHeaders.Users.CreatedAt;
            
            using (var range = worksheet.Cells[1, 1, 1, 18])
            {
                range.Style.Font.Bold = true;
                range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(ExportConstants.Styling.HeaderBackgroundColor);
                range.Style.Font.Color.SetColor(ExportConstants.Styling.HeaderFontColor);
                range.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            }
            
            int row = 2;
            foreach (var user in users)
            {
                var profile = user.Employee?.Userprofile;
                var employeeDetails = user.Employee?.Employeedetailsmasters?.FirstOrDefault();
                
                worksheet.Cells[row, 1].Value = user.UserId;
                worksheet.Cells[row, 2].Value = user.Employee?.EmployeeCompanyId ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 3].Value = user.Email;
                worksheet.Cells[row, 4].Value = profile?.FirstName ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 5].Value = profile?.LastName ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 6].Value = profile?.MobileNumber ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 7].Value = profile?.Gender ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 8].Value = user.Employee?.EmploymentType ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 9].Value = user.Employee?.EmploymentStatus ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 10].Value = user.Employee?.EmployeeType ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 11].Value = user.Employee?.JoiningDate.ToString(ExportConstants.DateFormats.DateFormat) ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 12].Value = user.Employee?.WorkLocation ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 13].Value = employeeDetails?.Role?.RoleName ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 14].Value = employeeDetails?.Department?.DepartmentName ?? ExportConstants.Defaults.NotAvailable;
                worksheet.Cells[row, 15].Value = user.Status;
                worksheet.Cells[row, 16].Value = user.Employee?.IsActive == true ? ExportConstants.Defaults.Yes : ExportConstants.Defaults.No;
                worksheet.Cells[row, 17].Value = user.LastLoginAt?.ToString(ExportConstants.DateFormats.DateTimeFormat) ?? ExportConstants.Defaults.Never;
                worksheet.Cells[row, 18].Value = user.CreatedAt.ToString(ExportConstants.DateFormats.DateTimeFormat);
                row++;
            }
            
            worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();
            
            using (var range = worksheet.Cells[1, 1, row - 1, 18])
            {
                range.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                range.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                range.Style.Border.Right.Style = ExcelBorderStyle.Thin;
                range.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
            }

            package.Encryption.IsEncrypted = true;
            package.Encryption.Password = EXPORT_PASSWORD;

            EEPZBusinessLog.Information($"Users exported to Excel successfully - Total: {users.Count} - Password protected");
            return package.GetAsByteArray();
        }

        public async Task<byte[]> ExportAllDataToExcelAsync()
        {
            var roles = await _roleRepository.GetAllAsync();
            var departments = await _departmentRepository.GetAllAsync();
            var users = await _userAuthRepository.GetAllAsync();
            
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using var package = new ExcelPackage();
            
            var rolesSheet = package.Workbook.Worksheets.Add(ExportConstants.SheetNames.Roles);
            rolesSheet.Cells[1, 1].Value = ExportConstants.ColumnHeaders.Roles.RoleId;
            rolesSheet.Cells[1, 2].Value = ExportConstants.ColumnHeaders.Roles.RoleName;
            rolesSheet.Cells[1, 3].Value = ExportConstants.ColumnHeaders.Roles.RoleCode;
            rolesSheet.Cells[1, 4].Value = ExportConstants.ColumnHeaders.Roles.Description;
            rolesSheet.Cells[1, 5].Value = ExportConstants.ColumnHeaders.Roles.IsSystemRole;
            
            using (var range = rolesSheet.Cells[1, 1, 1, 5])
            {
                range.Style.Font.Bold = true;
                range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(ExportConstants.Styling.HeaderBackgroundColor);
                range.Style.Font.Color.SetColor(ExportConstants.Styling.HeaderFontColor);
            }
            
            int roleRow = 2;
            foreach (var role in roles)
            {
                rolesSheet.Cells[roleRow, 1].Value = role.RoleId;
                rolesSheet.Cells[roleRow, 2].Value = role.RoleName;
                rolesSheet.Cells[roleRow, 3].Value = role.RoleCode;
                rolesSheet.Cells[roleRow, 4].Value = role.Description ?? ExportConstants.Defaults.NotAvailable;
                rolesSheet.Cells[roleRow, 5].Value = role.IsSystemRole == true ? ExportConstants.Defaults.Yes : ExportConstants.Defaults.No;
                roleRow++;
            }
            rolesSheet.Cells[rolesSheet.Dimension.Address].AutoFitColumns();
            
            var deptSheet = package.Workbook.Worksheets.Add(ExportConstants.SheetNames.Departments);
            deptSheet.Cells[1, 1].Value = ExportConstants.ColumnHeaders.Departments.DepartmentId;
            deptSheet.Cells[1, 2].Value = ExportConstants.ColumnHeaders.Departments.DepartmentName;
            deptSheet.Cells[1, 3].Value = ExportConstants.ColumnHeaders.Departments.BudgetAllocated;
            deptSheet.Cells[1, 4].Value = ExportConstants.ColumnHeaders.Departments.CostCenter;
            
            using (var range = deptSheet.Cells[1, 1, 1, 4])
            {
                range.Style.Font.Bold = true;
                range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(ExportConstants.Styling.HeaderBackgroundColor);
                range.Style.Font.Color.SetColor(ExportConstants.Styling.HeaderFontColor);
            }
            
            int deptRow = 2;
            foreach (var dept in departments)
            {
                deptSheet.Cells[deptRow, 1].Value = dept.DepartmentId;
                deptSheet.Cells[deptRow, 2].Value = dept.DepartmentName;
                deptSheet.Cells[deptRow, 3].Value = dept.BudgetAllocated?.ToString(ExportConstants.NumberFormats.DecimalFormat) ?? ExportConstants.Defaults.NotAvailable;
                deptSheet.Cells[deptRow, 4].Value = dept.CostCenter ?? ExportConstants.Defaults.NotAvailable;
                deptRow++;
            }
            deptSheet.Cells[deptSheet.Dimension.Address].AutoFitColumns();
            
            var usersSheet = package.Workbook.Worksheets.Add(ExportConstants.SheetNames.Users);
            usersSheet.Cells[1, 1].Value = ExportConstants.ColumnHeaders.Users.UserId;
            usersSheet.Cells[1, 2].Value = ExportConstants.ColumnHeaders.Users.EmployeeCompanyId;
            usersSheet.Cells[1, 3].Value = ExportConstants.ColumnHeaders.Users.Email;
            usersSheet.Cells[1, 4].Value = ExportConstants.ColumnHeaders.Users.FirstName;
            usersSheet.Cells[1, 5].Value = ExportConstants.ColumnHeaders.Users.LastName;
            usersSheet.Cells[1, 6].Value = ExportConstants.ColumnHeaders.Users.Mobile;
            usersSheet.Cells[1, 7].Value = ExportConstants.ColumnHeaders.Users.Role;
            usersSheet.Cells[1, 8].Value = ExportConstants.ColumnHeaders.Users.Department;
            usersSheet.Cells[1, 9].Value = ExportConstants.ColumnHeaders.Users.Status;
            usersSheet.Cells[1, 10].Value = ExportConstants.ColumnHeaders.Users.IsActive;
            
            using (var range = usersSheet.Cells[1, 1, 1, 10])
            {
                range.Style.Font.Bold = true;
                range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(ExportConstants.Styling.HeaderBackgroundColor);
                range.Style.Font.Color.SetColor(ExportConstants.Styling.HeaderFontColor);
            }
            
            int userRow = 2;
            foreach (var user in users)
            {
                var profile = user.Employee?.Userprofile;
                var employeeDetails = user.Employee?.Employeedetailsmasters?.FirstOrDefault();
                
                usersSheet.Cells[userRow, 1].Value = user.UserId;
                usersSheet.Cells[userRow, 2].Value = user.Employee?.EmployeeCompanyId ?? ExportConstants.Defaults.NotAvailable;
                usersSheet.Cells[userRow, 3].Value = user.Email;
                usersSheet.Cells[userRow, 4].Value = profile?.FirstName ?? ExportConstants.Defaults.NotAvailable;
                usersSheet.Cells[userRow, 5].Value = profile?.LastName ?? ExportConstants.Defaults.NotAvailable;
                usersSheet.Cells[userRow, 6].Value = profile?.MobileNumber ?? ExportConstants.Defaults.NotAvailable;
                usersSheet.Cells[userRow, 7].Value = employeeDetails?.Role?.RoleName ?? ExportConstants.Defaults.NotAvailable;
                usersSheet.Cells[userRow, 8].Value = employeeDetails?.Department?.DepartmentName ?? ExportConstants.Defaults.NotAvailable;
                usersSheet.Cells[userRow, 9].Value = user.Status;
                usersSheet.Cells[userRow, 10].Value = user.Employee?.IsActive == true ? ExportConstants.Defaults.Yes : ExportConstants.Defaults.No;
                userRow++;
            }
            usersSheet.Cells[usersSheet.Dimension.Address].AutoFitColumns();

            package.Encryption.IsEncrypted = true;
            package.Encryption.Password = EXPORT_PASSWORD;

            EEPZBusinessLog.Information($"{ExportConstants.LogMessages.AllDataExported} - Password protected");
            return package.GetAsByteArray();
        }
    }
}
