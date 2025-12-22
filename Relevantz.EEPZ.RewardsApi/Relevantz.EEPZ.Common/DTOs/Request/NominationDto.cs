namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class NominationSubmitDto
    {
        public int? RewardTypeId { get; set; }
        public int NomineeEmployeeId { get; set; }
        public int NominatedByEmployeeId { get; set; }
        public string Justification { get; set; }
        public List<ParameterValueDto> ParameterValues { get; set; }
    }

    public class ParameterValueDto
    {
        public int ParameterId { get; set; }
        public string Value { get; set; }
    }
}
