using Mapster;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Entities;

public class ManagerReviewMapping : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<CreateManagerReviewRequestDto, Managerreviewcomment>()
            .Map(dest => dest.ManagerEmployeeId, src => src.ManagerEmployeeId)
            .Map(dest => dest.TargetEmployeeId, src => src.TargetEmployeeId)
            .Map(dest => dest.TargetGoalId, src => src.TargetGoalId)
            .Map(dest => dest.TargetOrganizationGoalId, src => src.TargetOrganizationGoalId)
            .Map(dest => dest.Rating, src => src.Rating)
            .Map(dest => dest.ReviewComment, src => src.ReviewComment);
    }
}
