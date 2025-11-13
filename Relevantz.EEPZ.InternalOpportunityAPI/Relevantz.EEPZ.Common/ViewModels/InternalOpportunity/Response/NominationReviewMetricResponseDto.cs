using System;

namespace Relevantz.EEPZ.Common.ViewModels.Nomination.Response
{
    public class NominationReviewMetricResponseDto
    {
        public int MetricId { get; set; }
        public int NominationId { get; set; }
        public int ReviewedByUserId { get; set; }
        public string ReviewedByName { get; set; }
        public decimal? MeritScore { get; set; }
        public decimal? DiversityScore { get; set; }
        public bool ConflictOfInterest { get; set; }
        public string ReviewNotes { get; set; }
        public DateTime ReviewedAt { get; set; }
    }
}
