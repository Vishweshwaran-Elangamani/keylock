namespace Relevantz.EEPZ.Business.Services.Interfaces
{
    public interface IDepartmentHeadNominationService
    {
        Task<object> GetApprovedNominationsByDeptHeadAsync(int deptHeadEmployeeId);
        Task<object> GetNominationDetailsAsync(int nominationId);
        Task<object> GetDepartmentStatisticsAsync(int deptHeadEmployeeId);
    }
}
