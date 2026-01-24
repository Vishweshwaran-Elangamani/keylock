using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface ILnDApprovalService
    {
        Task<ApiResponse<PaginatedResponse<ApprovalResponseModel>>> GetMyApprovals(
            int employeeId,
            MyApprovalsRequestModel request
        );
        Task<ApiResponse<bool>> ProcessApproval(
            int approverId,
            ApprovalDecisionRequestModel request
        );
        Task<ApiResponse<PaginatedResponse<ApprovalResponseModel>>> GetApprovalHistory(
            int employeeId,
            ApprovalHistoryRequestModel request
        );
        Task<ApiResponse<ApprovalDetailsResponseModel>> GetApprovalDetails(
            int employeeId,
            int approvalId
        );
        Task<ApiResponse<FileDownloadResponseModel>> GetApprovalAttachment(
            int employeeId,
            int approvalId
        );
        Task<ApiResponse<FileDownloadResponseModel>> GetAssignmentProof(
            int employeeId,
            int assignmentId
        );
        Task<ApiResponse<FileDownloadResponseModel>> GetApprovalAttachmentPreview(
            int employeeId,
            int approvalId
        );
        Task<ApiResponse<FileDownloadResponseModel>> GetAssignmentProofPreview(
            int employeeId,
            int assignmentId
        );
    }
}
