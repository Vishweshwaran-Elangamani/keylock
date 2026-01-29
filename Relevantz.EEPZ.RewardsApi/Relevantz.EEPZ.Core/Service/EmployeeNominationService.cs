using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class EmployeeNominationService : IEmployeeNominationService
    {
        private readonly IEmployeeNominationRepository _repository;
        private readonly ILogger<EmployeeNominationService> _logger;

        public EmployeeNominationService(
            IEmployeeNominationRepository repository,
            ILogger<EmployeeNominationService> logger)
        {
            _repository = repository ?? throw new ArgumentNullException(nameof(repository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Searches approved employee notifications for the given employee,
        /// batch-fetches related recognition details + reward types,
        /// and maps to DTOs (no entity exposure).
        /// </summary>
        /// <param name="employeeId">Employee identifier (must be positive).</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Notification search result DTO.</returns>
        public async Task<EmployeeNotificationSearchResultDto> SearchEmployeeNotificationsAsync(
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            var result = new EmployeeNotificationSearchResultDto();

            if (employeeId <= 0)
            {
                result.Success = false;
                result.Message = "Please enter a valid employee ID";
                return result;
            }

            _logger.LogInformation("Starting employee notification search. EmployeeId={EmployeeId}", employeeId);

            try
            {
                // 1) Get approved nominations for employee (repository uses AsNoTracking)
                List<Recognitionstatus> approvedNominations =
                    await _repository.GetApprovedNominationsByEmployeeAsync(employeeId, cancellationToken);

                if (approvedNominations == null || approvedNominations.Count == 0)
                {
                    result.Success = true;
                    result.Message = "No approved notifications found";
                    // Do NOT set Count (read-only). Assuming DTO calculates Count from Data.
                    return result;
                }

                // 2) Collect distinct OpportunityIds and batch-load recognition details with RewardType
                var oppIds = approvedNominations
                    .Select(n => n.OpportunityId)
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();

                List<Recognitiondetail> details = oppIds.Count == 0
                    ? new List<Recognitiondetail>()
                    : await _repository.GetRecognitionDetailsWithRewardTypeByOppIdsAsync(oppIds, cancellationToken);

                // 3) Build index safely (avoid duplicate key exceptions)
                var detailByOppId = (details ?? new List<Recognitiondetail>())
                    .Where(d => d != null)
                    .GroupBy(d => d.OpportunityId)
                    .ToDictionary(g => g.Key, g => g.First());

                // 4) Map to DTOs (no entity exposure)
                foreach (var nomination in approvedNominations)
                {
                    detailByOppId.TryGetValue(nomination.OpportunityId, out var detail);

                    // IMPORTANT: this assumes result.Data is initialized by the DTO (common pattern).
                    result.Data.Add(new EmployeeNotificationItemDto
                    {
                        NominationId = nomination.NominationId,
                        RoleType = detail?.RewardType?.RewardName ?? "Opportunity"
                    });
                }

                result.Success = true;
                result.Message = "Notifications retrieved successfully";

                _logger.LogInformation(
                    "Employee notification search completed. EmployeeId={EmployeeId}, Count={Count}",
                    employeeId,
                    result.Data?.Count ?? 0);

                return result;
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Employee notification search cancelled. EmployeeId={EmployeeId}", employeeId);

                result.Success = false;
                result.Message = "Request cancelled";
                return result;
            }
            catch (Exception ex)
            {
                // Log internally, return generic message to avoid leaking details.
                _logger.LogError(ex, "Error while searching employee notifications. EmployeeId={EmployeeId}", employeeId);

                result.Success = false;
                result.Message = "Unable to process the request at this time.";
                return result;
            }
        }
    }
}