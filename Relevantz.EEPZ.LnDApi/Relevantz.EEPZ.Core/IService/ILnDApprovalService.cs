using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface ILnDApprovalService
    {
        Task<ApiResponse<PaginatedResponse<ApprovalDto>>> GetMyApprovals(
            int employeeId,
            string? approvalType,
            string? status,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize,
            string? searchTerm
        );
        Task<ApiResponse<bool>> ProcessApproval(int approverId, ApprovalDecisionRequest request);
        Task<ApiResponse<PaginatedResponse<ApprovalDto>>> GetApprovalHistory(
            int employeeId,
            string? approvalType,
            string? status,
            string? role,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );
        Task<ApiResponse<ApprovalDetailsDto>> GetApprovalDetails(int employeeId, int approvalId);
        Task<ApiResponse<FileDownloadDto>> GetApprovalAttachment(int employeeId, int approvalId);
        Task<ApiResponse<FileDownloadDto>> GetAssignmentProof(int employeeId, int assignmentId);
        Task<ApiResponse<FileDownloadDto>> PreviewApprovalAttachment(
            int employeeId,
            int approvalId
        );
        Task<ApiResponse<FileDownloadDto>> PreviewAssignmentProof(int employeeId, int assignmentId);
    }
}
