using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Request;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.Constants;

namespace Relevantz.EEPZ.Core.Service
{
    public class InternalOpportunityService : IInternalOpportunityService
    {
        private readonly IInternalOpportunityRepository _opportunityRepository;
        private readonly IMapper _mapper;

        public InternalOpportunityService(IInternalOpportunityRepository opportunityRepository, IMapper mapper)
        {
            _opportunityRepository = opportunityRepository;
            _mapper = mapper;
        }

        public async Task<List<InternalOpportunityResponseDto>> GetAllOpportunitiesSimpleAsync()
        {
            var opportunities = await _opportunityRepository.GetAllAsync();
            return _mapper.Map<List<InternalOpportunityResponseDto>>(opportunities);
        }

        public async Task<List<InternalOpportunityResponseDto>> GetActiveOpportunitiesSimpleAsync()
        {
            var opportunities = await _opportunityRepository.GetActiveAsync();
            return _mapper.Map<List<InternalOpportunityResponseDto>>(opportunities);
        }

        public async Task<InternalOpportunityResponseDto> CreateOpportunityAsync(CreateInternalOpportunityRequestDto request, int createdByUserId)
        {
            var opportunity = new Internalopportunity
            {
                OpportunityName = request.OpportunityName,
                DepartmentId = request.DepartmentId,
                Description = request.Description,
                Requirements = request.Requirements,
                EligibilityCriteria = request.EligibilityCriteria,
                Deadline = request.Deadline,
                Status = request.Status,
                PostedByUserId = createdByUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdOpp = await _opportunityRepository.CreateAsync(opportunity);
            return _mapper.Map<InternalOpportunityResponseDto>(createdOpp);
        }

        public async Task<InternalOpportunityResponseDto> UpdateOpportunityAsync(int id, UpdateInternalOpportunityRequestDto request)
        {
            var opportunity = await _opportunityRepository.GetByIdAsync(id);
            if (opportunity == null)
                throw new KeyNotFoundException(string.Format(ServiceMessageConstants.OpportunityNotFoundById, id));

            if (!string.IsNullOrEmpty(request.OpportunityName))
                opportunity.OpportunityName = request.OpportunityName;

            if (request.DepartmentId.HasValue)
                opportunity.DepartmentId = request.DepartmentId.Value;

            if (!string.IsNullOrEmpty(request.Description))
                opportunity.Description = request.Description;

            if (!string.IsNullOrEmpty(request.Requirements))
                opportunity.Requirements = request.Requirements;

            if (!string.IsNullOrEmpty(request.EligibilityCriteria))
                opportunity.EligibilityCriteria = request.EligibilityCriteria;

            if (request.Deadline.HasValue && request.Deadline != default)
                opportunity.Deadline = request.Deadline.Value;

            if (!string.IsNullOrEmpty(request.Status))
                opportunity.Status = request.Status;

            opportunity.UpdatedAt = DateTime.UtcNow;
            var updatedOpp = await _opportunityRepository.UpdateAsync(opportunity);
            return _mapper.Map<InternalOpportunityResponseDto>(updatedOpp);
        }

        public async Task<InternalOpportunityDetailResponseDto> GetOpportunityByIdAsync(int id)
        {
            var opportunity = await _opportunityRepository.GetByIdAsync(id);
            if (opportunity == null)
                throw new KeyNotFoundException(string.Format(ServiceMessageConstants.OpportunityNotFoundById, id));

            var dto = _mapper.Map<InternalOpportunityDetailResponseDto>(opportunity);
            return dto;
        }

        public async Task<InternalOpportunityListResponseDto> GetAllOpportunitiesAsync(InternalOpportunityFilterRequestDto filter)
        {
            var opportunities = await _opportunityRepository.GetAllAsync();

            if (!string.IsNullOrEmpty(filter.Status))
                opportunities = opportunities.Where(x => x.Status == filter.Status).ToList();

            if (filter.DepartmentId.HasValue)
                opportunities = opportunities.Where(x => x.DepartmentId == filter.DepartmentId).ToList();

            if (!string.IsNullOrEmpty(filter.SearchTerm))
                opportunities = opportunities.Where(x =>
                    x.OpportunityName.Contains(filter.SearchTerm, StringComparison.OrdinalIgnoreCase)).ToList();

            var totalCount = opportunities.Count();
            var pageCount = (int)Math.Ceiling((double)totalCount / filter.PageSize);
            var paginatedList = opportunities
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToList();

            return new InternalOpportunityListResponseDto
            {
                Opportunities = _mapper.Map<List<InternalOpportunityResponseDto>>(paginatedList),
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize,
                TotalPages = pageCount
            };
        }

        public async Task<InternalOpportunityListResponseDto> GetActiveOpportunitiesAsync(InternalOpportunityFilterRequestDto filter)
        {
            var opportunities = await _opportunityRepository.GetActiveAsync();

            if (filter.DepartmentId.HasValue)
                opportunities = opportunities.Where(x => x.DepartmentId == filter.DepartmentId).ToList();

            if (!string.IsNullOrEmpty(filter.SearchTerm))
                opportunities = opportunities.Where(x =>
                    x.OpportunityName.Contains(filter.SearchTerm, StringComparison.OrdinalIgnoreCase)).ToList();

            var totalCount = opportunities.Count();
            var pageCount = (int)Math.Ceiling((double)totalCount / filter.PageSize);
            var paginatedList = opportunities
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToList();

            return new InternalOpportunityListResponseDto
            {
                Opportunities = _mapper.Map<List<InternalOpportunityResponseDto>>(paginatedList),
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize,
                TotalPages = pageCount
            };
        }

        public async Task<InternalOpportunityStatisticsResponseDto> GetStatisticsAsync()
        {
            var allOpportunities = await _opportunityRepository.GetAllAsync();
            var activeCount = await _opportunityRepository.CountByStatusAsync(ServiceMessageConstants.StatusActive);
            var closedCount = await _opportunityRepository.CountByStatusAsync(ServiceMessageConstants.StatusClosed);

            var byDepartment = allOpportunities
                .GroupBy(x => x.Department?.DepartmentName ?? ServiceMessageConstants.UnknownDepartment)
                .ToDictionary(g => g.Key, g => g.Count());

            return new InternalOpportunityStatisticsResponseDto
            {
                TotalOpportunities = allOpportunities.Count,
                ActiveOpportunities = activeCount,
                ClosedOpportunities = closedCount,
                OpportunitiesByDepartment = byDepartment,
                ApplicationsByStatus = new Dictionary<string, int>(),
                Trends = new List<OpportunityTrendDto>()
            };
        }

        public async Task<bool> DeleteOpportunityAsync(int id)
        {
            return await _opportunityRepository.DeleteAsync(id);
        }
    }
}
