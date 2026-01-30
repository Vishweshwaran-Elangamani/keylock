using System.Text.Json.Serialization;
namespace Relevantz.EEPZ.Common.Models
{
    /// <summary>
    /// Represents a paginated response containing items and pagination metadata.
    /// </summary>
    public class PaginatedResponse<T>
    {
        public List<T> Items { get; set; }
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
        public bool HasPreviousPage => PageNumber > 1;
        public bool HasNextPage => PageNumber < TotalPages;
    }

    /// <summary>
    /// Represents a standard API response wrapper with success status, message, data, and errors.
    /// </summary>
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
        public List<string> Errors { get; set; }
    }

    /// <summary>
    /// Detailed response model for an approval request, including requester, approver, status, and attachments.
    /// </summary>
    public class ApprovalDetailsResponseModel
    {
        public int ApprovalId { get; set; }
        public string ApprovalType { get; set; }
        public int? AssignmentId { get; set; }
        public int? SkillId { get; set; }
        public string SkillName { get; set; }
        public int RequesterEmployeeId { get; set; }
        public string RequesterName { get; set; }
        public string RequesterEmail { get; set; }
        public int? ApproverEmployeeId { get; set; }
        public string ApproverName { get; set; }
        public string ApproverEmail { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
        public DateOnly? RequestedOn { get; set; }
        public DateOnly? UpdatedOn { get; set; }
        public int? AttachmentId { get; set; }
        public string AttachmentFileName { get; set; }
        public string AttachmentFilePath { get; set; }
        public long? AttachmentFileSize { get; set; }
        public string AttachmentType { get; set; }
        public AssignmentDetailsResponseModel Assignment { get; set; }
        public string UserRole { get; set; }
        public bool CanDownloadAttachment { get; set; }
    }

    /// <summary>
    /// Simplified response model for approval requests with basic details.
    /// </summary>
    public class ApprovalResponseModel
    {
        public int ApprovalId { get; set; }
        public string ApprovalType { get; set; }
        public int? AssignmentId { get; set; }
        public int? SkillId { get; set; }
        public string SkillName { get; set; }
        public int RequesterEmployeeId { get; set; }
        public string RequesterName { get; set; }
        public int? ApproverEmployeeId { get; set; }
        public string ApproverName { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
        public DateOnly? RequestedOn { get; set; }
        public DateOnly? UpdatedOn { get; set; }
        public string AttachmentPath { get; set; }
        public string OldAttachmentPath { get; set; }
    }

    /// <summary>
    /// Represents detailed information about an assignment, including mentee, SME, and completion details.
    /// </summary>
    public class AssignmentDetailsResponseModel
    {
        public int AssignmentId { get; set; }
        public string MenteeName { get; set; }
        public string SmeName { get; set; }
        public string SkillName { get; set; }
        public DateTime? Deadline { get; set; }
        public string Status { get; set; }
        public string ProofFilePath { get; set; }
        public string CompletionNotes { get; set; }
        public int? CompletionRating { get; set; }
    }

    /// <summary>
    /// Represents assignment information with metadata such as deadlines, status, and overdue tracking.
    /// </summary>


    public class AssignmentResponseModel
    {
        public int AssignmentId { get; set; }
        public int MenteeEmployeeId { get; set; }
        public string MenteeName { get; set; }
        public int SmeId { get; set; }
        public int SmeEmployeeId { get; set; }
        public string SmeName { get; set; }
        public int SkillId { get; set; }
        public string SkillName { get; set; }
        public DateTime? Deadline { get; set; }
        public string Status { get; set; }
        public string ProofFilePath { get; set; }
        public string CompletionNotes { get; set; }
        public int? CompletionRating { get; set; }
        public DateOnly? CreatedOn { get; set; }

        // Hide UpdatedOn from JSON serialization
        [JsonIgnore(Condition = JsonIgnoreCondition.Always)]
        public DateOnly? UpdatedOn { get; set; }

        public bool IsOverdue { get; set; }
        public int? DaysOverdue { get; set; }
    }


    /// <summary>
    /// Represents an employee’s skill mapping, rating, and SME eligibility.
    /// </summary>
    public class EmployeeSkillResponseModel
    {
        public int MapperId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public int SkillId { get; set; }
        public string SkillName { get; set; }
        public int Rating { get; set; }
        public DateOnly? CreatedOn { get; set; }
        public DateOnly? UpdatedOn { get; set; }
        public bool CanBecomeSme { get; set; }
        public bool IsSme { get; set; }
    }

    /// <summary>
    /// Represents basic information about a subordinate employee.
    /// </summary>
    public class SubordinateEmployeeResponseModel
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public string Email { get; set; }
        public string DepartmentName { get; set; }
    }

    /// <summary>
    /// Represents a skill entity with its identifier and name.
    /// </summary>
    public class SkillResponseModel
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; }
    }

    /// <summary>
    /// Represents SME (Subject Matter Expert) details including skill, assignments, and approval status.
    /// </summary>
    public class SmeResponseModel
    {
        public int SmeId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public int SkillId { get; set; }
        public string SkillName { get; set; }
        public int InProgressAssignments { get; set; }
        public bool IsActive { get; set; }
        public string? DepartmentName { get; set; }
        public DateOnly? ApprovedDate { get; set; }
        public DateOnly? ApprovedOn { get; set; }
    }

    /// <summary>
    /// Represents a file download response with file content and metadata.
    /// </summary>
    public class FileDownloadResponseModel
    {
        public byte[] FileBytes { get; set; }
        public string FileName { get; set; }
        public string ContentType { get; set; }
        public long FileSize { get; set; }
    }
}
