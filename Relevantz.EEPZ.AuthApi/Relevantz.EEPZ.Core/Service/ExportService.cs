using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using System.Drawing;

namespace Relevantz.EEPZ.Core.Service
{
    public class ExportService : IExportService
    {
        private readonly IRoleRepository _roleRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IUserAuthenticationRepository _userAuthRepository;

        public ExportService(
            IRoleRepository roleRepository,
            IDepartmentRepository departmentRepository,
            IUserAuthenticationRepository userAuthRepository)
        {
            _roleRepository = roleRepository;
            _departmentRepository = departmentRepository;
            _userAuthRepository = userAuthRepository;
        }

        public async Task<byte[]> ExportRolesToExcelAsync()
        {
            try
            {
                var roles = await _roleRepository.GetAllAsync();

                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                using var package = new ExcelPackage();
                var worksheet = package.Workbook.Worksheets.Add("Roles");

                worksheet.Cells[1, 1].Value = "Role ID";
                worksheet.Cells[1, 2].Value = "Role Name";
                worksheet.Cells[1, 3].Value = "Role Code";
                worksheet.Cells[1, 4].Value = "Description";
                worksheet.Cells[1, 5].Value = "Is System Role";
                worksheet.Cells[1, 6].Value = "Created At";
                worksheet.Cells[1, 7].Value = "Updated At";

                using (var range = worksheet.Cells[1, 1, 1, 7])
                {
                    range.Style.Font.Bold = true;
                    range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    range.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(79, 129, 189));
                    range.Style.Font.Color.SetColor(Color.White);
                    range.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                }

                int row = 2;
                foreach (var role in roles)
                {
                    worksheet.Cells[row, 1].Value = role.RoleId;
                    worksheet.Cells[row, 2].Value = role.RoleName;
                    worksheet.Cells[row, 3].Value = role.RoleCode;
                    worksheet.Cells[row, 4].Value = role.Description ?? "N/A";
                    worksheet.Cells[row, 5].Value = role.IsSystemRole == true ? "Yes" : "No";
                    worksheet.Cells[row, 6].Value = role.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
                    worksheet.Cells[row, 7].Value = role.UpdatedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "N/A";
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

                EEPZBusinessLog.Information("Roles exported to Excel successfully");
                return package.GetAsByteArray();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error("Error exporting roles to Excel", ex);
                throw;
            }
        }

        public async Task<byte[]> ExportDepartmentsToExcelAsync()
        {
            try
            {
                var departments = await _departmentRepository.GetAllAsync();

                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                using var package = new ExcelPackage();
                var worksheet = package.Workbook.Worksheets.Add("Departments");

                worksheet.Cells[1, 1].Value = "Department ID";
                worksheet.Cells[1, 2].Value = "Department Name";
                worksheet.Cells[1, 3].Value = "Budget Allocated";
                worksheet.Cells[1, 4].Value = "Cost Center";
                worksheet.Cells[1, 5].Value = "Created At";
                worksheet.Cells[1, 6].Value = "Updated At";

                using (var range = worksheet.Cells[1, 1, 1, 6])
                {
                    range.Style.Font.Bold = true;
                    range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    range.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(79, 129, 189));
                    range.Style.Font.Color.SetColor(Color.White);
                    range.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                }

                int row = 2;
                foreach (var dept in departments)
                {
                    worksheet.Cells[row, 1].Value = dept.DepartmentId;
                    worksheet.Cells[row, 2].Value = dept.DepartmentName;
                    worksheet.Cells[row, 3].Value = dept.BudgetAllocated?.ToString("N2") ?? "N/A";
                    worksheet.Cells[row, 4].Value = dept.CostCenter ?? "N/A";
                    worksheet.Cells[row, 5].Value = dept.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
                    worksheet.Cells[row, 6].Value = dept.UpdatedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "N/A";
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

                EEPZBusinessLog.Information("Departments exported to Excel successfully");
                return package.GetAsByteArray();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error("Error exporting departments to Excel", ex);
                throw;
            }
        }

