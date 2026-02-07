namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request to distribute a feedback form to employees.
    /// </summary>
    public class DistributeFormRequest
    {
        /// <summary>Employee identifiers to whom the form will be assigned.</summary>
        public List<int> EmployeeIds { get; set; }
    }
}
