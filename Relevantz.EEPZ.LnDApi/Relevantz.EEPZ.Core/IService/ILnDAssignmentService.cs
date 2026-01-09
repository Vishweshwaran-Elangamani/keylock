using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface ILnDAssignmentService
    {
        Task<ApiResponse<int>> CheckAndMarkOverdueAssignments();
        Task<ApiResponse<int>> RequestSmeAssignment(int managerId, SmeRequestModel request);
        Task<ApiResponse<PaginatedResponse<AssignmentResponseModel>>> GetMyAssignments(
            int employeeId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );
        Task<ApiResponse<PaginatedResponse<AssignmentResponseModel>>> GetTeamAssignments(
            int managerId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );
        Task<ApiResponse<PaginatedResponse<AssignmentResponseModel>>> GetSmeAssignments(
            int smeEmployeeId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );
        Task<ApiResponse<bool>> UploadCompletionProof(
            int employeeId,
            UploadCompletionProofRequestModel request
        );
        Task<ApiResponse<bool>> CompleteAssignment(
            int managerId,
            CompleteAssignmentRequestModel request
        );
        Task<ApiResponse<byte[]>> ExportTeamAssignmentsToExcel(
            int managerId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder
        );
    }
}
