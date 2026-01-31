namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class SlaClosureSummaryResponse
    {
        public int SlasClosed { get; set; }
        public int ConfirmationEmailsSent { get; set; }
        public int Failures { get; set; }
    }
}
