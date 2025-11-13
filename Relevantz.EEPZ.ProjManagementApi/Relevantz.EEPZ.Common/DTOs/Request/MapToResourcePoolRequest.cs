using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class MapToResourcePoolRequest
    {
        public List<int> EmployeeMasterIds { get; set; } = new List<int>();
    }
}
