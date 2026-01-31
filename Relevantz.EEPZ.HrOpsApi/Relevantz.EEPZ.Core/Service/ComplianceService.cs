using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Core.Service
{
    public class ComplianceService : IComplianceService
    {
        private readonly IPolicyRepository _policyRepository;
        private readonly IViolationRepository _violationRepository;

        public ComplianceService(
            IPolicyRepository policyRepository,
            IViolationRepository violationRepository)
        {
            _policyRepository = policyRepository;
            _violationRepository = violationRepository;
        }

        public async Task<ApiResponseDto<ComplianceOverviewDto>> GetComplianceOverviewAsync()
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching compliance overview metrics");

                var totalPolicies = await _policyRepository.GetTotalPoliciesCountAsync();
                var activePolicies = await _policyRepository.GetActivePoliciesCountAsync();
                var totalViolations = await _violationRepository.GetTotalViolationsCountAsync();
                var activeViolations = await _violationRepository.GetActiveViolationsCountAsync();
                var resolvedViolations = await _violationRepository.GetResolvedViolationsCountAsync();

                var overview = new ComplianceOverviewDto
                {
                    TotalPolicies = totalPolicies,
                    ActivePolicies = activePolicies,
                    InactivePolicies = totalPolicies - activePolicies,
                    TotalViolations = totalViolations,
                    ActiveViolations = activeViolations,
                    ResolvedViolations = resolvedViolations,
                    ComplianceRate = totalViolations > 0
                        ? ((double)(totalViolations - activeViolations) / totalViolations) * 100
                        : 100
                };

                EEPZBusinessLog.LogServiceInformation("Compliance overview calculated: Total Policies={TotalPolicies}, Active Violations={ActiveViolations}, Compliance Rate={ComplianceRate}%", 
                    totalPolicies, activeViolations, overview.ComplianceRate);

                return ApiResponseDto<ComplianceOverviewDto>.SuccessResponse(overview);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching compliance overview", ex);
                throw;
            }
        }
    }
}
