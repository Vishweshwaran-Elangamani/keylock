using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Core.Service
{
    public class EmployeeDataService : IEmployeeDataService
    {
        private readonly IComplianceService _complianceService;
        private readonly IPolicyService _policyService;
        private readonly IEmailService _emailService;
        private readonly IEmployeeDataRepository _employeeDataRepository;
        private readonly ILogger<EmployeeDataService> _logger;
        private readonly IConfiguration _configuration;
        
        public EmployeeDataService(
            IComplianceService complianceService,
            IPolicyService policyService,
            IEmailService emailService,
            IEmployeeDataRepository employeeDataRepository,
            ILogger<EmployeeDataService> logger,
            IConfiguration configuration)
        {
            _complianceService = complianceService;
            _policyService = policyService;
            _emailService = emailService;
            _employeeDataRepository = employeeDataRepository;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<ComplianceOverviewDto> GetComplianceOverviewAsync()
        {
            var complianceResponse = await _complianceService.GetComplianceOverviewAsync();
            if (complianceResponse?.Data != null)
            {
                return complianceResponse.Data;
            }
            throw new InvalidOperationException("Compliance overview data not available");
        }

        public async Task<(List<EmployeeWithoutGoalsDto> Employees, string Message)> GetEmployeesWithoutGoalsAsync(int? currentUserId)
        {
            var usersWithoutGoals = await _employeeDataRepository.GetEmployeesWithoutGoalsAsync(currentUserId);

            _logger.LogInformation(
                "Found {Count} employees without goals (excluding Admins and user ID: {UserId})",
                usersWithoutGoals.Count,
                currentUserId
            );

            var message = $"Found {usersWithoutGoals.Count} employees without goals";
            return (usersWithoutGoals, message);
        }

        public async Task<GoalSuggestionsResponseDto> SuggestGoalsAsync(int userId)
        {
            var user = await _employeeDataRepository.GetUserWithEmployeeAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            var allSuggestions = _configuration
                .GetSection("GoalSuggestions:Suggestions")
                .Get<List<GoalSuggestionDto>>() ?? new List<GoalSuggestionDto>();

            _logger.LogInformation("Loaded {Count} total goal suggestions from config for user {UserId}",
                allSuggestions.Count, userId);

            if (!user.EmployeeId.HasValue)
            {
                throw new ArgumentException("User not found");
            }
            var existingGoalTypes = await _employeeDataRepository
                .GetExistingGoalTypesForEmployeeAsync(user.EmployeeId.Value);


            var relevantSuggestions = allSuggestions
                .Where(s => !existingGoalTypes.Contains(s.GoalType))
                .OrderBy(s => s.Priority switch
                {
                    "High" => 0,
                    "Medium" => 1,
                    _ => 2
                })
                .Take(5)
                .ToList();

            var suggestions = relevantSuggestions.Any()
                ? relevantSuggestions
                : allSuggestions.OrderBy(s => s.Priority switch
                {
                    "High" => 0,
                    "Medium" => 1,
                    _ => 2
                }).Take(3).ToList();

            _logger.LogInformation("Generated {Count} personalized suggestions for user {UserId}",
                suggestions.Count, userId);

            return new GoalSuggestionsResponseDto
            {
                UserId = user.UserId,
                Email = user.Email ?? string.Empty,
                TotalSuggestions = suggestions.Count,
                Suggestions = suggestions
            };
        }

        public async Task<GoalRemindersResponseDto> SendGoalRemindersAsync(SendGoalReminderRequestDto request)
        {
            var sentTo = new List<object>();
            var failedSends = new List<object>();

            if (request.SendType == "single" && request.UserId.HasValue)
            {
                var user = await _employeeDataRepository.GetUserWithEmployeeAsync(request.UserId.Value);
                if (user == null)
                    throw new ArgumentException("User not found");

                var suggestionsResponse = await SuggestGoalsAsync(user.UserId);
                var suggestionTitles = suggestionsResponse.Suggestions
                    .Take(3)
                    .Select(s => s.GoalTitle)
                    .ToList();

                var userName = user.Email?.Split('@')[0] ?? "User";
                var emailSent = await _emailService.SendGoalReminderEmailAsync(
                    user.Email ?? string.Empty,
                    userName,
                    suggestionTitles
                );

                if (emailSent)
                {
                    sentTo.Add(new
                    {
                        userId = user.UserId,
                        email = user.Email,
                        status = "sent",
                        sentAt = DateTime.Now
                    });
                    _logger.LogInformation("Reminder email sent to {Email}", user.Email);
                }
                else
                {
                    failedSends.Add(new
                    {
                        userId = user.UserId,
                        email = user.Email,
                        error = "Email delivery failed"
                    });
                    _logger.LogWarning("Failed to send reminder email to {Email}", user.Email);
                }
            }
            else if (request.SendType == "multiple" && request.UserIds != null && request.UserIds.Any())
            {
                var users = await _employeeDataRepository.GetUsersByIdsAsync(request.UserIds);

                foreach (var user in users)
                {
                    var suggestionsResponse = await SuggestGoalsAsync(user.UserId);
                    var suggestionTitles = suggestionsResponse.Suggestions
                        .Take(3)
                        .Select(s => s.GoalTitle)
                        .ToList();

                    var userName = user.Email?.Split('@')[0] ?? "User";
                    var emailSent = await _emailService.SendGoalReminderEmailAsync(
                        user.Email ?? string.Empty,
                        userName,
                        suggestionTitles
                    );

                    if (emailSent)
                    {
                        sentTo.Add(new
                        {
                            userId = user.UserId,
                            email = user.Email,
                            status = "sent",
                            sentAt = DateTime.Now
                        });
                    }
                    else
                    {
                        failedSends.Add(new
                        {
                            userId = user.UserId,
                            email = user.Email,
                            error = "Email delivery failed"
                        });
                    }
                    await Task.Delay(100);
                }
            }
            else if (request.SendType == "all")
            {
                var usersWithoutGoals = await _employeeDataRepository
                    .GetUsersWithoutGoalsAsync(request.FilterByDays);

                foreach (var user in usersWithoutGoals)
                {
                    var suggestionsResponse = await SuggestGoalsAsync(user.UserId);
                    var suggestionTitles = suggestionsResponse.Suggestions
                        .Take(3)
                        .Select(s => s.GoalTitle)
                        .ToList();

                    var userName = user.Email?.Split('@')[0] ?? "User";
                    var emailSent = await _emailService.SendGoalReminderEmailAsync(
                        user.Email ?? string.Empty,
                        userName,
                        suggestionTitles
                    );

                    if (emailSent)
                    {
                        sentTo.Add(new
                        {
                            userId = user.UserId,
                            email = user.Email,
                            status = "sent",
                            sentAt = DateTime.Now
                        });
                    }
                    else
                    {
                        failedSends.Add(new
                        {
                            userId = user.UserId,
                            email = user.Email,
                            error = "Email delivery failed"
                        });
                    }
                    await Task.Delay(100);
                }
            }

            return new GoalRemindersResponseDto
            {
                TotalSent = sentTo.Count + failedSends.Count,
                Successful = sentTo.Count,
                Failed = failedSends.Count,
                SentTo = sentTo,
                FailedSends = failedSends,
                Message = $"Reminders sent to {sentTo.Count} employee(s), {failedSends.Count} failed"
            };
        }

        // Existing repository methods (unchanged)
        public Task<GoalAdoptionRateDto> GetGoalAdoptionRateAsync()
        {
            return _employeeDataRepository.GetGoalAdoptionRateAsync();
        }

        public Task<GoalStatisticsDto> GetGoalStatisticsAsync()
        {
            return _employeeDataRepository.GetGoalStatisticsAsync();
        }

        public async Task<(List<DepartmentSimpleDto> Departments, string Message)> GetAllDepartmentsAsync()
        {
            var departments = await _employeeDataRepository.GetAllDepartmentsAsync();
            var message = $"Retrieved {departments.Count} departments";
            return (departments, message);
        }

        public Task<DepartmentSimpleDto?> GetDepartmentByIdAsync(int id)
        {
            return _employeeDataRepository.GetDepartmentByIdAsync(id);
        }

        public async Task<List<PolicyResponseDto>> GetPublishedPoliciesAsync(int userId, string userRole)
        {
            _logger.LogInformation("User {UserId} (Role: {Role}) fetching published policies", userId, userRole);
            var response = await _policyService.GetPublishedPoliciesAsync();
            _logger.LogInformation("Returned {Count} published policies to user {UserId}",
                response.Data?.Count ?? 0,
                userId);
            return response.Data ?? new List<PolicyResponseDto>();
        }

        public async Task<PolicyResponseDto> GetPolicyByIdAsync(int policyId, int userId, string userRole)
        {
            _logger.LogInformation("User {UserId} (Role: {Role}) requesting policy {PolicyId}",
                userId, userRole, policyId);

            var response = await _policyService.GetPolicyByIdAsync(policyId);

            if (!response.Success || response.Data == null)
            {
                _logger.LogWarning("Policy {PolicyId} not found for user {UserId}", policyId, userId);
                throw new ArgumentException("Policy not found");
            }

            if (!response.Data.IsPublished)
            {
                _logger.LogWarning("Policy {PolicyId} is not published. Access denied for user {UserId}",
                    policyId, userId);
                throw new ArgumentException("Policy not found or not published");
            }

            _logger.LogInformation("User {UserId} viewed policy {PolicyId}: {PolicyName}",
                userId,
                policyId,
                response.Data.PolicyName);

            return response.Data;
        }
    }
}
