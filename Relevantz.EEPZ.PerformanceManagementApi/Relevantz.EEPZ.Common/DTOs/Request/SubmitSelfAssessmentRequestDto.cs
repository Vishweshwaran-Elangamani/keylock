namespace Relevantz.EEPZ.Common.DTOs.Request

{

    public class SubmitSelfAssessmentRequestDto

    {

        public int FormId { get; set; }

        public int UserId { get; set; }

        public string Status { get; set; } = "Draft"; // "Draft" or "Submitted"

        public List<AssessmentDetailDto> AssessmentDetails { get; set; } = new List<AssessmentDetailDto>();

    }
 
    public class AssessmentDetailDto

    {

        public int CompetencyId { get; set; }

        public int? EmployeeRating { get; set; }

        public string? EmployeeComments { get; set; }

    }

}

 