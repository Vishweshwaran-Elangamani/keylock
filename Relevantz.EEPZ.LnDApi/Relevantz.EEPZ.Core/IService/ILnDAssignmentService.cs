using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface ILnDAssignmentService
    {
        Task<ApiResponse<int>> CheckAndMarkOverdueAssignments();
        Task<ApiResponse<int>> RequestSmeAssignment(int managerId, SmeRequestModel request);
        Task<ApiResponse<PaginatedResponse<AssignmentResponseModel>>> GetMyAssignments(
            int employeeId,
            AssignmentRequestModel request
        );
        Task<ApiResponse<PaginatedResponse<AssignmentResponseModel>>> GetTeamAssignments(
            int managerId,
            AssignmentRequestModel request
        );
        Task<ApiResponse<PaginatedResponse<AssignmentResponseModel>>> GetSmeAssignments(
            int smeEmployeeId,
            AssignmentRequestModel request
        );
        Task<ApiResponse<bool>> UploadCompletionProof(
            int employeeId,
            UploadCompletionProofRequestModel request
        );
        Task<ApiResponse<bool>> CompleteAssignment(
            int managerId,
            CompleteAssignmentRequestModel request
        );
        Task<ApiResponse<byte[]>> GetTeamAssignmentsForExport(
            int managerId,
            ExportAssignmentRequestModel request
        );
        Task<ApiResponse<int>> RequestAssignmentReopen(int employeeId, ReopenAssignmentRequestModel request);
        Task<ApiResponse<bool>> ProcessReopenRequest(int managerId, ProcessReopenRequestModel request);
        Task<ApiResponse<PaginatedResponse<ReopenRequestResponseModel>>> GetMyReopenRequests(
            int employeeId,
            MyApprovalsRequestModel request);
        Task<ApiResponse<PaginatedResponse<ReopenRequestResponseModel>>> GetTeamReopenRequests(
            int managerId,
            MyApprovalsRequestModel request);

    }
}
