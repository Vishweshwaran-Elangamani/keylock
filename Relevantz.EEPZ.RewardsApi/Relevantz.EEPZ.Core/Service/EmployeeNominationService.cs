using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.Entities;
 
 
namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class EmployeeNominationService : IEmployeeNominationService
    {
        private readonly IEmployeeNominationRepository _repository;
        private readonly ILogger<EmployeeNominationService> _logger;
        private readonly DbContext _dbContext; 
 
        public EmployeeNominationService(
            IEmployeeNominationRepository repository,
            ILogger<EmployeeNominationService> logger,
            DbContext dbContext)
        {
            _repository = repository ?? throw new ArgumentNullException(nameof(repository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
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
 
            await using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                _logger.LogInformation("[SEARCH] Starting search for employee notifications. EmployeeId={EmployeeId}", employeeId);
 
                var approvedNominations = await _repository.GetApprovedNominationsByEmployeeAsync(employeeId);
 
                if (approvedNominations == null || approvedNominations.Count == 0)
                {
                    _logger.LogInformation("[SEARCH] No approved notifications found for EmployeeId={EmployeeId}", employeeId);
                    result.Success = true;
                    result.Message = "No approved notifications found";
                    await transaction.CommitAsync();
                    return result;
                }
 
                var tasks = new List<Task<EmployeeNotificationItemDto>>();
                foreach (var nomination in approvedNominations)
                {
                    tasks.Add(BuildNotificationItemAsync(nomination));
                }
 
                result.Data.AddRange(await Task.WhenAll(tasks));
 
                _logger.LogInformation("[SEARCH] Found {Count} approved notifications for EmployeeId={EmployeeId}", result.Data.Count, employeeId);
                result.Success = true;
 
                await transaction.CommitAsync();
                return result;
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "[SEARCH] Invalid argument provided for EmployeeId={EmployeeId}", employeeId);
                await transaction.RollbackAsync();
                result.Success = false;
                result.Message = ex.Message;
                return result;
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "[SEARCH] Operation failed for EmployeeId={EmployeeId}", employeeId);
                await transaction.RollbackAsync();
                result.Success = false;
                result.Message = "Operation failed. Please try again.";
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[SEARCH] Unexpected error occurred for EmployeeId={EmployeeId}", employeeId);
                await transaction.RollbackAsync();
                result.Success = false;
                result.Message = "An unexpected error occurred. Please contact support.";
                return result;
            }
        }
 
        private async Task<EmployeeNotificationItemDto> BuildNotificationItemAsync(Recognitionstatus nomination)
        {
            var opportunity = await _repository.GetRecognitionDetailWithRewardTypeAsync(nomination.OpportunityId);
 
            return new EmployeeNotificationItemDto
            {
                NominationId = nomination.NominationId,
                RoleType = opportunity?.RewardType?.RewardName ?? "Opportunity"
            };
        }
    }
}
 
 
 
 