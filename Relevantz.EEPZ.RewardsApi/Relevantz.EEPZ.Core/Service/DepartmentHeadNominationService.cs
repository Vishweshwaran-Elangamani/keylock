using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Business.Services.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Business.Services
{
    public class DepartmentHeadNominationService : IDepartmentHeadNominationService
    {
        private readonly IDepartmentHeadNominationRepository _repository;
        private readonly ILogger<DepartmentHeadNominationService> _logger;

        public DepartmentHeadNominationService(
            IDepartmentHeadNominationRepository repository,
            ILogger<DepartmentHeadNominationService> logger
        )
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<object> GetApprovedNominationsByDeptHeadAsync(int deptHeadEmployeeId)
        {
            var deptHeadDetails = await _repository.GetDepartmentHeadDetailsAsync(
                deptHeadEmployeeId
            );

            if (deptHeadDetails == null || deptHeadDetails.Department == null)
            {
                return new
                {
                    success = false,
                    message = $"No department found for Department Head Employee ID {deptHeadEmployeeId}",
                };
            }

            var departmentId = deptHeadDetails.DepartmentId;
            var departmentName = deptHeadDetails.Department.DepartmentName;

            var nominations = await _repository.GetApprovedManagerNominationsAsync();

            var nominationDtos = new List<object>();

            foreach (var n in nominations)
            {
                var opportunity = await _repository.GetOpportunityByIdAsync(n.OpportunityId);

                var nomineeDept = await _repository.GetEmployeeDepartmentDetailsAsync(
                    n.NomineeEmployeeId
                );

                if (nomineeDept?.DepartmentId != departmentId)
                {
                    continue;
                }

                var parameterValues = await _repository.GetNominationParameterValuesAsync(
                    n.NominationId
                );

                nominationDtos.Add(
                    new
                    {
                        n.NominationId,
                        n.OpportunityId,
                        OpportunityName = opportunity?.OpportunityName ?? "Unknown",
                        OpportunityDescription = opportunity?.Description,
                        OpportunityDeadline = opportunity?.Deadline,
                        RewardType = opportunity?.RewardType != null
                            ? new
                            {
                                opportunity.RewardType.RewardTypeId,
                                opportunity.RewardType.RewardName,
                                opportunity.RewardType.RewardCategory,
                            }
                            : null,
                        Nominee = new
                        {
                            EmployeeId = n.NomineeEmployeeId,
                            FullName = $"{n.NomineeEmployee.Userprofile.FirstName} {n.NomineeEmployee.Userprofile.LastName}",
                            FirstName = n.NomineeEmployee.Userprofile.FirstName,
                            LastName = n.NomineeEmployee.Userprofile.LastName,
                            Email = n.NomineeEmployee.Userprofile.PersonalEmail,
                            DepartmentId = nomineeDept?.DepartmentId,
                            DepartmentName = nomineeDept?.Department?.DepartmentName ?? "Unknown",
                        },
                        NominatedBy = new
                        {
                            EmployeeId = n.NominatedByEmployeeId,
                            FullName = $"{n.NominatedByEmployee.Userprofile.FirstName} {n.NominatedByEmployee.Userprofile.LastName}",
                            FirstName = n.NominatedByEmployee.Userprofile.FirstName,
                            LastName = n.NominatedByEmployee.Userprofile.LastName,
                        },
                        ReviewedBy = n.ReviewedByEmployee != null
                            ? new
                            {
                                EmployeeId = n.ReviewedByEmployeeId,
                                FullName = $"{n.ReviewedByEmployee.Userprofile.FirstName} {n.ReviewedByEmployee.Userprofile.LastName}",
                            }
                            : null,
                        n.Justification,
                        n.SubmittedAt,
                        n.ReviewedAt,
                        n.ReviewRemarks,
                        n.Status,
                        ParameterValues = parameterValues,
                    }
                );
            }

            var groupedNominations = nominationDtos
                .GroupBy(n => new
                {
                    ((dynamic)n).OpportunityId,
                    ((dynamic)n).OpportunityName,
                    ((dynamic)n).OpportunityDeadline,
                    ((dynamic)n).RewardType,
                })
                .Select(g => new
                {
                    OpportunityId = g.Key.OpportunityId,
                    OpportunityName = g.Key.OpportunityName,
                    OpportunityDeadline = g.Key.OpportunityDeadline,
                    RewardType = g.Key.RewardType,
                    NominationCount = g.Count(),
                    Nominations = g.ToList(),
                })
                .ToList();

            return new
            {
                success = true,
                deptHeadEmployeeId = deptHeadEmployeeId,
                departmentId = departmentId,
                departmentName = departmentName,
                data = groupedNominations,
                totalNominations = nominationDtos.Count,
                totalOpportunities = groupedNominations.Count,
                message = $"Found {nominationDtos.Count} approved nominations in {departmentName} department",
            };
        }

        public async Task<object> GetNominationDetailsAsync(int nominationId)
        {
            var nomination = await _repository.GetNominationByIdAsync(nominationId);

            if (nomination == null)
            {
                return new { success = false, message = "Approved nomination not found" };
            }

            var opportunity = await _repository.GetOpportunityByIdAsync(nomination.OpportunityId);

            var nomineeDept = await _repository.GetEmployeeDepartmentDetailsAsync(
                nomination.NomineeEmployeeId
            );

            var parameterValues = await _repository.GetNominationParameterValuesAsync(nominationId);

            var result = new
            {
                nomination.NominationId,
                nomination.Status,
                Opportunity = opportunity != null
                    ? new
                    {
                        opportunity.OpportunityId,
                        opportunity.OpportunityName,
                        opportunity.Description,
                        opportunity.Deadline,
                        RewardType = opportunity.RewardType != null
                            ? new
                            {
                                opportunity.RewardType.RewardTypeId,
                                opportunity.RewardType.RewardName,
                                opportunity.RewardType.RewardCategory,
                                opportunity.RewardType.Description,
                            }
                            : null,
                    }
                    : null,
                Nominee = new
                {
                    EmployeeId = nomination.NomineeEmployeeId,
                    FirstName = nomination.NomineeEmployee.Userprofile.FirstName,
                    LastName = nomination.NomineeEmployee.Userprofile.LastName,
                    FullName = $"{nomination.NomineeEmployee.Userprofile.FirstName} {nomination.NomineeEmployee.Userprofile.LastName}",
                    Email = nomination.NomineeEmployee.Userprofile.PersonalEmail,
                    Department = new
                    {
                        DepartmentId = nomineeDept?.DepartmentId,
                        DepartmentName = nomineeDept?.Department?.DepartmentName ?? "Unknown",
                    },
                },
                NominatedBy = new
                {
                    EmployeeId = nomination.NominatedByEmployeeId,
                    FirstName = nomination.NominatedByEmployee.Userprofile.FirstName,
                    LastName = nomination.NominatedByEmployee.Userprofile.LastName,
                    FullName = $"{nomination.NominatedByEmployee.Userprofile.FirstName} {nomination.NominatedByEmployee.Userprofile.LastName}",
                },
                ReviewedBy = nomination.ReviewedByEmployee != null
                    ? new
                    {
                        EmployeeId = nomination.ReviewedByEmployeeId,
                        FirstName = nomination.ReviewedByEmployee.Userprofile.FirstName,
                        LastName = nomination.ReviewedByEmployee.Userprofile.LastName,
                        FullName = $"{nomination.ReviewedByEmployee.Userprofile.FirstName} {nomination.ReviewedByEmployee.Userprofile.LastName}",
                    }
                    : null,
                nomination.Justification,
                nomination.SubmittedAt,
                nomination.ReviewedAt,
                nomination.ReviewRemarks,
                ParameterValues = parameterValues,
            };

            return new { success = true, data = result };
        }

        public async Task<object> GetDepartmentStatisticsAsync(int deptHeadEmployeeId)
        {
            var deptHeadDetails = await _repository.GetDepartmentHeadDetailsAsync(
                deptHeadEmployeeId
            );

            if (deptHeadDetails == null || deptHeadDetails.Department == null)
            {
                return new { success = false, message = "Department not found" };
            }

            var departmentId = deptHeadDetails.DepartmentId;
            var departmentName = deptHeadDetails.Department.DepartmentName;

            var allNominations = await _repository.GetApprovedNominationsAsync();

            var departmentNominations = new List<Recognitionstatus>();

            foreach (var n in allNominations)
            {
                var dept = await _repository.GetEmployeeDepartmentDetailsAsync(n.NomineeEmployeeId);

                if (dept?.DepartmentId == departmentId)
                {
                    departmentNominations.Add(n);
                }
            }

            var nominationsWithDetails =
                new List<(Recognitionstatus nomination, Recognitiondetail opportunity)>();

            foreach (var nom in departmentNominations)
            {
                var opp = await _repository.GetOpportunityByIdAsync(nom.OpportunityId);

                if (opp != null)
                {
                    nominationsWithDetails.Add((nom, opp));
                }
            }

            var totalApproved = nominationsWithDetails.Count;
            var recognitionCount = nominationsWithDetails.Count(x =>
                x.opportunity.RewardType?.RewardCategory == "Recognition"
            );
            var promotionCount = nominationsWithDetails.Count(x =>
                x.opportunity.RewardType?.RewardCategory == "Promotion"
            );

            var byOpportunity = nominationsWithDetails
                .GroupBy(x => x.opportunity.OpportunityName)
                .Select(g => new { OpportunityName = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            return new
            {
                success = true,
                data = new
                {
                    deptHeadEmployeeId,
                    departmentId,
                    departmentName,
                    totalApproved,
                    recognitionCount,
                    promotionCount,
                    byOpportunity,
                },
            };
        }
    }
}
