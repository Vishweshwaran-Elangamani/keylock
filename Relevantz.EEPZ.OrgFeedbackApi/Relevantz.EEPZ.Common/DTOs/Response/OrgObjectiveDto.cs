using System.Text.Json.Serialization;

namespace Relevantz.EEPZ.Common.Models
{
    /// <summary>
    /// Organization-Wide Objective DTO (mapped from Goals table)
    /// </summary>
    public class OrgObjectiveDto
    {
        [JsonPropertyName("objectiveId")]
        public int ObjectiveId { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("goalStatus")]
        public string GoalStatus { get; set; } = string.Empty;

        [JsonPropertyName("createdAt")]
        public DateTime? CreatedAt { get; set; }

        [JsonPropertyName("endDate")]
        public DateTime? EndDate { get; set; }
    }
}
