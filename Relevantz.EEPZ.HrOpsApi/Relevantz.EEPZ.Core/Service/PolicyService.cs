using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Microsoft.EntityFrameworkCore;
using MapsterMapper;
using Mapster;

namespace Relevantz.EEPZ.Core.Service
{
    public class PolicyService : IPolicyService
    {
        private readonly IPolicyRepository _policyRepository;
        private readonly ILogger<PolicyService> _logger;
        private readonly IMapper _mapper;

        public PolicyService(
            IPolicyRepository policyRepository,
            ILogger<PolicyService> logger,
            IMapper mapper)
        {
            _policyRepository = policyRepository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResponseDto<PolicyResponseDto>> CreatePolicyAsync(
            CreatePolicyRequestDto request,
            int createdByUserId)
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Creating policy: {PolicyName}, CreatedBy: {UserId}",
                    request.PolicyName, createdByUserId);

                if (await _policyRepository.PolicyNameExistsAsync(request.PolicyName))
                {
                    EEPZBusinessLog.LogServiceWarning("Policy name already exists: {PolicyName}", request.PolicyName);
                    return ApiResponseDto<PolicyResponseDto>
                        .ErrorResponse(PolicyMessages.PolicyNameExists);
                }

                var policy = _mapper.Map<Organizationalpolicy>(request);
                policy.CreatedByUserId = createdByUserId;
                policy.CreatedAt = DateTime.Now;
                policy.IsPublished = false;
                policy.Status = request.Status ?? "Draft";

                if (!string.IsNullOrEmpty(request.DocumentUrl))
                {
                    policy.DocumentUploadedAt = DateTime.Now;
                }

                var createdPolicy = await _policyRepository.CreatePolicyAsync(policy);

                var fullPolicy = await _policyRepository.GetPolicyByIdAsync(createdPolicy.PolicyId);
                var response = _mapper.Map<PolicyResponseDto>(fullPolicy);

                EEPZBusinessLog.LogServiceInformation("Policy created successfully: PolicyId={PolicyId}, Name={PolicyName}, CreatedBy={UserId}",
                    createdPolicy.PolicyId, createdPolicy.PolicyName, createdByUserId);

                return ApiResponseDto<PolicyResponseDto>.SuccessResponse(
                    response,
                    PolicyMessages.PolicyCreatedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error creating policy {PolicyName}", ex, request.PolicyName);
                throw;
            }
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetAllPoliciesAsync()
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching all policies");

                var policies = await _policyRepository.GetAllPoliciesAsync();
                var response = _mapper.Map<List<PolicyResponseDto>>(policies);

                EEPZBusinessLog.LogServiceInformation("Retrieved {Count} policies", response.Count);

                return ApiResponseDto<List<PolicyResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching all policies", ex);
                throw;
            }
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetActivePoliciesAsync()
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching active policies");

                var policies = await _policyRepository.GetActivePoliciesAsync();
                var response = _mapper.Map<List<PolicyResponseDto>>(policies);

                EEPZBusinessLog.LogServiceInformation("Retrieved {Count} active policies", response.Count);

