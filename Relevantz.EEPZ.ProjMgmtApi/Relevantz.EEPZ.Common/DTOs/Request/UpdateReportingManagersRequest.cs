using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateReportingManagersRequest
    {
        [Required]
        public int ProjectId { get; set; }

        public int? ResourceOwnerEmployeeId { get; set; }

        public int? L1ApproverEmployeeId { get; set; }

        public int? L2ApproverEmployeeId { get; set; }
    }
}
