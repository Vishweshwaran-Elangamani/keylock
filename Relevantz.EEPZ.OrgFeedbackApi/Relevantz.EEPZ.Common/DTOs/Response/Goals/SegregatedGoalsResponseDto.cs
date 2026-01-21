namespace Relevantz.EEPZ.Common.DTOs.Response
{
    /// <summary>
    /// Goals segregated by type (Team and Organization Level).
    /// </summary>
    public class SegregatedGoalsResponseDto
    {
        public List<ProjectGoalResponseDto> TeamGoals { get; set; } = new();

        public List<ProjectGoalResponseDto> OrganizationLevelGoals { get; set; } = new();

        public int TotalTeamGoals { get; set; }

        public int TotalOrgLevelGoals { get; set; }
    }
}
