using Mapster;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Entities;

public class PeerFeedbackMapping : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<CreatePeerFeedbackRequestDto, Peerfeedback>()
            .Map(dest => dest.SubmittedByEmployeeId, src => src.SubmittedByEmployeeId)
            .Map(dest => dest.PeerEmployeeId, src => src.RecipientEmployeeId)
            .Map(dest => dest.Comments, src => src.FeedbackContent)
            .Map(dest => dest.IsAnonymous, src => src.IsAnonymous);
    }
}
