using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IDeptHeadApprovalsService
    {
        Task<ApiResponse<int>> ApproveDeptHeadEmployeeAsync(ApprovalRequestDto request, int deptHeadUserId);
        Task<ApiResponse<List<object>>> GetDeptHeadSubmittedRatingsAsync(int? deptHeadEmployeeId);
        Task<(bool success, List<object> data, int totalRecords, int totalPages, List<string> errors)> GetManagerApprovedEmployeesAsync(int page, int pageSize, int? deptHeadEmployeeId);
        Task<ApiResponse<List<object>>> GetPendingAcknowledgmentsAsync(int employeeId, int userId);
        Task<ApiResponse<DateTime?>> AcknowledgeRatingAsync(AcknowledgeRequestDto request, int employeeId, int userId);
        Task<ApiResponse<List<object>>> GetEmployeeAcknowledgedCommentsAsync(int managerId);
        Task<ApiResponse<List<object>>> GetDeptHeadAssessmentAttachmentsAsync(int assessmentId);
        Task<(bool success, byte[] fileBytes, string contentType, string fileName, List<string> errors)> DownloadDeptHeadAttachmentAsync(int attachmentId);
        Task<int?> GetEmployeeIdFromUserIdAsync(int userId);
        Task<ApiResponse<DeptHeadPerformanceDTO>> GetApprovedEmployeeDetailsAsync(int approvalId);

    }
}
