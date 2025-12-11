using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface ILnDService
    {
        // Employee Skills Management
        Task<ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>> GetSubordinateEmployees(
            int managerId,
            string? searchTerm,
            int pageNumber,
            int pageSize
        );

        Task<ApiResponse<List<SkillDto>>> GetAllSkills();

        Task<ApiResponse<PaginatedResponse<EmployeeSkillDto>>> GetSubordinateSkills(
            int managerId,
            int? employeeId,
            string? searchTerm,
            string? sortBy,
            int pageNumber,
            int pageSize
        );

        Task<ApiResponse<EmployeeSkillDto>> RecordEmployeeSkill(
            int managerId,
            RecordSkillRequest request
        );

        Task<ApiResponse<List<EmployeeSkillDto>>> BulkRecordEmployeeSkills(
            int managerId,
            BulkRecordSkillRequest request
        );

        Task<ApiResponse<EmployeeSkillDto>> UpdateEmployeeSkillRating(
            int managerId,
            UpdateSkillRatingRequest request
        );

        Task<ApiResponse<bool>> DeleteEmployeeSkill(int managerId, int mapperId);

        Task<ApiResponse<PaginatedResponse<EmployeeSkillDto>>> GetMySkills(
            int employeeId,
            string searchTerm,
            int pageNumber,
            int pageSize
        );

        // SME Management
        Task<ApiResponse<bool>> CheckIfEmployeeIsSme(int employeeId);

        Task<ApiResponse<int>> ApplyToBecomeSme(int employeeId, BecomeSmeRequest request);

        Task<ApiResponse<PaginatedResponse<SmeDto>>> GetAvailableSmes(
            int skillId,
            string searchTerm,
            int pageNumber,
            int pageSize
        );

        // Assignment Management
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
            string statusFilter,
            string searchTerm,
            string sortField,
            string sortOrder,
            int pageNumber,
            int pageSize
        );
        Task<ApiResponse<PaginatedResponse<AssignmentDto>>> GetSmeAssignments(
            int smeEmployeeId,
            string statusFilter,
            string searchTerm,
            string sortField,
            string sortOrder,
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

        // Approvals Management
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

        // Enhanced Approval History & File Downloads
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

        Task<ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>> GetAllOrganizationEmployees(
            string? searchTerm,
            int pageNumber,
            int pageSize
        );

        Task<ApiResponse<PaginatedResponse<AssignmentDto>>> GetAllOrganizationAssignments(
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );


        Task<ApiResponse<PaginatedResponse<SmeDto>>> GetAllActiveSmes(
            string? searchTerm,
            int pageNumber,
            int pageSize
        );
        Task<ApiResponse<byte[]>> ExportAllActiveSmesToExcel(string? searchTerm);


        Task<ApiResponse<PaginatedResponse<EmployeeSkillDto>>> GetEmployeeSkillsById(
            int employeeId,
            int pageNumber,
            string? searchTerm,
            string? sortBy
        );

        Task<ApiResponse<byte[]>> ExportOrganizationAssignmentsToExcel(
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder
        );
        Task<ApiResponse<byte[]>> ExportTeamAssignmentsToExcel(
            int managerId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder
        );

        Task<ApiResponse<FileDownloadDto>> PreviewApprovalAttachment(int employeeId, int approvalId);
        Task<ApiResponse<FileDownloadDto>> PreviewAssignmentProof(int employeeId, int assignmentId);
        Task<ApiResponse<int>> CheckAndMarkOverdueAssignments(); 

    }
    public interface IFileStorageService
    {
        Task<string> SaveFileAsync(IFormFile file, string subFolder);
        Task<bool> DeleteFileAsync(string filePath);
        Task<byte[]> GetFileAsync(string filePath);
        string GetFileUrl(string filePath);

        Task<(byte[] fileBytes, string contentType, string fileName)> GetFileForPreviewAsync(string filePath); 

    } 
}