        public async Task<byte[]> ExportUsersToExcelAsync()
        {
            try
            {
                var users = await _userAuthRepository.GetAllAsync();

                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                using var package = new ExcelPackage();
                var worksheet = package.Workbook.Worksheets.Add("Users");

                worksheet.Cells[1, 1].Value = "User ID";
                worksheet.Cells[1, 2].Value = "Employee Company ID";
                worksheet.Cells[1, 3].Value = "Email";
                worksheet.Cells[1, 4].Value = "First Name";
                worksheet.Cells[1, 5].Value = "Last Name";
                worksheet.Cells[1, 6].Value = "Mobile Number";
                worksheet.Cells[1, 7].Value = "Gender";
                worksheet.Cells[1, 8].Value = "Employment Type";
                worksheet.Cells[1, 9].Value = "Employment Status";
                worksheet.Cells[1, 10].Value = "Employee Type";
                worksheet.Cells[1, 11].Value = "Joining Date";
                worksheet.Cells[1, 12].Value = "Work Location";
                worksheet.Cells[1, 13].Value = "Role Name";
                worksheet.Cells[1, 14].Value = "Department Name";
                worksheet.Cells[1, 15].Value = "Status";
                worksheet.Cells[1, 16].Value = "Is Active";
                worksheet.Cells[1, 17].Value = "Last Login";
                worksheet.Cells[1, 18].Value = "Created At";

                // Style Header
                using (var range = worksheet.Cells[1, 1, 1, 18])
                {
                    range.Style.Font.Bold = true;
                    range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    range.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(79, 129, 189));
                    range.Style.Font.Color.SetColor(Color.White);
                    range.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                }

                // Data Rows
                int row = 2;
                foreach (var user in users)
                {
                    var profile = user.Employee?.Userprofile;
                    var employeeDetails = user.Employee?.Employeedetailsmasters?.FirstOrDefault();

                    worksheet.Cells[row, 1].Value = user.UserId;
                    worksheet.Cells[row, 2].Value = user.Employee?.EmployeeCompanyId ?? "N/A";
                    worksheet.Cells[row, 3].Value = user.Email;
                    worksheet.Cells[row, 4].Value = profile?.FirstName ?? "N/A";
                    worksheet.Cells[row, 5].Value = profile?.LastName ?? "N/A";
                    worksheet.Cells[row, 6].Value = profile?.MobileNumber ?? "N/A";
                    worksheet.Cells[row, 7].Value = profile?.Gender ?? "N/A";
                    worksheet.Cells[row, 8].Value = user.Employee?.EmploymentType ?? "N/A";
                    worksheet.Cells[row, 9].Value = user.Employee?.EmploymentStatus ?? "N/A";
                    worksheet.Cells[row, 10].Value = user.Employee?.EmployeeType ?? "N/A";
                    worksheet.Cells[row, 11].Value = user.Employee?.JoiningDate.ToString("yyyy-MM-dd") ?? "N/A";
                    worksheet.Cells[row, 12].Value = user.Employee?.WorkLocation ?? "N/A";
                    worksheet.Cells[row, 13].Value = employeeDetails?.Role?.RoleName ?? "N/A";
                    worksheet.Cells[row, 14].Value = employeeDetails?.Department?.DepartmentName ?? "N/A";
                    worksheet.Cells[row, 15].Value = user.Status;
                    worksheet.Cells[row, 16].Value = user.Employee?.IsActive == true ? "Yes" : "No";
                    worksheet.Cells[row, 17].Value = user.LastLoginAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "Never";
                    worksheet.Cells[row, 18].Value = user.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
                    row++;
                }

                // Auto-fit columns
                worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

                // Add borders
                using (var range = worksheet.Cells[1, 1, row - 1, 18])
                {
                    range.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                    range.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                    range.Style.Border.Right.Style = ExcelBorderStyle.Thin;
                    range.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
                }

                EEPZBusinessLog.Information($"Users exported to Excel successfully - Total: {users.Count}");
                return package.GetAsByteArray();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error("Error exporting users to Excel", ex);
                throw;
            }
        }

