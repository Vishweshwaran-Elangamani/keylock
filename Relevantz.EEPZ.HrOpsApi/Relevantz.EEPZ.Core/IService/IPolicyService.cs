using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IPolicyService
    {
        Task<ApiResponseDto<PolicyResponseDto>> CreatePolicyAsync(CreatePolicyRequestDto request, int createdByUserId);
        Task<ApiResponseDto<List<PolicyResponseDto>>> GetAllPoliciesAsync();
        Task<ApiResponseDto<List<PolicyResponseDto>>> GetActivePoliciesAsync();
        Task<ApiResponseDto<List<PolicyResponseDto>>> GetInactivePoliciesAsync();
        Task<ApiResponseDto<List<PolicyResponseDto>>> GetPublishedPoliciesAsync(); //  NEW
        Task<ApiResponseDto<List<PolicyResponseDto>>> GetDraftPoliciesAsync(); //  NEW
        Task<ApiResponseDto<PolicyResponseDto>> GetPolicyByIdAsync(int policyId);
        Task<ApiResponseDto<PolicyResponseDto>> UpdatePolicyAsync(int policyId, UpdatePolicyRequestDto request);
        Task<ApiResponseDto<bool>> DeletePolicyAsync(int policyId);
        Task<ApiResponseDto<PolicyResponseDto>> UnpublishPolicyAsync(int policyId, int userId);
        Task<ApiResponseDto<string>> PublishPolicyAsync(int policyId, int publishedBy); //  NEW
    }
}
