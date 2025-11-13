namespace Relevantz.EEPZ.Common.DTOs
{
    // Common responses
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

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
        public List<string> Errors { get; set; }
    }

    // Approval responses
    public class ApprovalDetailsDto
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
        public AssignmentDetailsDto Assignment { get; set; }
        public string UserRole { get; set; }
        public bool CanDownloadAttachment { get; set; }
    }

    public class ApprovalDto
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

    // Assignment responses
    public class AssignmentDetailsDto
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

    public class AssignmentDto
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
        public DateOnly? UpdatedOn { get; set; }
    }

    // Employee skill responses
    public class EmployeeSkillDto
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

    public class SubordinateEmployeeDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public string Email { get; set; }
        public string DepartmentName { get; set; }
    }

    public class SkillDto
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; }
    }

    // SME responses
    public class SmeDto
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

    // File responses
    public class FileDownloadDto
    {
        public byte[] FileBytes { get; set; }
        public string FileName { get; set; }
        public string ContentType { get; set; }
        public long FileSize { get; set; }
    }
}
