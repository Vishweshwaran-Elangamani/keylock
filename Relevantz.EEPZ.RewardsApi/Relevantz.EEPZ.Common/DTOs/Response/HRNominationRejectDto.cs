namespace Relevantz.EEPZ.Common.DTOs.Response;

public class HRNominationRejectDto
{
    public List<long> SelectedNominationIds { get; set; }
    public long HrUserId { get; set; }
    public string RejectionRemarks { get; set; }
}