namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for distributing a form.
    /// </summary>
    public class DistributeFormRequestDto
    {
        public List<int> EmployeeIds { get; set; } = new();
    }
}
