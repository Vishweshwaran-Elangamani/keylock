namespace Relevantz.EEPZ.Common.DTOs.Request;
 
// One question/competency line item
public record ReviewItemDto(
    int DetailId,
    int? Rating,
    string? Comments
);
 
// L1/L2 post body = assessment header + list of items
public record SubmitReviewDto(
    int AssessmentId,
    List<ReviewItemDto> Items
);
 