namespace Relevantz.EEPZ.Common.DTOs.Request;
 
public record ReviewerDecisionDto(
    int AssessmentId,
    string? Decision,     // "Approved" | "Rejected" | null
    string? Note,         // the body text from /decision
    DateTime? DecidedAt
);
 