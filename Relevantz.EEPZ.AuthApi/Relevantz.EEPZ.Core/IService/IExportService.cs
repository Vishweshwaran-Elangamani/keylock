namespace Relevantz.EEPZ.Core.IService
{
    public interface IExportService
    {
        Task<byte[]> ExportRolesToExcelAsync();
        Task<byte[]> ExportDepartmentsToExcelAsync();
        Task<byte[]> ExportUsersToExcelAsync();
        Task<byte[]> ExportAllDataToExcelAsync();
        string GetLastExportPassword();
    }
}
