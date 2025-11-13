namespace Relevantz.EEPZ.Common.DTOs.Request

{

    public class ViewSubmittedFormsResponseDto

    {

        public int TotalCount { get; set; }

        public int SubmittedCount { get; set; }

        public int DraftCount { get; set; }

        public List<SelfAssessmentSummaryDto> Assessments { get; set; } = new List<SelfAssessmentSummaryDto>();

    }
 
    public class SelfAssessmentSummaryDto

    {

        public int AssessmentId { get; set; }

        public int FormId { get; set; }

        public string FormName { get; set; } = null!;

        public string FormType { get; set; } = null!;

        public string DeliveryEnablement { get; set; } = null!;

        public int UserId { get; set; }

        public string UserName { get; set; } = null!;

        public string Email { get; set; } = null!;

        public string Status { get; set; } = null!;

        public DateTime? SubmittedAt { get; set; }

        public int CompetencyCount { get; set; }

    }

}

 