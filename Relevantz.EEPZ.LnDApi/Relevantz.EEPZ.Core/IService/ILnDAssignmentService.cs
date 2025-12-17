using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface ILnDAssignmentService
    {
        Task<ApiResponse<int>> CheckAndMarkOverdueAssignments();
        Task<ApiResponse<int>> RequestSmeAssignment(int managerId, SmeRequestDto request);
        Task<ApiResponse<PaginatedResponse<AssignmentDto>>> GetMyAssignments(
            int employeeId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );
        Task<ApiResponse<PaginatedResponse<AssignmentDto>>> GetTeamAssignments(
            int managerId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );
        Task<ApiResponse<PaginatedResponse<AssignmentDto>>> GetSmeAssignments(
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
            UploadCompletionProofRequest request
        );
        Task<ApiResponse<bool>> CompleteAssignment(
            int managerId,
            CompleteAssignmentRequest request
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
