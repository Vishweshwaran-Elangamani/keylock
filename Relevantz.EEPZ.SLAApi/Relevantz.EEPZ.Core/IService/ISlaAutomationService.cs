using Relevantz.EEPZ.Common.DTOs.Response;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface ISlaAutomationService
    {
        /// <summary>
        /// Sends reminders for SLAs due within a specified day offset (e.g., -2, -1, 0).
        /// </summary>
        /// <param name="dayOffset">The number of days before the SLA deadline (e.g., -2 for two days before, 0 for the day of the deadline).</param>
        /// <returns>A response with the list of SLA reminders sent.</returns>
        Task<ApiResponse<List<SlaResponse>>> SendReminders(int dayOffset);

        /// <summary>
        /// Escalates overdue SLAs to the assigned manager.
        /// </summary>
        /// <returns>A response with the list of escalations processed.</returns>


        /// <summary>
        /// Automatically closes completed SLAs and sends completion emails.
        /// </summary>
        /// <returns>A response with the number of SLAs closed.</returns>
        Task<ApiResponse<int>> AutoCloseSlas();

        /// <summary>
        /// Runs the full SLA automation cycle including reminders, escalations, and closures.
        /// </summary>
        /// <returns>A response with the total number of actions processed in the automation cycle.</returns>
        Task<ApiResponse<int>> RunFullAutomationCycle();
    }
}
