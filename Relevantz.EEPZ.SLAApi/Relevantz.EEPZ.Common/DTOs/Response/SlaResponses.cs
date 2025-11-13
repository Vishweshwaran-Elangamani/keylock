namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class CreateSlaResponse
    {
        public int Slaid { get; set; }
        public string Message { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Response DTO for SLA details (US023)
    /// </summary>
    public class SlaResponse
    {
        public int Slaid { get; set; }
        public string Slatype { get; set; }
        public string Status { get; set; }
        public int EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public string? EmployeeEmail { get; set; }
        public int DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public int? AssignedToEmployeeId { get; set; }
        public string? AssignedToName { get; set; }
        public DateTime Deadline { get; set; }
        public DateTime? ClosedAt { get; set; }
        public string ComplianceStatus { get; set; }
        public string? RelatedEntityType { get; set; }
        public int? RelatedEntityId { get; set; }
        public DateTime? ReopenedAt { get; set; }
        public int? ReopenExtensionDays { get; set; }
        public string? ReopenReason { get; set; }
        public string? UrgencyStatus { get; set; }
        public int DaysUntilDeadline { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>
    /// Response DTO for escalation submission (US022, US063, US064, US088, US100)
    /// ✅ FIXED: Consistent naming convention
    /// </summary>
   public class EscalationResponse
{
    public int EscalationId { get; set; }
    public int Slaid { get; set; }
    public string? Reason { get; set; }
    public string? Description { get; set; }
    public string? EscalationLevel { get; set; }
    public string? EscalationStatus { get; set; }
    public DateTime? SubmittedAt { get; set; }
    
    // ✅ Employee being reviewed
    public int? EmployeeId { get; set; }
    public string? EmployeeName { get; set; }  // ← ADD THIS
    public string? EmployeeEmail { get; set; }
    
    // Manager who escalated
    public int? SubmittedByEmployeeId { get; set; }
    public string? SubmittedByName { get; set; }
    
    // Dept Head assigned to
    public int? EscalatedToEmployeeId { get; set; }
    public string? EscalatedToName { get; set; }
    
    // Resolution
    public int? ResolvedByEmployeeId { get; set; }
    public string? ResolvedByName { get; set; }
    public string? ResolutionComments { get; set; }
    public DateTime? ResolvedAt { get; set; }
    
    public string? Message { get; set; }
}

    /// <summary>
    /// Response DTO for reopen operation (US062)
    /// </summary>
    public class ReopenSlaResponse
    {
        public string Message { get; set; } = string.Empty;
        public DateTime OldDeadline { get; set; }
        public DateTime NewDeadline { get; set; }
        public int ExtensionDays { get; set; }
    }

    /// <summary>
    /// Response DTO for team review tracking (US052)
    /// </summary>
    public class TeamReviewTrackingResponse
    {
        public int ReviewTrackingId { get; set; }
        public int Slaid { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeEmail { get; set; } = string.Empty;
        public int ReviewerId { get; set; }
        public string ReviewerName { get; set; } = string.Empty;
        public string ReviewType { get; set; } = string.Empty;
        public string ReviewCycle { get; set; } = string.Empty;
        public DateTime Deadline { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public string ComplianceStatus { get; set; } = string.Empty;
        public int DaysUntilDeadline { get; set; }
        public string UrgencyStatus { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response DTO for department compliance (US061, US087)
    /// </summary>
    public class DepartmentComplianceResponse
{
    public int ComplianceId { get; set; }
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public DateOnly PeriodStartDate { get; set; }
    public DateOnly PeriodEndDate { get; set; }
    public int TotalSlas { get; set; }        // ✅ Match model
    public int OnTimeSlas { get; set; }       // ✅ Match model
    public int BreachedSlas { get; set; }     // ✅ Match model
    public int ExtendedSlas { get; set; }     // ✅ Add this too
    public int PendingSlas { get; set; }      // ✅ Add this too
    public decimal CompliancePercentage { get; set; }
    public DateTime CalculatedAt { get; set; }
}


    /// <summary>
    /// Response DTO for SLA history (US064, US088, US100)
    /// </summary>
    public class SlaHistoryResponse
    {
        public int SlahistoryId { get; set; }
        public int Slaid { get; set; }
        public string Slatype { get; set; } = string.Empty;
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string ChangeType { get; set; } = string.Empty;
        public string? ChangedFrom { get; set; }
        public string? ChangedTo { get; set; }
        public int? ChangedByEmployeeId { get; set; }
        public string? ChangedByName { get; set; }
        public int? ReferenceEscalationId { get; set; }
        public string? Reason { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Generic response wrapper
    /// </summary>
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }
    }
}
