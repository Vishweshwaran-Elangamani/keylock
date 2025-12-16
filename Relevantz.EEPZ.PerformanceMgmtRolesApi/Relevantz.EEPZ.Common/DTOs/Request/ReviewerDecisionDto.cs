namespace Relevantz.EEPZ.Common.DTOs.Request;
 
public record ReviewerDecisionDto(
    int AssessmentId,
    string? Decision,     
    string? Note,         
    DateTime? DecidedAt
);
 