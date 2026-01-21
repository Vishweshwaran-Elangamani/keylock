namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class ManagerReviewResponseDto
    {
        public int ReviewcommentId { get; set; }

        public int ManagerEmployeeId { get; set; }
        public string? ManagerName { get; set; }

        public int TargetEmployeeId { get; set; }
        public string? TargetEmployeeName { get; set; }

        public int? TargetGoalId { get; set; }
        public string? TargetGoalName { get; set; }

        public int? TargetOrganizationGoalId { get; set; }

        public int Rating { get; set; }
        public string? ReviewComment { get; set; }

        public string? Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? ModifiedAt { get; set; }
    }
}