        public async Task<byte[]> ExportAllDataToExcelAsync()
        {
            try
            {
                var roles = await _roleRepository.GetAllAsync();
                var departments = await _departmentRepository.GetAllAsync();
                var users = await _userAuthRepository.GetAllAsync();

                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                using var package = new ExcelPackage();

                // ===== ROLES SHEET =====
                var rolesSheet = package.Workbook.Worksheets.Add("Roles");
                
                // Header
                rolesSheet.Cells[1, 1].Value = "Role ID";
                rolesSheet.Cells[1, 2].Value = "Role Name";
                rolesSheet.Cells[1, 3].Value = "Role Code";
                rolesSheet.Cells[1, 4].Value = "Description";
                rolesSheet.Cells[1, 5].Value = "Is System Role";
                
                // Style Header
                using (var range = rolesSheet.Cells[1, 1, 1, 5])
                {
                    range.Style.Font.Bold = true;
                    range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    range.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(79, 129, 189));
                    range.Style.Font.Color.SetColor(Color.White);
                }

                // Data
                int roleRow = 2;
                foreach (var role in roles)
                {
                    rolesSheet.Cells[roleRow, 1].Value = role.RoleId;
                    rolesSheet.Cells[roleRow, 2].Value = role.RoleName;
                    rolesSheet.Cells[roleRow, 3].Value = role.RoleCode;
                    rolesSheet.Cells[roleRow, 4].Value = role.Description ?? "N/A";
                    rolesSheet.Cells[roleRow, 5].Value = role.IsSystemRole == true ? "Yes" : "No";
                    roleRow++;
                }
                rolesSheet.Cells[rolesSheet.Dimension.Address].AutoFitColumns();

                var deptSheet = package.Workbook.Worksheets.Add("Departments");
                
                // Header
                deptSheet.Cells[1, 1].Value = "Department ID";
                deptSheet.Cells[1, 2].Value = "Department Name";
                deptSheet.Cells[1, 3].Value = "Budget Allocated";
                deptSheet.Cells[1, 4].Value = "Cost Center";
                
                // Style Header
                using (var range = deptSheet.Cells[1, 1, 1, 4])
                {
                    range.Style.Font.Bold = true;
                    range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    range.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(79, 129, 189));
                    range.Style.Font.Color.SetColor(Color.White);
                }

                // Data
                int deptRow = 2;
                foreach (var dept in departments)
                {
                    deptSheet.Cells[deptRow, 1].Value = dept.DepartmentId;
                    deptSheet.Cells[deptRow, 2].Value = dept.DepartmentName;
                    deptSheet.Cells[deptRow, 3].Value = dept.BudgetAllocated?.ToString("N2") ?? "N/A";
                    deptSheet.Cells[deptRow, 4].Value = dept.CostCenter ?? "N/A";
                    deptRow++;
                }
                deptSheet.Cells[deptSheet.Dimension.Address].AutoFitColumns();

                // ===== USERS SHEET =====
                var usersSheet = package.Workbook.Worksheets.Add("Users");
                
                // Header
                usersSheet.Cells[1, 1].Value = "User ID";
                usersSheet.Cells[1, 2].Value = "Employee Company ID";
                usersSheet.Cells[1, 3].Value = "Email";
                usersSheet.Cells[1, 4].Value = "First Name";
                usersSheet.Cells[1, 5].Value = "Last Name";
                usersSheet.Cells[1, 6].Value = "Mobile";
                usersSheet.Cells[1, 7].Value = "Role";
                usersSheet.Cells[1, 8].Value = "Department";
                usersSheet.Cells[1, 9].Value = "Status";
                usersSheet.Cells[1, 10].Value = "Is Active";
                
                // Style Header
                using (var range = usersSheet.Cells[1, 1, 1, 10])
                {
                    range.Style.Font.Bold = true;
                    range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    range.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(79, 129, 189));
                    range.Style.Font.Color.SetColor(Color.White);
                }

                // Data
                int userRow = 2;
                foreach (var user in users)
                {
                    var profile = user.Employee?.Userprofile;
                    var employeeDetails = user.Employee?.Employeedetailsmasters?.FirstOrDefault();

                    usersSheet.Cells[userRow, 1].Value = user.UserId;
                    usersSheet.Cells[userRow, 2].Value = user.Employee?.EmployeeCompanyId ?? "N/A";
                    usersSheet.Cells[userRow, 3].Value = user.Email;
                    usersSheet.Cells[userRow, 4].Value = profile?.FirstName ?? "N/A";
                    usersSheet.Cells[userRow, 5].Value = profile?.LastName ?? "N/A";
                    usersSheet.Cells[userRow, 6].Value = profile?.MobileNumber ?? "N/A";
                    usersSheet.Cells[userRow, 7].Value = employeeDetails?.Role?.RoleName ?? "N/A";
                    usersSheet.Cells[userRow, 8].Value = employeeDetails?.Department?.DepartmentName ?? "N/A";
                    usersSheet.Cells[userRow, 9].Value = user.Status;
                    usersSheet.Cells[userRow, 10].Value = user.Employee?.IsActive == true ? "Yes" : "No";
                    userRow++;
                }
                usersSheet.Cells[usersSheet.Dimension.Address].AutoFitColumns();

                EEPZBusinessLog.Information("All data exported to Excel successfully");
                return package.GetAsByteArray();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error("Error exporting all data to Excel", ex);
                throw;
            }
        }
    }
}
