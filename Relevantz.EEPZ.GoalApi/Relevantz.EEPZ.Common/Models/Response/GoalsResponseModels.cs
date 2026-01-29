using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Models
{
    // ==================== PROJECT Models ====================

    public class ProjectModel
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateOnly? StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public List<ProjectEmployeeModel>? Employees { get; set; }
    }

    public class ProjectEmployeeModel
    {
        public int EmpMasterId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }

    // ==================== GOAL Models ====================

    public class AssigneeModel
    {
        public int EmployeeMasterId { get; set; }
        public string Name { get; set; }
        public string? Role { get; set; }
        public bool IsAcknowledged { get; set; }
        public DateTime? AcknowledgedOn { get; set; }
    }

    public class GoalChecklistItemModel
    {
        public int ChecklistId { get; set; }
        public string Title { get; set; } = default!;
        public string? Description { get; set; }
        public bool IsShared { get; set; }
        public int? AddedForEmployeeMasterId { get; set; }
        public bool IsCompletedForCurrentUser { get; set; }
    }

    public class GoalSummaryModel
    {
        public int GoalId { get; set; }
        public string Title { get; set; } = default!;
        public string? DescriptionShort { get; set; }
        public string GoalType { get; set; } = default!;
        public string Status { get; set; } = default!;
        public DateTime? CreatedAt { get; set; }
        public DateTime? EndAt { get; set; }
        public int ProgressPercent { get; set; }
        public int? ProjectId { get; set; }
        public string? ProjectName { get; set; }
        public int? CreatedByEmployeeMasterId { get; set; }
        public string? CreatedByName { get; set; }
        public bool IsOverdue { get; set; }
        public bool CanAssign { get; set; }
        public int? MyProgress { get; set; }
        public bool HasPendingApproval { get; set; }
        public bool IsAcknowledged { get; set; }
        public List<AssigneeModel>? Assignees { get; set; }
    }

    public class GoalDetailModel
    {
        public int GoalId { get; set; }
        public string GoalType { get; set; } = default!;
        public int? ProjectId { get; set; }
        public string? ProjectName { get; set; }
        public string Title { get; set; } = default!;
        public string? Description { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int? CreatedByEmployeeMasterId { get; set; }
        public string? CreatedByName { get; set; }
        public DateTime? EndAt { get; set; }
        public string Status { get; set; } = default!;
        public int ProgressPercent { get; set; }
        public List<GoalChecklistItemModel> Checklist { get; set; } = new();
        public List<AssigneeModel> Assignees { get; set; } = new();
        public bool CanEdit { get; set; }
        public bool CanComment { get; set; }
        public bool CanMarkComplete { get; set; }
        public bool IsOverdue { get; set; }
        public bool CanRequestReopen { get; set; }
        public bool HasPendingApproval { get; set; }
    }

    public class GoalDashboardSummaryModel
    {
        public int Completed { get; set; }
        public int Ongoing { get; set; }
        public int Pending { get; set; }
        public int Overdue { get; set; }
        public int PendingApprovals { get; set; }
    }

    // ==================== APPROVAL Models ====================

    public class GoalApprovalModel
    {
        public int ApprovalId { get; set; }
        public int GoalId { get; set; }
        public string GoalTitle { get; set; } = default!;
        public string ApprovalType { get; set; } = default!;
        public int? RequestedByEmployeeMasterId { get; set; }
        public string? RequestedByName { get; set; }
        public DateTime? RequestedOn { get; set; }
        public string ApprovalStatus { get; set; } = default!;
        public List<GoalAttachmentModel>? AllAttachments { get; set; }
        public List<GoalAttachmentModel>? ProofAttachments { get; set; }
        public DateTime? ReopenUntil { get; set; }
    }

    public class UserGoalApprovalModel : GoalApprovalModel
    {
        public string UserRole { get; set; } = default!;
        public bool CanMakeDecision { get; set; }
        public int? ApproverEmployeeMasterId { get; set; }
        public string? ApproverName { get; set; }
        public string? ApproverRole { get; set; }
        public DateTime? ApprovedOn { get; set; }
        public int? GoalCreatedByEmployeeMasterId { get; set; }
        public string? GoalCreatedByName { get; set; }
        public List<AssigneeModel>? GoalAssignees { get; set; }
        public string? UserContext { get; set; }
    }

    // Paged response for approvals
    public class PagedApprovalsModel
    {
        public List<UserGoalApprovalModel> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
        public ApprovalSummaryModel Summary { get; set; } = new();
    }

    public class ApprovalSummaryModel
    {
        public int MyPending { get; set; }
        public int ToReview { get; set; }
        public int MyRequests { get; set; }
        public int History { get; set; }
        public int Total { get; set; }
    }

    // ==================== ATTACHMENT Models ====================

    public class FileUploadResponseModel
    {
        public int AttachmentId { get; set; }
        public string AttachmentTitle { get; set; } = default!;
        public string FilePath { get; set; } = default!;
        public string FileName { get; set; } = default!;
        public long FileSize { get; set; }
        public string ContentType { get; set; } = default!;
        public DateTime UploadedOn { get; set; }
    }

    public class GoalAttachmentModel
    {
        public int GoalAttachmentId { get; set; }
        public int GoalId { get; set; }
        public string AttachmentTitle { get; set; } = default!;
        public string FilePath { get; set; } = default!;
        public int? AttachedByEmployeeMasterId { get; set; }
        public string? AttachedByName { get; set; }
        public DateTime? AttachedOn { get; set; }
        public bool IsProofOfCompletion { get; set; }
        public int? LinkedApprovalId { get; set; }
    }

    // ==================== COMMENT Models ====================

    public class GoalCommentModel
    {
        public int GoalCommentId { get; set; }
        public int GoalId { get; set; }
        public string Comment { get; set; } = default!;
        public int? CommentedByEmployeeMasterId { get; set; }
        public string? CommentedByName { get; set; }
        public string? CommentedByRole { get; set; }
        public DateTime? CommentedOn { get; set; }
    }

    // ==================== TIMELINE Models ====================

    public class TimelineEventModel
    {
        public string Type { get; set; } = default!;
        public DateTime Timestamp { get; set; }
        public string Description { get; set; } = default!;
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public string? UserRole { get; set; }
        public object? Metadata { get; set; }
    }

    // ==================== COMPLETION STATUS Models ====================

    public class CanMarkCompleteModel
    {
        public bool CanComplete { get; set; }
        public string? Reason { get; set; } // Combined reason text
        public List<string>? Reasons { get; set; }
        public bool IsOverdue { get; set; }
        public bool ShouldRequestReopen { get; set; }
        public CanMarkCompleteDetailsModel? Details { get; set; }
    }

    public class CanMarkCompleteDetailsModel
    {
        public bool HasRequiredProgress { get; set; }
        public int CurrentProgress { get; set; }
        public bool IsNotOverdue { get; set; }
        public bool HasValidStatus { get; set; }
        public string CurrentStatus { get; set; } = default!;
        public bool IsParticipant { get; set; }
    }

    // ==================== USER ASSIGNMENT Models ====================

    public class AssignableUserModel
    {
        public int EmployeeMasterId { get; set; }
        public string Name { get; set; } = default!;
        public string Role { get; set; } = default!;
        public string? Department { get; set; }
        public bool IsAlreadyAssigned { get; set; }
    }

    // ==================== CASCADING PROGRESS Models ====================

    /// <summary>
    /// Hierarchical progress breakdown showing cascade
    /// </summary>
    public class GoalProgressHierarchyModel
    {
        public int GoalId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = default!;
        public string Role { get; set; } = default!;
        public int OwnProgress { get; set; }
        public int? TeamProgress { get; set; }
        public int CascadingProgress { get; set; }
        public int OwnWeight { get; set; }
        public int TeamWeight { get; set; }
        public int OwnItemCount { get; set; }
        public int OwnItemsCompleted { get; set; }
        public List<SubordinateProgressModel> Subordinates { get; set; } = new();
    }

    /// <summary>
    /// Progress details for a subordinate
    /// </summary>
    public class SubordinateProgressModel
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = default!;
        public string Role { get; set; } = default!;
        public int Progress { get; set; }
        public int ItemCount { get; set; }
        public int ItemsCompleted { get; set; }
    }
}
