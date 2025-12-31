using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IDeptHeadApprovalsRepository
    {
        Task<Selfassessment> GetAssessmentByIdAsync(int assessmentId);
        Task<Departmentheadapproval> GetExistingApprovalAsync(int assessmentId, int employeeId);
        Task<int> CreateApprovalAsync(ApprovalRequestDto request, int deptHeadUserId);
        Task<List<Userprofile>> GetAllUserProfilesAsync();
        Task<List<Userauthentication>> GetAllUserAuthenticationsAsync();
        Task<List<Project>> GetAllProjectsAsync();
        Task<List<Projectemployee>> GetAllProjectEmployeesAsync();
        Task<int> GetDepartmentIdByEmployeeIdAsync(int employeeId);
        Task<List<int>> GetEmployeeIdsByDepartmentAsync(int departmentId);
        Task<List<Selfassessment>> GetSubmittedSelfAssessmentsAsync();
        Task<List<Assessmentreview>> GetAllAssessmentReviewsAsync();
        Task<List<Goal>> GetGoalsByEmployeeIdsAsync(List<int> employeeIds);
        Task<Departmentheadapproval> GetDeptHeadApprovalAsync(int employeeId, int projectId, int assessmentId);
        Task<List<int>> GetGoalIdsByEmployeeIdAsync(int employeeId);
        Task<Employeedetailsmaster> GetEmployeeDetailsByEmployeeIdAsync(int employeeId);
        Task<(List<Departmentheadapproval> approvals, int totalRecords)> GetApprovedEmployeesAsync(int page, int pageSize, int? deptHeadEmployeeId);
        Task<Projectemployee> GetProjectEmployeeByEmployeeIdAsync(int employeeId);
        Task<Employeedetailsmaster> GetEmployeeDetailsByMasterIdAsync(int masterId);
        Task<Userprofile> GetUserProfileByEmployeeIdAsync(int employeeId);
        Task<Project> GetProjectByIdAsync(int projectId);
        Task<List<Departmentheadapproval>> GetPendingApprovalsForEmployeeAsync(int employeeId, int userId);
        Task<Selfassessment> GetAssessmentWithDetailsAsync(int assessmentId);
        Task<List<Assessmentreview>> GetReviewsByDetailIdsAsync(List<int> detailIds);
        Task<Userauthentication> GetUserAuthByEmployeeIdAsync(int employeeId);
        Task<Departmentheadapproval> GetApprovalForAcknowledgmentAsync(int approvalId, int employeeId, int userId);
        Task<DateTime?> AcknowledgeApprovalAsync(Departmentheadapproval approval, string comments);
        Task<List<object>> GetAcknowledgedCommentsByManagerAsync(int managerId);
        Task<List<object>> GetAssessmentAttachmentsAsync(int assessmentId);
        Task<Selfassessmentattachment> GetAttachmentByIdAsync(int attachmentId);
        Task<Userauthentication> GetUserAuthByUserIdAsync(int userId);
        Task<Departmentheadapproval> GetApprovalByIdAsync(int approvalId);

    }
}
