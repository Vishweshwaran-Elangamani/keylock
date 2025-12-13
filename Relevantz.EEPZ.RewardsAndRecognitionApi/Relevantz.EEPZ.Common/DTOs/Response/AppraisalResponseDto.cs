namespace Relevantz.EEPZ.Common.DTOs.Response

{

    public class AppraisalResponseDto

    {

        public int AssignmentId { get; set; }

        public int FormId { get; set; }

        public string FormName { get; set; } = null!;

        public int UserId { get; set; }

        public string UserName { get; set; } = null!;

        public string? Action { get; set; }

        public DateTime? AssignedAt { get; set; }

        public DateTime? Deadline { get; set; }

        public FormProgressDto Progress { get; set; } = null!;

    }
 
    public class FormProgressDto

    {

        public bool Initiated { get; set; }

        public bool SentToEmployee { get; set; }

        public bool EmployeeCompleted { get; set; }

        public bool SentToManager { get; set; }

        public bool ManagerCompleted { get; set; }

        public bool SentToDeptHead { get; set; }

        public bool SentToLeadership { get; set; }

        public DateTime? LastUpdated { get; set; }

    }

}

 