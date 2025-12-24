using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IAssignmentsService
    {
        // Initiate appraisal
        Task<object> InitiateAppraisalAsync(InitiateAppraisalRequestDto request);

        // Get eligible employees for upcoming month
        Task<object> GetUpcomingEligibleEmployeesAsync(int? formId = null);

        // Get available employees for a specific form
        Task<object> GetAvailableEmployeesForFormAsync(int formId);

        // Get assignments by employee
        Task<object> GetAssignmentsByEmployeeIdAsync(int employeeId);

        // Get all assignments
        Task<object> GetAllAssignmentsAsync();

        // Get draft assignments
        Task<object> GetDraftAssignmentsAsync();

        // Update draft assignment
        Task<object> UpdateDraftAsync(int assignmentId, UpdateDraftRequestDto request);

        // Get assignments by form
        Task<object> GetAssignmentsByFormIdAsync(int formId);

        // Delete assignment
        Task<object> DeleteAssignmentAsync(int assignmentId);

        // Get assignment details
        Task<object> GetAssignmentDetailsAsync(int assignmentId);
    }
}
