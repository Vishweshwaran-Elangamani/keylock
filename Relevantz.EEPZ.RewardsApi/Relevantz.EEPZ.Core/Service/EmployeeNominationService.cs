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
        /// Searches for approved employee notifications for the given employee,
        /// batch-fetches all related recognition details + reward types in one query,
        /// and maps to DTOs.
        /// </summary>
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
 
            _logger.LogInformation("[SEARCH] Starting search for employee notifications. EmployeeId={EmployeeId}", employeeId);
 
            // 1) Load all approved nominations for the employee
            var approvedNominations = await _repository.GetApprovedNominationsByEmployeeAsync(
                employeeId, cancellationToken);
 
            if (approvedNominations == null || approvedNominations.Count == 0)
            {
                _logger.LogInformation("[SEARCH] No approved notifications found for EmployeeId={EmployeeId}", employeeId);
                result.Success = true;
                result.Message = "No approved notifications found";
                return result;
            }
 
            // 2) Batch-load all related recognition details (with RewardType) in a single query
            var oppIds = approvedNominations
                .Select(n => n.OpportunityId)
                .Distinct()
                .ToList();
 
            var details = await _repository.GetRecognitionDetailsWithRewardTypeByOppIdsAsync(
                oppIds, cancellationToken);
 
            // 3) Index by OpportunityId for fast lookup
            var detailByOppId = details.ToDictionary(d => d.OpportunityId);
 
            // 4) Map nominations -> DTOs using the preloaded dictionary
            var items = new List<EmployeeNotificationItemDto>(approvedNominations.Count);
            foreach (var nomination in approvedNominations)
            {
                detailByOppId.TryGetValue(nomination.OpportunityId, out var detail);
 
                items.Add(new EmployeeNotificationItemDto
                {
                    NominationId = nomination.NominationId,
                    RoleType = detail?.RewardType?.RewardName ?? "Opportunity"
                });
            }
 
            result.Data.AddRange(items);
            result.Success = true;
            _logger.LogInformation("[SEARCH] Found {Count} approved notifications for EmployeeId={EmployeeId}", result.Data.Count, employeeId);
            return result;
        }
    }
}
