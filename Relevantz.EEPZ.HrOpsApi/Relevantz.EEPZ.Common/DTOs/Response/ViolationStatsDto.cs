using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class ViolationStatsDto
    {
        public Dictionary<string, int> BySeverity { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> ByStatus { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> ByType { get; set; } = new Dictionary<string, int>();
    }
}
