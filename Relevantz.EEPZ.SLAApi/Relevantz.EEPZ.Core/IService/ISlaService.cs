using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface ISlaService
    {
        Task<ApiResponse<List<SlaResponse>>> GetEmployeeSlas(int employeeId);
        Task<ApiResponse<EscalationResponse>> SubmitEscalation(SubmitSlaEscalationRequest request);
        Task<ApiResponse<List<TeamReviewTrackingResponse>>> GetTeamReviewTracking(int managerId);
        Task<ApiResponse<DepartmentComplianceResponse>> GetDepartmentCompliance(int departmentId, string? period = null);
        Task<ApiResponse<ReopenSlaResponse>> ReopenSla(ReopenSlaRequest request);
        Task<ApiResponse<EscalationResponse>> EscalateToDeptHead(SubmitSlaEscalationRequest request);
        Task<ApiResponse<List<SlaHistoryResponse>>> GetSlaHistory(int slaid);
        Task<ApiResponse<List<DepartmentComplianceResponse>>> GetAllDepartmentCompliance(string? period = null);
        Task<ApiResponse<DepartmentComplianceResponse>> CalculateCompliance(CalculateComplianceRequest request);
        Task<ApiResponse<List<SlaResponse>>> GetAllSlas();
        Task<ApiResponse<CreateSlaResponse>> CreateSla(CreateSlaRequest request);
        Task<ApiResponse<SlaResponse>> GetSlaById(int slaid);
        Task<ApiResponse<List<EscalationResponse>>> GetSlaEscalations(int slaid);
        Task<ApiResponse<string>> CloseSla(CloseSlaRequest request);
        Task<ApiResponse<string>> ResolveEscalation(ResolveEscalationRequest request);
        Task<ApiResponse<List<EscalationResponse>>> GetManagerEscalations(int managerId);
        Task<ApiResponse<SlaResponse>> UpdateSla(int slaid, UpdateSlaRequest request);
        Task<ApiResponse<string>> DeleteSla(int slaid);


        Task<ApiResponse<BulkCreateSlaResponse>> BulkCreateSla(List<CreateSlaRequest> requests);
    }
}
