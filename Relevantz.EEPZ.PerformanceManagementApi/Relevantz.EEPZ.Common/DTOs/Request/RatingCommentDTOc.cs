namespace Relevantz.EEPZ.Common.DTOs.Request

{

    public class PerformanceRatingDto

    {

        public int EmployeeId { get; set; }

        public string EmployeeName { get; set; }

        public string ProjectName { get; set; }

        public List<CompetencyRatingDto> Competencies { get; set; }

    }
 
    public class CompetencyRatingDto

    {

        public string CompetencyName { get; set; }

        public int? EmployeeRating { get; set; }

        public string EmployeeComments { get; set; }

        public int? L1Rating { get; set; }

        public string L1Comments { get; set; }

        public string L1ReviewerName { get; set; }

        public int? L2Rating { get; set; }

        public string L2Comments { get; set; }

        public string L2ReviewerName { get; set; }

    }

}

 