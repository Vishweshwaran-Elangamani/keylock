using Relevantz.EEPZ.Common.DTOs.Response;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface ISlaAutomationService
    {
        /// <summary>
        /// Sends SLA reminders for a specific day offset (e.g., 2, 1, 0).
        /// </summary>
        /// <param name="dayOffset">Number of days before deadline.</param>
        /// <returns>Summary of reminder execution.</returns>
        Task<ApiResponse<SlaReminderSummaryResponse>> SendReminders(int dayOffset);

        /// <summary>
        /// Runs reminder process for Day-2, Day-1 and Day-0.
        /// </summary>
        /// <returns>Combined reminder summary.</returns>
        Task<ApiResponse<SlaReminderSummaryResponse>> RunReminderCycle();

        /// <summary>
        /// Automatically closes completed SLAs and sends confirmation emails.
        /// </summary>
        /// <returns>Summary of auto-closure process.</returns>
        Task<ApiResponse<SlaClosureSummaryResponse>> AutoCloseSlas();

        /// <summary>
        /// Executes the full automation workflow (reminders + closures).
        /// </summary>
        /// <returns>Total actions processed.</returns>
        Task<ApiResponse<int>> RunFullAutomationCycle();

      Task<ApiResponse<AutomationStatusResponse>> GetAutomationStatus();
     Task<ApiResponse<AutomationLogResponse>> GetAutomationLogs(int days);

          
    }
}
