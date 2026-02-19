using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface ISlaService
    {
        Task<List<SlaResponse>> GetEmployeeSlas(int employeeId);
        Task<List<TeamReviewTrackingResponse>> GetTeamReviewTracking(int managerId);
        Task<DepartmentComplianceResponse> GetDepartmentCompliance(int departmentId, string? period);
        Task<ReopenSlaResponse> ReopenSla(int slaId, int extensionDays, string reason, int userId);

        Task<EscalationResponse> SubmitEscalation(SubmitSlaEscalationRequest request,int userId,string? level);

        Task<List<SlaHistoryResponse>> GetSlaHistory(int slaid);
        Task<List<DepartmentComplianceResponse>> GetAllDepartmentCompliance(string? period);
        Task<DepartmentComplianceResponse> CalculateCompliance(CalculateComplianceRequest request);
        Task<List<SlaResponse>> GetAllSlas();
        Task<CreateSlaResponse> CreateSla(CreateSlaRequest request, int userId);
        Task<SlaResponse?> GetSlaById(int slaid);
        Task CloseSla(int slaId, int userId);
        Task UpdateSla(int slaid, UpdateSlaRequest request, int userId);
        Task<BulkCreateSlaResponse> BulkCreateSla(List<CreateSlaRequest> requests, int userId);
        
        Task<bool> DeleteSla(int slaId);


        Task<EscalationResponse> EscalateToDeptHead(SubmitSlaEscalationRequest request, int userId);  
        Task<List<EscalationResponse>> GetSlaEscalations(int slaId);
        Task<string> ResolveEscalation(ResolveEscalationRequest request, int userId);
        Task<List<EscalationResponse>> GetManagerEscalations(int managerId);

    }
}
