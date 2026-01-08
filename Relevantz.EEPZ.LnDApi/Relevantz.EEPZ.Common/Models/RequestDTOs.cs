 
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Constants;
namespace Relevantz.EEPZ.Common.DTOs
{
    // Approval requests
    public class ApprovalDecisionRequest
    {
        public int ApprovalId { get; set; }
        public bool IsApproved { get; set; }
        public string? Notes { get; set; }
    }
 
    // Assignment requests
    public class UploadCompletionProofRequest
    {
        public int AssignmentId { get; set; }
        public IFormFile ProofDocument { get; set; }
        public string? CompletionNotes { get; set; }
    }
 
    public class CompleteAssignmentRequest
    {
        public int AssignmentId { get; set; }
        public int NewRating { get; set; }
        public string? Notes { get; set; }
    }
 
    // Employee skill requests
    public class RecordSkillRequest
    {
        public int EmployeeId { get; set; }
        public int SkillId { get; set; }
        public int Rating { get; set; }
    }
 
    public class BulkRecordSkillRequest
    {
        public int EmployeeId { get; set; }
        public List<SkillRating> Skills { get; set; }
    }
 
    public class SkillRating
    {
        public int SkillId { get; set; }
        public int Rating { get; set; }
    }
 
    public class UpdateSkillRatingRequest
    {
        public int MapperId { get; set; }
        public int Rating { get; set; }
    }
 
    // SME requests
    public class BecomeSmeRequest
    {
        public int SkillId { get; set; }
        public IFormFile ProofDocument { get; set; }
    }
 
    public class SmeRequestDto
    {
        public int SkillId { get; set; }
        public int MentorEmployeeId { get; set; }
        public int MenteeEmployeeId { get; set; }
        public DateTime? Deadline { get; set; }
    }
 
    public class MyApprovalsRequestModel
    {
        public string? ApprovalType { get; set; }
        public string? Status { get; set; }
        public string? SortField { get; set; }
        public string? SortOrder { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
    }
 
 
 
    public class ApprovalHistoryRequestModel
    {
        public string? ApprovalType { get; set; }
        public string? Status { get; set; }
        public string? Role { get; set; }
        public string? SearchTerm { get; set; }
        public string? SortField { get; set; }
        public string? SortOrder { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
 
    /// <summary>
    /// Request model for fetching assignments with filtering and pagination
    /// </summary>
    public class AssignmentRequestModel
    {
        public string? StatusFilter { get; set; }
        public string? SearchTerm { get; set; }
        public string? SortField { get; set; }
        public string? SortOrder { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
 
    /// <summary>
    /// Request model for exporting assignments
    /// </summary>
    public class ExportAssignmentRequestModel
    {
        public string? StatusFilter { get; set; }
        public string? SearchTerm { get; set; }
        public string? SortField { get; set; }
        public string? SortOrder { get; set; }
    }
 
    /// <summary>
    /// Request model for organization assignments with filtering and pagination
    /// </summary>
    public class OrganizationAssignmentsRequestModel
    {
        public string? StatusFilter { get; set; }
        public string? SearchTerm { get; set; }
        public string? SortField { get; set; }
        public string? SortOrder { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
 
    /// <summary>
    /// Request model for exporting organization assignments
    /// </summary>
    public class ExportOrganizationAssignmentsRequestModel
    {
        public string? StatusFilter { get; set; }
        public string? SearchTerm { get; set; }
        public string? SortField { get; set; }
        public string? SortOrder { get; set; }
    }
 
    /// <summary>
    /// Request model for organization employees with pagination
    /// </summary>
    public class OrganizationEmployeesRequestModel
    {
        public string? SearchTerm { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 9;
    }
 
    /// <summary>
    /// Request model for employee skills by ID
    /// </summary>
    public class EmployeeSkillsByIdRequestModel
    {
        public int PageNumber { get; set; } = 1;
        public string? SearchTerm { get; set; }
        public string? SortBy { get; set; } = "skillname";
    }
 
    /// <summary>
    /// Request model for all active SMEs with pagination
    /// </summary>
    public class ActiveSmesRequestModel
    {
        public string? SearchTerm { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
 
    /// <summary>
    /// Request model for exporting active SMEs
    /// </summary>
    public class ExportActiveSmesRequestModel
    {
        public string? SearchTerm { get; set; }
    }
 
    /// <summary>
    /// Request model for fetching my skills with pagination
    /// </summary>
    /// <summary>
    /// Request model for fetching my skills with pagination
    /// </summary>
    public class MySkillsRequestModel
    {
        public string? SearchTerm { get; set; }
        public string? SortField { get; set; }
        public string? SortOrder { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
 
    /// <summary>
    /// Request model for fetching subordinate skills
    /// </summary>
    public class SubordinateSkillsRequestModel
    {
        public int? EmployeeId { get; set; }
        public string? SearchTerm { get; set; }
        public string? SortBy { get; set; } = LnDConstants.DEFAULTS.SORT_BY_EMPLOYEE_NAME;
        public int PageNumber { get; set; } = 1;
    }
 
    /// <summary>
    /// Request model for fetching subordinate employees
    /// </summary>
    public class SubordinateEmployeesRequestModel
    {
        public string? SearchTerm { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 12;
    }
 
}
 
 
 
 
 
 
 
 
 
 