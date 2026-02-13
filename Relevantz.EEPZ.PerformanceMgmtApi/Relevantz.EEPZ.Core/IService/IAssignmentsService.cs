using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IAssignmentsService
    {
        Task<object> InitiateAppraisalAsync(InitiateAppraisalRequestDto request);

        Task<object> GetUpcomingEligibleEmployeesAsync(int? formId = null);

        Task<object> GetAvailableEmployeesForFormAsync(int formId);

        Task<object> GetAssignmentsByEmployeeIdAsync(int employeeId);

        Task<object> GetAllAssignmentsAsync();

        Task<object> GetAssignmentsByFormIdAsync(int formId);

        Task<object> DeleteAssignmentAsync(int assignmentId);

        Task<object> GetAssignmentDetailsAsync(int assignmentId);
    }
}
