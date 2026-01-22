using Relevantz.EEPZ.Common.DTOs;

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
    }
}
