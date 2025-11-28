using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repositories.Interface
{
    public interface ILnDRepository
    {
        #region Employee Management
        Task<Employee?> GetEmployeeByIdAsync(int employeeId);
        Task<(List<Employee> Items, int TotalCount)> GetSubordinateEmployeesAsync(
            int managerId,
            string? searchTerm,
            int pageNumber,
            int pageSize
        );
        Task<Lndsme?> GetSmeFromEmployeeId(Dictionary<string, object> assignmentDetails);
        #endregion

        #region Skills Management
        Task<List<MasterSkill>> GetAllSkillsAsync();
        Task<MasterSkill?> GetSkillByIdAsync(int skillId);
        Task<(List<Lndemployeeskillmapper> Items, int TotalCount)> GetSubordinateSkillsAsync(
            int managerId,
            int? employeeId,
            string? searchTerm,
            string? sortBy,
            int pageNumber,
            int pageSize
        );
        Task<Lndemployeeskillmapper?> GetEmployeeSkillMappingAsync(int employeeId, int skillId);
        Task<Lndemployeeskillmapper?> GetEmployeeSkillMappingByIdAsync(int mapperId);
        Task<Lndemployeeskillmapper> AddEmployeeSkillAsync(Lndemployeeskillmapper mapper);
        Task<List<Lndemployeeskillmapper>> AddEmployeeSkillsAsync(
            List<Lndemployeeskillmapper> mappers
        );
        Task UpdateEmployeeSkillAsync(Lndemployeeskillmapper mapper);
        Task DeleteEmployeeSkillAsync(Lndemployeeskillmapper mapper);
        Task<(List<Lndemployeeskillmapper> Items, int TotalCount)> GetMySkillsAsync(
            int employeeId,
            string? searchTerm,
            int pageNumber,
            int pageSize
        );
        Task<List<int>> GetExistingSkillMappingsAsync(int employeeId, List<int> skillIds);
        #endregion

        #region SME Management
        Task<bool> IsEmployeeSmeAsync(int employeeId);
        Task<Lndsme?> GetActiveSmeAsync(int employeeId, int skillId);
        Task<Lndsme> AddSmeAsync(Lndsme sme);
        Task UpdateSmeAsync(Lndsme sme);
        Task<(List<Lndsme> Items, int TotalCount)> GetAvailableSmesWithAssignmentCountsAsync(
            int skillId,
            string? searchTerm,
            int pageNumber,
            int pageSize,
            int maxAssignments
        );
        #endregion

        #region Assignment Management
        Task<Lndassignment?> GetAssignmentByIdAsync(int assignmentId);
        Task<Lndassignment> AddAssignmentAsync(Lndassignment assignment);
        Task UpdateAssignmentAsync(Lndassignment assignment);
        Task<(List<Lndassignment> Items, int TotalCount)> GetMyAssignmentsAsync(
            int employeeId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );
        Task<(List<Lndassignment> Items, int TotalCount)> GetTeamAssignmentsAsync(
            int managerId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );
        Task<(List<Lndassignment> Items, int TotalCount)> GetSmeAssignmentsAsync(
            int smeEmployeeId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );
        Task<int> GetSmeInProgressAssignmentCountAsync(int smeId);
        #endregion

        #region Approval Management
        Task<Lndapproval?> GetApprovalByIdAsync(int approvalId);
        Task<Lndapproval?> GetPendingSmeRegistrationAsync(int employeeId, int skillId);
        Task<Lndapproval> AddApprovalAsync(Lndapproval approval);
        Task UpdateApprovalAsync(Lndapproval approval);
        Task<(List<Lndapproval> Items, int TotalCount)> GetMyApprovalsAsync(
            int employeeId,
            string? approvalType,
            string? status,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );
        Task<(List<Lndapproval> Items, int TotalCount)> GetApprovalHistoryAsync(
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
        Task<Lndapproval?> GetPendingAssignmentApprovalAsync(int assignmentId, string approvalType);
        #endregion

        #region Attachment Management
        Task<Lndattachment> AddAttachmentAsync(Lndattachment attachment);
        Task<Lndattachment?> GetAttachmentByIdAsync(int attachmentId);
        #endregion

        #region HR Management
        Task<List<Lndassignment>> GetAllOrganizationAssignmentsForExportAsync(
    string? statusFilter,
    string? searchTerm,
    string? sortField,
    string? sortOrder
);
        Task<(List<Employee> Items, int TotalCount)> GetAllOrganizationEmployeesAsync(
            string? searchTerm,
            int pageNumber,
            int pageSize
        );

        Task<(List<Lndassignment> Items, int TotalCount)> GetAllOrganizationAssignmentsAsync(
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );

        Task<(List<Lndsme> Items, int TotalCount)> GetAllActiveSmesAsync(
            string? searchTerm,
            int pageNumber,
            int pageSize
        );
        Task<List<Lndsme>> GetAllActiveSmesForExportAsync(string? searchTerm);


        Task<(List<Lndemployeeskillmapper> Items, int TotalCount)> GetEmployeeSkillsByIdAsync(
            int employeeId,
            string? searchTerm,
            string? sortBy,
            int pageNumber,
            int pageSize
        ); 

        Task<List<Lndassignment>> GetAllTeamAssignmentsForExportAsync(
    int managerId,
    string? statusFilter,
    string? searchTerm,
    string? sortField,
    string? sortOrder
);



        #endregion


        #region Unit of Work
        Task<int> SaveChangesAsync();
        #endregion
    }
}
