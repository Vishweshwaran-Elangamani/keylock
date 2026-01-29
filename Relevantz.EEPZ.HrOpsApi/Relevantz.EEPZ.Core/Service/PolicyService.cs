using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
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
    if (await _policyRepository.PolicyNameExistsAsync(request.PolicyName))
    {
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

    _logger.LogInformation(
        PolicyMessages.LogPolicyCreated,
        createdPolicy.PolicyName,
        createdPolicy.PolicyId,
        createdByUserId);

    // Fetch complete entity with navigation properties
    var fullPolicy = await _policyRepository.GetPolicyByIdAsync(createdPolicy.PolicyId);
    
    // Map to response DTO using Mapster
    var response = _mapper.Map<PolicyResponseDto>(fullPolicy);

    return ApiResponseDto<PolicyResponseDto>.SuccessResponse(
        response,
        PolicyMessages.PolicyCreatedSuccess);
}



        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetAllPoliciesAsync()
        {
            var policies = await _policyRepository.GetAllPoliciesAsync();
            
            // Map list using Mapster
            var response = _mapper.Map<List<PolicyResponseDto>>(policies);

            return ApiResponseDto<List<PolicyResponseDto>>
                .SuccessResponse(response);
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetActivePoliciesAsync()
        {
            var policies = await _policyRepository.GetActivePoliciesAsync();
            
            // Map using Mapster
            var response = _mapper.Map<List<PolicyResponseDto>>(policies);

            return ApiResponseDto<List<PolicyResponseDto>>
                .SuccessResponse(response);
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetInactivePoliciesAsync()
        {
            var policies = await _policyRepository.GetInactivePoliciesAsync();
            
            // Map using Mapster
            var response = _mapper.Map<List<PolicyResponseDto>>(policies);

            return ApiResponseDto<List<PolicyResponseDto>>
                .SuccessResponse(response);
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetPublishedPoliciesAsync()
        {
            var policies = await _policyRepository.GetPublishedPoliciesAsync();
            
            // Map using Mapster
            var response = _mapper.Map<List<PolicyResponseDto>>(policies);

            return ApiResponseDto<List<PolicyResponseDto>>
                .SuccessResponse(response);
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetDraftPoliciesAsync()
        {
            var policies = await _policyRepository.GetDraftPoliciesAsync();
            
            // Map using Mapster
            var response = _mapper.Map<List<PolicyResponseDto>>(policies);

            return ApiResponseDto<List<PolicyResponseDto>>
                .SuccessResponse(response);
        }

        public async Task<ApiResponseDto<PolicyResponseDto>> GetPolicyByIdAsync(int policyId)
        {
            var policy = await _policyRepository.GetPolicyByIdAsync(policyId);

            if (policy == null)
            {
                return ApiResponseDto<PolicyResponseDto>
                    .ErrorResponse(PolicyMessages.PolicyNotFound);
            }

            // Map using Mapster
            var response = _mapper.Map<PolicyResponseDto>(policy);

            return ApiResponseDto<PolicyResponseDto>
                .SuccessResponse(response);
        }

        public async Task<ApiResponseDto<PolicyResponseDto>> UpdatePolicyAsync(
            int policyId,
            UpdatePolicyRequestDto request)
        {
            var policy = await _policyRepository.GetPolicyByIdAsync(policyId);

            if (policy == null)
            {
                return ApiResponseDto<PolicyResponseDto>
                    .ErrorResponse(PolicyMessages.PolicyNotFound);
            }

            if (!string.IsNullOrEmpty(request.PolicyName) &&
                request.PolicyName != policy.PolicyName &&
                await _policyRepository.PolicyNameExistsAsync(request.PolicyName, policyId))
            {
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

            _logger.LogInformation(
                PolicyMessages.LogPolicyUpdated,
                updatedPolicy.PolicyName,
                updatedPolicy.PolicyId);

            // Map to response using Mapster
            var response = _mapper.Map<PolicyResponseDto>(updatedPolicy);

            return ApiResponseDto<PolicyResponseDto>.SuccessResponse(
                response,
                PolicyMessages.PolicyUpdatedSuccess);
        }

        public async Task<ApiResponseDto<string>> PublishPolicyAsync(int policyId, int publishedBy)
        {
            var policy = await _policyRepository.GetPolicyByIdAsync(policyId);

            if (policy == null)
                return ApiResponseDto<string>.ErrorResponse(PolicyMessages.PolicyNotFound);

            if (policy.IsPublished)
                return ApiResponseDto<string>.ErrorResponse(PolicyMessages.PolicyAlreadyPublished);

            policy.IsPublished = true;
            policy.PublishedAt = DateTime.Now;
            policy.PublishedBy = publishedBy;
            policy.UpdatedAt = DateTime.Now;

            await _policyRepository.UpdatePolicyAsync(policy);

            _logger.LogInformation(
                PolicyMessages.LogPolicyPublished,
                policy.PolicyName,
                policy.PolicyId,
                publishedBy);

            return ApiResponseDto<string>.SuccessResponse(
                PolicyMessages.PolicyCreatedSuccess,
                PolicyMessages.PolicyPublishedSuccess);
        }

        public async Task<ApiResponseDto<bool>> DeletePolicyAsync(int policyId)
        {
            var result = await _policyRepository.DeletePolicyAsync(policyId);

            if (!result)
                return ApiResponseDto<bool>.ErrorResponse(PolicyMessages.PolicyNotFound);

            _logger.LogInformation(PolicyMessages.LogPolicyDeleted, policyId);

            return ApiResponseDto<bool>.SuccessResponse(
                true,
                PolicyMessages.PolicyDeletedSuccess);
        }

        public async Task<ApiResponseDto<PolicyResponseDto>> UnpublishPolicyAsync(
            int policyId,
            int userId)
        {
            var policy = await _policyRepository.GetPolicyByIdAsync(policyId);

            if (policy == null)
                return ApiResponseDto<PolicyResponseDto>
                    .ErrorResponse(PolicyMessages.PolicyNotFound);

            policy.IsPublished = false;
            policy.PublishedAt = null;
            policy.PublishedBy = null;
            policy.UpdatedAt = DateTime.Now;

            await _policyRepository.UpdatePolicyAsync(policy);

            _logger.LogInformation(
                PolicyMessages.LogPolicyUnpublished,
                policyId);

            // Map using Mapster
            var response = _mapper.Map<PolicyResponseDto>(policy);

            return ApiResponseDto<PolicyResponseDto>.SuccessResponse(
                response,
                PolicyMessages.PolicyUnpublishedSuccess);
        }
    }
}
