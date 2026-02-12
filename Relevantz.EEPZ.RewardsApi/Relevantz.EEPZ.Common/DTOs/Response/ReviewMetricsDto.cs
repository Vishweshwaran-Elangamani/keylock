namespace Relevantz.EEPZ.Common.DTOs.Response
{
            public class ReviewMetricsDto
        {
            public int NominationId { get; set; }
            public int ReviewedByEmployeeId { get; set; }
            public decimal? MeritScore { get; set; }
            public decimal? DiversityScore { get; set; }
            public bool ConflictOfInterest { get; set; }
            public string ReviewNotes { get; set; }
        }
}