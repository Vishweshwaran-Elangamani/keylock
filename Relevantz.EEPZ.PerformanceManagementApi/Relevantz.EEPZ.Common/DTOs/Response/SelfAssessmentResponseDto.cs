namespace Relevantz.EEPZ.Common.DTOs.Response

{

    public class SelfAssessmentResponseDto

    {

        public int AssessmentId { get; set; }

        public int FormId { get; set; }

        public string FormName { get; set; } = null!;

        public int UserId { get; set; }

        public string UserName { get; set; } = null!;

        public string Status { get; set; } = null!;

        public DateTime? SubmittedAt { get; set; }

        public List<AssessmentDetailResponseDto> Details { get; set; } = new List<AssessmentDetailResponseDto>();

    }
 
    public class AssessmentDetailResponseDto

    {

        public int DetailId { get; set; }

        public int CompetencyId { get; set; }

        public string CompetencyName { get; set; } = null!;

        public string? CompetencyDescription { get; set; }

        public int? EmployeeRating { get; set; }

        public string? EmployeeComments { get; set; }

    }

}

 