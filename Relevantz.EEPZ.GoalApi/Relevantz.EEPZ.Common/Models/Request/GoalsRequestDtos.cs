using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs
{
    // ==================== QUERY/FILTER DTOs ====================

    public class PagedQueryDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? Search { get; set; }
    }

    public class GoalQueryDto : PagedQueryDto
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

    public class ApprovalQueryDto : PagedQueryDto
    {
        public string? Status { get; set; } = "all";
        public string? Type { get; set; } = "all";
        public string? Involvement { get; set; } = "all";
        public DateTime? RequestedAfter { get; set; }
        public DateTime? RequestedBefore { get; set; }
        public int? GoalId { get; set; }
    }

    // ==================== CREATION & UPDATE DTOs ====================

    public class ChecklistItemDto
    {
        public string Title { get; set; } = default!;
        public string? Description { get; set; }
        public bool IsShared { get; set; } = false;
        public int? AddedForEmployeeMasterId { get; set; }
    }

    public class CreateGoalDto
    {
        public string GoalType { get; set; } = default!;
        public int? ProjectId { get; set; }
        public List<int> AssignedToEmployeeMasterIds { get; set; } = new();
        public string Title { get; set; } = default!;
        public string? Description { get; set; }
        public List<ChecklistItemDto> Checklist { get; set; } = new();
        public DateTime Deadline { get; set; }
    }

    public class UpdateGoalDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? Deadline { get; set; }
        public List<ChecklistItemDto>? Checklist { get; set; }
    }

    // ==================== ASSIGNMENT DTOs ====================

    public class AssignGoalDto
    {
        [Required]
        public List<int> AssignedToEmployeeMasterIds { get; set; } = new();

        [Required]
        [MinLength(1, ErrorMessage = "At least one checklist item must be provided")]
        public List<ChecklistItemDto> AdditionalChecklist { get; set; } = new();
    }

    // ==================== APPROVAL DTOs ====================

    public class CreateApprovalRequestDto
    {
        [Required]
        public string ApprovalType { get; set; } = default!;
        public DateTime? ReopenUntil { get; set; }
        public List<int>? ProofAttachmentIds { get; set; }
    }

    public class DecideApprovalDto
    {
        public string Decision { get; set; } = default!;
        public DateTime? NewDeadline { get; set; }
    }

    // ==================== PROGRESS DTOs ====================

    public class ToggleChecklistDto
    {
        public int ChecklistId { get; set; }
        public bool IsCompleted { get; set; }
    }

    public class ManualProgressUpdateDto
    {
        public int ProgressPercent { get; set; }
        public string Source { get; set; } = "manual";
    }

    // ==================== COMMENT DTOs ====================

    public class CreateCommentDto
    {
        public string Comment { get; set; } = default!;
    }
}
