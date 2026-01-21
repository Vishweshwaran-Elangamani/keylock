namespace Relevantz.EEPZ.Common.DTOs.Response
{
    /// <summary>
    /// Response DTO for Organization-Wide Objective (mapped from Goals table).
    /// </summary>
    public class OrgObjectiveResponseDto
    {
        public int ObjectiveId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string GoalStatus { get; set; } = string.Empty;

        public DateTime? CreatedAt { get; set; }

        public DateTime? EndDate { get; set; }
    }
}
