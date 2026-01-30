using Mapster;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using System.Linq;

namespace Relevantz.EEPZ.Core.Mappings
{
    public class LnDSmeMappingConfig : IRegister
    {
        public void Register(TypeAdapterConfig config)
        {
            // Lndsme -> SmeResponseModel
            config.NewConfig<Lndsme, SmeResponseModel>()
                .Map(dest => dest.SmeId, src => src.SmeId)
                .Map(dest => dest.EmployeeId, src => src.EmployeeId)
                .Map(dest => dest.EmployeeName, 
                    src => $"{src.Employee.Userprofile.FirstName} {src.Employee.Userprofile.LastName}")
                .Map(dest => dest.SkillId, src => src.SkillId)
                .Map(dest => dest.SkillName, src => src.Skill.SkillName)
                .Map(dest => dest.IsActive, src => src.IsActive ?? true)
                .Map(dest => dest.ApprovedOn, src => src.ApprovedOn)
                // InProgressAssignments requires async call, so ignore in mapping and set post-process
                .Ignore(dest => dest.InProgressAssignments);
        }
    }
}