                return ApiResponseDto<List<PolicyResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching active policies", ex);
                throw;
            }
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetInactivePoliciesAsync()
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching inactive policies");

                var policies = await _policyRepository.GetInactivePoliciesAsync();
                var response = _mapper.Map<List<PolicyResponseDto>>(policies);

                EEPZBusinessLog.LogServiceInformation("Retrieved {Count} inactive policies", response.Count);

                return ApiResponseDto<List<PolicyResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching inactive policies", ex);
                throw;
            }
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetPublishedPoliciesAsync()
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching published policies");

                var policies = await _policyRepository.GetPublishedPoliciesAsync();
                var response = _mapper.Map<List<PolicyResponseDto>>(policies);

                EEPZBusinessLog.LogServiceInformation("Retrieved {Count} published policies", response.Count);

                return ApiResponseDto<List<PolicyResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching published policies", ex);
                throw;
            }
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetDraftPoliciesAsync()
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching draft policies");

                var policies = await _policyRepository.GetDraftPoliciesAsync();
                var response = _mapper.Map<List<PolicyResponseDto>>(policies);

                EEPZBusinessLog.LogServiceInformation("Retrieved {Count} draft policies", response.Count);

                return ApiResponseDto<List<PolicyResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching draft policies", ex);
                throw;
            }
        }

        public async Task<ApiResponseDto<PolicyResponseDto>> GetPolicyByIdAsync(int policyId)
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching policy {PolicyId}", policyId);

                var policy = await _policyRepository.GetPolicyByIdAsync(policyId);

                if (policy == null)
                {
                    EEPZBusinessLog.LogServiceWarning("Policy {PolicyId} not found", policyId);
                    return ApiResponseDto<PolicyResponseDto>
                        .ErrorResponse(PolicyMessages.PolicyNotFound);
                }

                var response = _mapper.Map<PolicyResponseDto>(policy);

                EEPZBusinessLog.LogServiceInformation("Policy {PolicyId} retrieved successfully", policyId);

                return ApiResponseDto<PolicyResponseDto>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching policy {PolicyId}", ex, policyId);
                throw;
            }
        }

        public async Task<ApiResponseDto<PolicyResponseDto>> UpdatePolicyAsync(
            int policyId,
            UpdatePolicyRequestDto request)
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Updating policy {PolicyId}", policyId);

                var policy = await _policyRepository.GetPolicyByIdAsync(policyId);

                if (policy == null)
                {
                    EEPZBusinessLog.LogServiceWarning("Policy {PolicyId} not found for update", policyId);
                    return ApiResponseDto<PolicyResponseDto>
                        .ErrorResponse(PolicyMessages.PolicyNotFound);
                }

                if (!string.IsNullOrEmpty(request.PolicyName) &&
                    request.PolicyName != policy.PolicyName &&
                    await _policyRepository.PolicyNameExistsAsync(request.PolicyName, policyId))
                {
                    EEPZBusinessLog.LogServiceWarning("Policy name {PolicyName} already exists", request.PolicyName);
                    return ApiResponseDto<PolicyResponseDto>
                        .ErrorResponse(PolicyMessages.PolicyNameExists);
                }

                if (!string.IsNullOrEmpty(request.PolicyName))
                    policy.PolicyName = request.PolicyName;

                if (!string.IsNullOrEmpty(request.Category))
                    policy.Category = request.Category;

                if (request.Description != null)
                    policy.Description = request.Description;

                if (request.ComplianceGuidance != null)
                    policy.ComplianceGuidance = request.ComplianceGuidance;

                if (!string.IsNullOrEmpty(request.Status))
                    policy.Status = request.Status;

                if (!string.IsNullOrEmpty(request.DocumentUrl))
                {
                    policy.DocumentUrl = request.DocumentUrl;
                    policy.DocumentName = request.DocumentName;
                    policy.DocumentType = request.DocumentType;
                    policy.DocumentSize = request.DocumentSize;
                    policy.DocumentUploadedAt = DateTime.Now;
                }

                policy.UpdatedAt = DateTime.Now;

                var updatedPolicy = await _policyRepository.UpdatePolicyAsync(policy);

                var response = _mapper.Map<PolicyResponseDto>(updatedPolicy);

                EEPZBusinessLog.LogServiceInformation("Policy {PolicyId} updated successfully: {PolicyName}",
                    policyId, updatedPolicy.PolicyName);

                return ApiResponseDto<PolicyResponseDto>.SuccessResponse(
                    response,
                    PolicyMessages.PolicyUpdatedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error updating policy {PolicyId}", ex, policyId);
                throw;
            }
        }

        public async Task<ApiResponseDto<string>> PublishPolicyAsync(int policyId, int publishedBy)
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Publishing policy {PolicyId} by user {UserId}", policyId, publishedBy);

                var policy = await _policyRepository.GetPolicyByIdAsync(policyId);

                if (policy == null)
                {
                    EEPZBusinessLog.LogServiceWarning("Policy {PolicyId} not found for publishing", policyId);
                    return ApiResponseDto<string>.ErrorResponse(PolicyMessages.PolicyNotFound);
                }

                if (policy.IsPublished)
                {
                    EEPZBusinessLog.LogServiceWarning("Policy {PolicyId} is already published", policyId);
                    return ApiResponseDto<string>.ErrorResponse(PolicyMessages.PolicyAlreadyPublished);
                }

                policy.IsPublished = true;
                policy.PublishedAt = DateTime.Now;
                policy.PublishedBy = publishedBy;
                policy.UpdatedAt = DateTime.Now;

                await _policyRepository.UpdatePolicyAsync(policy);

                EEPZBusinessLog.LogServiceInformation("Policy {PolicyId} published successfully: {PolicyName}, PublishedBy: {UserId}",
                    policyId, policy.PolicyName, publishedBy);

                return ApiResponseDto<string>.SuccessResponse(
                    PolicyMessages.PolicyCreatedSuccess,
                    PolicyMessages.PolicyPublishedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error publishing policy {PolicyId}", ex, policyId);
                throw;
            }
        }

        public async Task<ApiResponseDto<bool>> DeletePolicyAsync(int policyId)
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Deleting policy {PolicyId}", policyId);

                var result = await _policyRepository.DeletePolicyAsync(policyId);

                if (!result)
                {
                    EEPZBusinessLog.LogServiceWarning("Policy {PolicyId} not found for deletion", policyId);
                    return ApiResponseDto<bool>.ErrorResponse(PolicyMessages.PolicyNotFound);
                }

                EEPZBusinessLog.LogServiceInformation("Policy {PolicyId} deleted successfully", policyId);

                return ApiResponseDto<bool>.SuccessResponse(
                    true,
                    PolicyMessages.PolicyDeletedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error deleting policy {PolicyId}", ex, policyId);
                throw;
            }
        }

        public async Task<ApiResponseDto<PolicyResponseDto>> UnpublishPolicyAsync(
            int policyId,
            int userId)
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Unpublishing policy {PolicyId} by user {UserId}", policyId, userId);

                var policy = await _policyRepository.GetPolicyByIdAsync(policyId);

                if (policy == null)
                {
                    EEPZBusinessLog.LogServiceWarning("Policy {PolicyId} not found for unpublishing", policyId);
                    return ApiResponseDto<PolicyResponseDto>
                        .ErrorResponse(PolicyMessages.PolicyNotFound);
                }

                policy.IsPublished = false;
                policy.PublishedAt = null;
                policy.PublishedBy = null;
                policy.UpdatedAt = DateTime.Now;

                await _policyRepository.UpdatePolicyAsync(policy);

                var response = _mapper.Map<PolicyResponseDto>(policy);

                EEPZBusinessLog.LogServiceInformation("Policy {PolicyId} unpublished successfully: {PolicyName}",
                    policyId, policy.PolicyName);

                return ApiResponseDto<PolicyResponseDto>.SuccessResponse(
                    response,
                    PolicyMessages.PolicyUnpublishedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error unpublishing policy {PolicyId}", ex, policyId);
                throw;
            }
        }
    }
}
