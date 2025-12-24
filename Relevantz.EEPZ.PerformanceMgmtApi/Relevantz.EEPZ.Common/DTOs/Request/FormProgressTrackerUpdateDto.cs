namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class FormProgressTrackerUpdateDto
    {
        public int AssignmentId { get; set; }
        public bool? Initiated { get; set; }
        public bool? SentToEmployee { get; set; }
        public bool? EmployeeCompleted { get; set; }
        public bool? SentToManager { get; set; }
        public bool? ManagerCompleted { get; set; }
        public bool? SentToDeptHead { get; set; }
        public bool? SentToLeadership { get; set; }
    }
}
