using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.Models
{
    // ==================== QUERY/FILTER Models ====================

    public class PagedQueryModel
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? Search { get; set; }
    }

    public class GoalQueryModel : PagedQueryModel
    {
        public int? CurrentUserEmpMasterID { get; set; }
        public string? Type { get; set; }
        public string? Status { get; set; }
        public int? ProjectId { get; set; }
        public DateTime? DueBefore { get; set; }
        public DateTime? DueAfter { get; set; }
        public int? CreatedByEmployeeMasterId { get; set; }
        public int? AssignedToEmployeeMasterId { get; set; }
        public DateTime? CreatedAfter { get; set; }
        public DateTime? CreatedBefore { get; set; }
        public string? CurrentUserRole { get; set; }
    }

    public class ApprovalQueryModel : PagedQueryModel
    {
        public string? Status { get; set; } = "all";
        public string? Type { get; set; } = "all";
        public string? Involvement { get; set; } = "all";
        public DateTime? RequestedAfter { get; set; }
        public DateTime? RequestedBefore { get; set; }
        public int? GoalId { get; set; }
    }

    // ==================== CREATION & UPDATE Models ====================

    public class ChecklistItemModel
    {
        public string Title { get; set; } = default!;
        public string? Description { get; set; }
        public bool IsShared { get; set; } = false;
        public int? AddedForEmployeeMasterId { get; set; }
    }

    public class CreateGoalModel
    {
        public string GoalType { get; set; } = default!;
        public int? ProjectId { get; set; }
        public List<int> AssignedToEmployeeMasterIds { get; set; } = new();
        public string Title { get; set; } = default!;
        public string? Description { get; set; }
        public List<ChecklistItemModel> Checklist { get; set; } = new();
        public DateTime Deadline { get; set; }
    }

    public class UpdateGoalModel
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? Deadline { get; set; }
        public List<ChecklistItemModel>? Checklist { get; set; }
    }

    // ==================== ASSIGNMENT Models ====================

    public class AssignGoalModel
    {
        [Required]
        public List<int> AssignedToEmployeeMasterIds { get; set; } = new();

        [Required]
        [MinLength(1, ErrorMessage = "At least one checklist item must be provided")]
        public List<ChecklistItemModel> AdditionalChecklist { get; set; } = new();
    }

    // ==================== APPROVAL Models ====================

    public class CreateApprovalRequestModel
    {
        [Required]
        public string ApprovalType { get; set; } = default!;
        public DateTime? ReopenUntil { get; set; }
        public List<int>? ProofAttachmentIds { get; set; }
    }

    public class DecideApprovalModel
    {
        public string Decision { get; set; } = default!;
        public DateTime? NewDeadline { get; set; }
    }

    // ==================== PROGRESS Models ====================

    public class ToggleChecklistModel
    {
        public int ChecklistId { get; set; }
        public bool IsCompleted { get; set; }
    }

    public class ManualProgressUpdateModel
    {
        public int ProgressPercent { get; set; }
        public string Source { get; set; } = "manual";
    }

    // ==================== COMMENT Models ====================

    public class CreateCommentModel
    {
        public string Comment { get; set; } = default!;
    }
}
