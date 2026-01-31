using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Core.Services
{
    public class ManagerNominationService : IManagerNominationService
    {
        private readonly IManagerNominationRepository _repository;
        private readonly ILogger<ManagerNominationService> _logger;

        public ManagerNominationService(
            IManagerNominationRepository repository,
            ILogger<ManagerNominationService> logger
        )
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<object> GetRewardTypesAsync()
        {
            _logger.LogInformation("[GET_REWARD_TYPES] Fetching visible reward types for manager nominations");

            var rewardTypes = await _repository.GetVisibleRewardTypesAsync();

            var result = rewardTypes
                .Select(rt => new
                {
                    rt.RewardTypeId,
                    rt.RewardCategory,
                    rt.RewardName,
                    rt.Description,
                    rt.IsActive,
                })
                .ToList();

            _logger.LogInformation($"[GET_REWARD_TYPES] Found {result.Count} visible reward types");

            return new
            {
                success = true,
                data = result,
                message = $"Found {result.Count} visible reward types",
            };
        }

        public async Task<object> GetOpportunitiesAsync()
        {
            _logger.LogInformation("[GET_OPPORTUNITIES] Fetching all active opportunities");

            var opportunities = await _repository.GetActiveOpportunitiesAsync();

            var result = new List<object>();
            foreach (var o in opportunities)
            {
                var rewardType = await _repository.GetRewardTypeByIdAsync(o.RewardTypeId);
                var department = await _repository.GetDepartmentByIdAsync(o.DepartmentId);

                result.Add(new
                {
                    o.OpportunityId,
                    o.OpportunityName,
                    o.Description,
                    o.Deadline,
                    o.Requirements,
                    o.EligibilityCriteria,
                    RewardType = rewardType != null
                        ? new
                        {
                            rewardType.RewardTypeId,
                            rewardType.RewardCategory,
                            rewardType.RewardName,
                        }
                        : null,
                    Department = department != null
                        ? new { department.DepartmentId, department.DepartmentName }
                        : null,
                });
            }

            _logger.LogInformation($"[GET_OPPORTUNITIES] Found {result.Count} active opportunities");

            return new
            {
                success = true,
                data = result,
                message = $"Found {result.Count} active opportunities",
            };
        }

        public async Task<object> GetOpportunitiesByRewardTypeAsync(int rewardTypeId)
        {
            _logger.LogInformation($"[GET_OPPORTUNITIES_BY_REWARD] Fetching opportunities for Reward Type: {rewardTypeId}");

            var validationRewardType = await _repository.GetVisibleRewardTypeByIdAsync(rewardTypeId);

            if (validationRewardType == null)
            {
                return new
                {
                    success = false,
                    message = "Reward type not available for manager nominations",
                };
            }

            var opportunities = await _repository.GetActiveOpportunitiesByRewardTypeAsync(rewardTypeId);

            var result = new List<object>();
            foreach (var o in opportunities)
            {
                var rewardType = await _repository.GetRewardTypeByIdAsync(o.RewardTypeId);

                result.Add(new
                {
                    o.OpportunityId,
                    o.OpportunityName,
                    o.Description,
                    o.Deadline,
                    RewardTypeName = rewardType?.RewardName ?? "Unknown",
                });
            }

            _logger.LogInformation($"[GET_OPPORTUNITIES_BY_REWARD] Found {result.Count} opportunities for Reward Type {rewardTypeId}");

            return new
            {
                success = true,
                data = result,
                message = $"Found {result.Count} opportunities",
            };
        }

        public async Task<object> GetNominationParametersAsync(int rewardTypeId)
        {
            _logger.LogInformation($"[GET_PARAMETERS] Fetching parameters for Reward Type: {rewardTypeId}");

            var parameters = await _repository.GetParametersByRewardTypeAsync(rewardTypeId);

            var result = parameters
                .Select(p => new
                {
                    p.ParameterId,
                    p.ParameterName,
                    p.ParameterType,
                    p.IsRequired,
                    p.PlaceholderText,
                    p.MinimumValue,
                    p.MaximumValue,
                    p.SortOrder,
                })
                .ToList();

            _logger.LogInformation($"[GET_PARAMETERS] Found {result.Count} parameters for Reward Type {rewardTypeId}");

            return new
            {
                success = true,
                data = result,
                message = $"Found {result.Count} parameters",
            };
        }

        public async Task<object> GetTeamMembersAsync(int managerId)
        {
            _logger.LogInformation($"[GET_TEAM_MEMBERS] Fetching team members for Manager ID: {managerId}");

            var managerProjectsAsL1 = await _repository.GetManagerL1ProjectIdsAsync(managerId);

            _logger.LogInformation($"[GET_TEAM_MEMBERS] Manager {managerId} is L1 on {managerProjectsAsL1.Count} projects");

            if (!managerProjectsAsL1.Any())
            {
                _logger.LogInformation($"[GET_TEAM_MEMBERS] No L1 projects found for Manager {managerId}");
                return new
                {
                    success = true,
                    data = new List<object>(),
                    message = "No team members found. You must be an L1 manager on a project to nominate employees.",
                };
            }

            var allManagerIds = await _repository.GetAllManagerEmployeeIdsAsync();

            _logger.LogInformation($"[GET_TEAM_MEMBERS] Found {allManagerIds.Count} employees who are managers/approvers");

            var teamMembers = await _repository.GetTeamMembersByProjectIdsAsync(managerProjectsAsL1, allManagerIds);

            _logger.LogInformation($"[GET_TEAM_MEMBERS] Found {teamMembers.Count} regular employees for Manager {managerId}");

            return new
            {
                success = true,
                data = teamMembers,
                message = $"Found {teamMembers.Count} team members",
            };
        }

        public async Task<object> SubmitNominationAsync(NominationSubmitDto dto)
        {
            _logger.LogInformation($"[SUBMIT_NOMINATION] Submitting nomination for Employee {dto.NomineeEmployeeId}");

            if (dto.NomineeEmployeeId <= 0 || dto.NominatedByEmployeeId <= 0)
                return new { success = false, message = "Invalid employee IDs" };

            if (string.IsNullOrEmpty(dto.Justification))
                return new { success = false, message = "Justification is required" };

            if (dto.RewardTypeId == null || dto.RewardTypeId <= 0)
                return new { success = false, message = "Reward Type is required" };

            var isL1Manager = await _repository.IsL1ManagerAsync(dto.NominatedByEmployeeId);

            if (!isL1Manager)
            {
                _logger.LogWarning($"[SUBMIT_NOMINATION] Employee {dto.NominatedByEmployeeId} is not an L1 manager on any project");
                return new
                {
                    success = false,
                    statusCode = 403,
                    message = "Only L1 managers can submit nominations",
                };
            }

            var managerProjectsAsL1 = await _repository.GetManagerL1ProjectIdsAsync(dto.NominatedByEmployeeId);

            var nomineeInManagerProjects = await _repository.IsNomineeInManagerProjectsAsync(dto.NomineeEmployeeId, managerProjectsAsL1);

            if (!nomineeInManagerProjects)
            {
                _logger.LogWarning($"[SUBMIT_NOMINATION] Nominee {dto.NomineeEmployeeId} is not in manager's L1 projects");
                return new
                {
                    success = false,
                    statusCode = 403,
                    message = "You can only nominate employees from projects where you are L1 manager",
                };
            }

            var rewardType = await _repository.GetVisibleRewardTypeByIdAsync(dto.RewardTypeId.Value);

            if (rewardType == null)
                return new
                {
                    success = false,
                    message = "Invalid reward type or not available for manager nominations",
                };

            _logger.LogInformation($"[SUBMIT_NOMINATION] Reward Type: {rewardType.RewardName} (Visible: {rewardType.IsVisibleForManagerNomination})");

            var existingNomination = await _repository.GetExistingNominationAsync(dto.NomineeEmployeeId, dto.RewardTypeId.Value);

            if (existingNomination != null)
            {
                _logger.LogWarning($"[SUBMIT_NOMINATION] Employee {dto.NomineeEmployeeId} already nominated for RewardType {dto.RewardTypeId}");

                // ✅ CRITICAL CHANGE: return 200 OK with success=false (old UI contract)
                return new
                {
                    success = false,
                    message = $"This employee has already been nominated for {rewardType.RewardName}. Please select a different award.",
                    data = new
                    {
                        existingNominationId = existingNomination.NominationId,
                        rewardTypeName = rewardType.RewardName
                    }
                };
            }

            var defaultOpportunity = await _repository.GetDefaultOpportunityAsync(dto.RewardTypeId.Value);

            int opportunityId;

            if (defaultOpportunity == null)
            {
                _logger.LogInformation($"[SUBMIT_NOMINATION] Creating default opportunity for RewardType {dto.RewardTypeId}");

                defaultOpportunity = await _repository.CreateDefaultOpportunityAsync(dto.RewardTypeId.Value, rewardType.RewardName);

                opportunityId = defaultOpportunity.OpportunityId;
                _logger.LogInformation($"[SUBMIT_NOMINATION] Default opportunity created: {opportunityId}");
            }
            else
            {
                opportunityId = defaultOpportunity.OpportunityId;
            }

            var recognitionstatus = new Recognitionstatus
            {
                OpportunityId = opportunityId,
                NomineeEmployeeId = dto.NomineeEmployeeId,
                NominationType = "ManagerNomination",
                NominatedByEmployeeId = dto.NominatedByEmployeeId,
                Justification = dto.Justification,
                Status = "Pending",
                SubmittedAt = DateTime.UtcNow,
                ReviewRemarks = $"DirectManagerNomination|RewardType:{dto.RewardTypeId}|User-Submitted",
            };

            await _repository.AddRecognitionStatusAsync(recognitionstatus);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"[SUBMIT_NOMINATION] Nomination created: {recognitionstatus.NominationId}");

            if (dto.ParameterValues != null && dto.ParameterValues.Any())
            {
                var uniqueParams = dto.ParameterValues.GroupBy(p => p.ParameterId).Select(g => g.First()).ToList();

                foreach (var param in uniqueParams)
                {
                    if (param.ParameterId <= 0)
                        continue;

                    var parameterExists = await _repository.ParameterExistsAsync(param.ParameterId, dto.RewardTypeId.Value);
                    if (!parameterExists)
                        continue;

                    var existingParamValue = await _repository.GetExistingParameterValueAsync(recognitionstatus.NominationId, param.ParameterId);

                    if (existingParamValue != null)
                    {
                        existingParamValue.ParameterValue = param.Value ?? "";
                        existingParamValue.CreatedAt = DateTime.UtcNow;
                        await _repository.UpdateParameterValueAsync(existingParamValue);
                    }
                    else
                    {
                        var paramValue = new Nominationparametervalue
                        {
                            NominationId = recognitionstatus.NominationId,
                            ParameterId = param.ParameterId,
                            ParameterValue = param.Value ?? "",
                            CreatedAt = DateTime.UtcNow,
                        };

                        await _repository.AddParameterValueAsync(paramValue);
                    }
                }

                await _repository.SaveChangesAsync();
            }

            var tracking = new Nominationvisibilitytracking
            {
                NominationId = recognitionstatus.NominationId,
                ViewedByEmployeeId = dto.NominatedByEmployeeId,
                ActionTaken = "Submitted",
                ViewedAt = DateTime.UtcNow,
            };

            await _repository.AddNominationTrackingAsync(tracking);
            await _repository.SaveChangesAsync();

            return new
            {
                success = true,
                data = new { nominationId = recognitionstatus.NominationId },
                message = "Nomination submitted successfully",
            };
        }

        public async Task<object> GetEmployeeNominationsAsync(int employeeId)
        {
            _logger.LogInformation($"[GET_EMPLOYEE_NOMINATIONS] Fetching nominations for Employee {employeeId}");

            var nominations = await _repository.GetNominationsByEmployeeIdAsync(employeeId);

            var result = nominations
                .Select(n => new
                {
                    n.NominationId,
                    n.Status,
                    n.SubmittedAt,
                    RewardTypeId = n.Opportunity.RewardTypeId,
                    RewardTypeName = n.Opportunity.RewardType.RewardName,
                    OpportunityName = n.Opportunity.OpportunityName,
                })
                .ToList();

            _logger.LogInformation($"[GET_EMPLOYEE_NOMINATIONS] Found {result.Count} nominations for Employee {employeeId}");

            return new
            {
                success = true,
                data = result,
                message = $"Found {result.Count} existing nominations",
            };
        }

        public async Task<object> GetMyNominationsAsync(int managerId)
        {
            _logger.LogInformation($"[GET_MY_NOMINATIONS] Fetching nominations for Manager {managerId}");

            var nominations = await _repository.GetNominationsByManagerIdAsync(managerId);

            _logger.LogInformation($"[GET_MY_NOMINATIONS] Found {nominations.Count} nominations for Manager {managerId}");

            var result = new List<object>();
            foreach (var n in nominations)
            {
                var opportunity = await _repository.GetOpportunityByIdAsync(n.OpportunityId);

                var rewardType =
                    opportunity != null
                        ? await _repository.GetRewardTypeByIdAsync(opportunity.RewardTypeId)
                        : null;

                var nomineeEmployee = await _repository.GetEmployeeByIdAsync(n.NomineeEmployeeId);

                var userProfile =
                    nomineeEmployee != null
                        ? await _repository.GetUserProfileByEmployeeIdAsync(nomineeEmployee.EmployeeId)
                        : null;

                var dept = await _repository.GetEmployeeDetailsAsync(n.NomineeEmployeeId);

                result.Add(new
                {
                    n.NominationId,
                    n.Status,
                    n.Justification,
                    n.SubmittedAt,
                    n.ReviewedAt,
                    n.ReviewRemarks,
                    RewardTypeId = opportunity?.RewardTypeId,
                    Nominee = new
                    {
                        EmployeeId = nomineeEmployee?.EmployeeId ?? 0,
                        FirstName = userProfile?.FirstName ?? "Unknown",
                        LastName = userProfile?.LastName ?? "",
                        DepartmentName = dept?.Department?.DepartmentName ?? "Unknown",
                        Department = dept?.Department != null
                            ? new
                            {
                                DepartmentId = dept.Department.DepartmentId,
                                DepartmentName = dept.Department.DepartmentName,
                            }
                            : null,
                    },
                    Opportunity = new
                    {
                        OpportunityName = opportunity?.OpportunityName ?? "Unknown",
                        Deadline = opportunity?.Deadline,
                        RewardType = rewardType?.RewardName ?? "Unknown",
                    },
                });
            }

            return new
            {
                success = true,
                data = result,
                message = $"Found {result.Count} nominations",
            };
        }

        public async Task<object> GetNominationDetailsAsync(int nominationId)
        {
            _logger.LogInformation($"[GET_NOMINATION_DETAILS] Fetching details for Nomination {nominationId}");

            var nomination = await _repository.GetNominationByIdAsync(nominationId);

            if (nomination == null)
            {
                _logger.LogWarning($"[GET_NOMINATION_DETAILS] Nomination {nominationId} not found");
                return new { success = false, message = "Nomination not found" };
            }

            var opportunity = await _repository.GetOpportunityByIdAsync(nomination.OpportunityId);

            var rewardType =
                opportunity != null
                    ? await _repository.GetRewardTypeByIdAsync(opportunity.RewardTypeId)
                    : null;

            var nomineeEmployee = await _repository.GetEmployeeByIdAsync(nomination.NomineeEmployeeId);

            var nomineeProfile =
                nomineeEmployee != null
                    ? await _repository.GetUserProfileByEmployeeIdAsync(nomineeEmployee.EmployeeId)
                    : null;

            var nominatorEmployee = await _repository.GetEmployeeByIdAsync(nomination.NominatedByEmployeeId);

            var nominatorProfile =
                nominatorEmployee != null
                    ? await _repository.GetUserProfileByEmployeeIdAsync(nominatorEmployee.EmployeeId)
                    : null;

            var parameterValues = await _repository.GetParameterValuesByNominationIdAsync(nominationId);

            var parameterResults = new List<object>();
            foreach (var pv in parameterValues)
            {
                var parameter = await _repository.GetParameterByIdAsync(pv.ParameterId);

                if (parameter != null)
                {
                    parameterResults.Add(new
                    {
                        parameter.ParameterId,
                        parameter.ParameterName,
                        parameter.ParameterType,
                        pv.ParameterValue,
                    });
                }
            }

            var result = new
            {
                nomination.NominationId,
                nomination.Status,
                nomination.Justification,
                nomination.SubmittedAt,
                nomination.ReviewedAt,
                nomination.ReviewRemarks,
                Nominee = new
                {
                    EmployeeId = nomineeEmployee?.EmployeeId ?? 0,
                    FirstName = nomineeProfile?.FirstName ?? "Unknown",
                    LastName = nomineeProfile?.LastName ?? "",
                    Email = nomineeProfile?.PersonalEmail ?? "",
                },
                NominatedBy = new
                {
                    FirstName = nominatorProfile?.FirstName ?? "Unknown",
                    LastName = nominatorProfile?.LastName ?? "",
                },
                Opportunity = new
                {
                    OpportunityName = opportunity?.OpportunityName ?? "Unknown",
                    Description = opportunity?.Description ?? "",
                    RewardType = rewardType?.RewardName ?? "Unknown",
                },
                ParameterValues = parameterResults,
            };

            _logger.LogInformation($"[GET_NOMINATION_DETAILS] Nomination {nominationId} details retrieved with {parameterResults.Count} parameters");

            return new { success = true, data = result };
        }
    }
}
