namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class HRNominationApprovalDto

{

    public int HrUserId { get; set; }

    public List<int> SelectedNominationIds { get; set; }

    public string? ApprovalRemarks { get; set; }

    public string? RejectionRemarks { get; set; }

}

 
}