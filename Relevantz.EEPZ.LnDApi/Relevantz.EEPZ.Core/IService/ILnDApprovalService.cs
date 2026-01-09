using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface ILnDApprovalService
    {
        Task<ApiResponse<PaginatedResponse<ApprovalResponseModel>>> GetMyApprovals(
            int employeeId,
            string? approvalType,
            string? status,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize,
            string? searchTerm
        );
        Task<ApiResponse<bool>> ProcessApproval(int approverId, ApprovalDecisionRequestModel request);
        Task<ApiResponse<PaginatedResponse<ApprovalResponseModel>>> GetApprovalHistory(
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
        Task<ApiResponse<ApprovalDetailsResponseModel>> GetApprovalDetails(int employeeId, int approvalId);
        Task<ApiResponse<FileDownloadResponseModel>> GetApprovalAttachment(int employeeId, int approvalId);
        Task<ApiResponse<FileDownloadResponseModel>> GetAssignmentProof(int employeeId, int assignmentId);
        Task<ApiResponse<FileDownloadResponseModel>> PreviewApprovalAttachment(
            int employeeId,
            int approvalId
        );
        Task<ApiResponse<FileDownloadResponseModel>> PreviewAssignmentProof(int employeeId, int assignmentId);
    }
}
