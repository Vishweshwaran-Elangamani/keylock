using AutoMapper;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Response;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Response;
using Relevantz.EEPZ.Common.ViewModels.Promotion.Response;

namespace Relevantz.EEPZ.Core.Service
{
    public class InternalOpportunitiesMappingProfile : Profile
    {
        public InternalOpportunitiesMappingProfile()
        {
            // Internal Opportunity Mappings
            CreateMap<Internalopportunity, InternalOpportunityResponseDto>()
                .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department.DepartmentName))
                .ForMember(dest => dest.PostedByName, opt => opt.MapFrom(src => src.PostedByUser.Email));

            CreateMap<Internalopportunity, InternalOpportunityDetailResponseDto>()
                .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department.DepartmentName))
                .ForMember(dest => dest.PostedByName, opt => opt.MapFrom(src => src.PostedByUser.Email));

            // Nomination Mappings
            CreateMap<Nomination, NominationResponseDto>()
                .ForMember(dest => dest.OpportunityName, opt => opt.MapFrom(src => src.Opportunity.OpportunityName))
                .ForMember(dest => dest.NomineeName, opt => opt.MapFrom(src => src.NomineeUser.Email))
                .ForMember(dest => dest.NominatedByName, opt => opt.MapFrom(src => src.NominatedByUser.Email))
                .ForMember(dest => dest.ReviewedByName, opt => opt.MapFrom(src => src.ReviewedByUser.Email));

            CreateMap<Nomination, NominationDetailResponseDto>()
                .ForMember(dest => dest.OpportunityName, opt => opt.MapFrom(src => src.Opportunity.OpportunityName))
                .ForMember(dest => dest.NomineeName, opt => opt.MapFrom(src => src.NomineeUser.Email))
                .ForMember(dest => dest.NominatedByName, opt => opt.MapFrom(src => src.NominatedByUser.Email));

            CreateMap<Nominationreviewmetric, NominationReviewMetricResponseDto>()
                .ForMember(dest => dest.ReviewedByName, opt => opt.MapFrom(src => src.ReviewedByUser.Email));

            // Promotion Mappings
            CreateMap<Promotion, PromotionResponseDto>()
    .ForMember(dest => dest.EmployeeName, opt => opt.MapFrom(src => src.EmployeeUser.Email ?? "N/A"))
    .ForMember(dest => dest.OpportunityName, opt => opt.MapFrom(src => 
        src.Nomination != null && src.Nomination.Opportunity != null 
            ? src.Nomination.Opportunity.OpportunityName 
            : "N/A"))
    .ForMember(dest => dest.NominationType, opt => opt.MapFrom(src => 
        src.Nomination != null ? src.Nomination.NominationType : null));

            CreateMap<Promotion, PromotionDetailResponseDto>()
                .ForMember(dest => dest.EmployeeName, opt => opt.MapFrom(src => src.EmployeeUser.Email))
                .ForMember(dest => dest.EmployeeEmail, opt => opt.MapFrom(src => src.EmployeeUser.Email))
                .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department.DepartmentName))
                .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedByUser.Email));

            CreateMap<Promotionhistory, PromotionHistoryResponseDto>()
                .ForMember(dest => dest.EmployeeName, opt => opt.MapFrom(src => src.EmployeeUser.Email));
        }
    }
}
