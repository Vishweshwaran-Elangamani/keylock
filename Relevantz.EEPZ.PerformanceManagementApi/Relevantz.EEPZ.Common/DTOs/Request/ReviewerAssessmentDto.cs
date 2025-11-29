namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public record CompetencyReviewRowDto(
        int DetailId,
        string CompetencyName,
        int? EmployeeRating,
        string? EmployeeComments,
        int? ApproverRating,
        string? ApproverComments,
        int? ReviewerRating,
        string? ReviewerComments
    );

    public record AttachmentInfoDto(
        int AttachmentId,
        string FileName,
        string FilePath,
        string? FileType,
        long? FileSize,
        string? AttachmentNote,
        int? DisplayOrder,
        DateTime? UploadedAt
    );

    public record ReviewerAssessmentViewDto(
        int AssessmentId,
        string EmployeeName,
        string FormName,
        DateTime SubmittedAt,
        string Project,
        List<CompetencyReviewRowDto> Items,
        List<AttachmentInfoDto>? Attachments = null  
    );
}
