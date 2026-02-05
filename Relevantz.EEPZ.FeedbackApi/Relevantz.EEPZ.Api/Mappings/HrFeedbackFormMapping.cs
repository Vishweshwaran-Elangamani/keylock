using Mapster;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Entities;

public class HrFeedbackFormMapping : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<CreateHRFeedbackFormRequestDto, Hrfeedbackform>()
            .Map(dest => dest.FormName, src => src.FormName)
            .Map(dest => dest.FormDescription, src => src.FormDescription)
            .Map(dest => dest.FormType, src => src.FormType)
            .Map(dest => dest.CreatedByHrid, src => src.CreatedByHRId)
            .Map(dest => dest.Deadline, src => src.Deadline);
    }
}
