namespace Relevantz.EEPZ.Common.DTOs.Request;

public record ReviewItemDto(
    int DetailId,
    int? Rating,
    string? Comments
);

public record SubmitReviewDto(
    int AssessmentId,
    List<ReviewItemDto> Items
);
 