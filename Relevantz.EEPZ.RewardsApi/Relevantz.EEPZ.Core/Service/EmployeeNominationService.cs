using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;

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
            _repository = repository;
            _logger = logger;
        }

        public async Task<EmployeeNotificationSearchResultDto> SearchEmployeeNotificationsAsync(int employeeId)
        {
            var result = new EmployeeNotificationSearchResultDto();

            if (employeeId <= 0)
            {
                result.Success = false;
                result.Message = "Please enter a valid employee ID";
                return result;
            }

            try
            {
                _logger.LogInformation($"[SEARCH] Searching notifications for employee ID: {employeeId}");

                var approvedNominations = await _repository
                    .GetApprovedNominationsByEmployeeAsync(employeeId);

                if (approvedNominations.Count == 0)
                {
                    _logger.LogInformation($"[SEARCH] No approved notifications for employee {employeeId}");
                    result.Success = true;
                    result.Message = "No approved notifications found";
                    return result;
                }

                foreach (var nomination in approvedNominations)
                {
                    var opportunity = await _repository
                        .GetRecognitionDetailWithRewardTypeAsync(nomination.OpportunityId);

                    result.Data.Add(new EmployeeNotificationItemDto
                    {
                        NominationId = nomination.NominationId,
                        RoleType = opportunity?.RewardType?.RewardName ?? "Opportunity"
                    });
                }

                _logger.LogInformation($"[SEARCH] Found {result.Count} approved notifications for employee {employeeId}");
                result.Success = true;
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"[SEARCH] Error: {ex.Message}");
                result.Success = false;
                result.Message = ex.Message;
                return result;
            }
        }
    }
}
