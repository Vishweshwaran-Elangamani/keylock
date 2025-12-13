namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class RecognitionRewardDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeCompanyId { get; set; }
        public string EmployeeName { get; set; }
        public string RewardType { get; set; }
        public string AmountGrade { get; set; }
        public string Reason { get; set; }
        public DateTime? RewardDate { get; set; }
        public string SubmittedByName { get; set; }
    }
}
