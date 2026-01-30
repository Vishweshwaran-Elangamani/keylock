using Mapster;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using System.Linq;

namespace Relevantz.EEPZ.Core.Mappings
{
    public class LnDEmployeeSkillMappingConfig : IRegister
    {
        public void Register(TypeAdapterConfig config)
        {
            // Employee -> SubordinateEmployeeResponseModel
            config.NewConfig<Employee, SubordinateEmployeeResponseModel>()
                .Map(dest => dest.EmployeeId, src => src.EmployeeId)
                .Map(dest => dest.EmployeeName, 
                    src => $"{src.Userprofile.FirstName} {src.Userprofile.LastName}")
                .Map(dest => dest.Email, src => src.Userauthentication.Email)
                .Map(dest => dest.DepartmentName, 
                    src => src.Employeedetailsmasters.FirstOrDefault() != null 
                        ? src.Employeedetailsmasters.FirstOrDefault().Department.DepartmentName 
                        : null);

            // Lndemployeeskillmapper -> EmployeeSkillResponseModel
            config.NewConfig<Lndemployeeskillmapper, EmployeeSkillResponseModel>()
                .Map(dest => dest.MapperId, src => src.MapperId)
                .Map(dest => dest.EmployeeId, src => src.EmployeeId)
                .Map(dest => dest.EmployeeName, 
                    src => $"{src.Employee.Userprofile.FirstName} {src.Employee.Userprofile.LastName}")
                .Map(dest => dest.SkillId, src => src.SkillId)
                .Map(dest => dest.SkillName, src => src.Skill.SkillName)
                .Map(dest => dest.Rating, src => src.Rating)
                .Map(dest => dest.CreatedOn, src => src.CreatedOn)
                .Map(dest => dest.UpdatedOn, src => src.UpdatedOn)
                .Map(dest => dest.CanBecomeSme, src => src.Rating >= LnDConstants.MIN_SME_RATING)
                .Map(dest => dest.IsSme, 
                    src => src.Skill.Lndsmes.Any(s => s.EmployeeId == src.EmployeeId && s.IsActive == true));
        }
    }
}
