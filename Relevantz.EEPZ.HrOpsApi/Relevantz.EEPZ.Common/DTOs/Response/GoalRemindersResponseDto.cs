using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class GoalRemindersResponseDto
    {
        public int TotalSent { get; set; }
        public int Successful { get; set; }
        public int Failed { get; set; }
        public List<object> SentTo { get; set; } = new();
        public List<object> FailedSends { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }
}
