using Mapster;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Mappings
{
    public class LnDHRMapsterConfig : IRegister
    {
        public void Register(TypeAdapterConfig config)
        {
            // Employee Skills Mapping
            config.NewConfig<Lndemployeeskillmapper, EmployeeSkillResponseModel>()
                .Map(dest => dest.EmployeeName, src => 
                    $"{src.Employee.Userprofile.FirstName} {src.Employee.Userprofile.LastName}")
                .Map(dest => dest.SkillName, src => src.Skill.SkillName)
                .Map(dest => dest.CanBecomeSme, src => src.Rating >= LnDConstants.MIN_SME_RATING)
                .Map(dest => dest.IsSme, src => 
                    src.Skill.Lndsmes.Any(s => s.EmployeeId == src.EmployeeId && s.IsActive == true));

            // Assignment Mapping
            config.NewConfig<Lndassignment, AssignmentResponseModel>()
                .Map(dest => dest.MenteeEmployeeId, src => 
                    src.MenteeEmployee != null ? src.MenteeEmployee.EmployeeId : 0)
                .Map(dest => dest.SkillId, src => 
                    src.Skill != null ? src.Skill.SkillId : 0)
                .Map(dest => dest.SmeId, src => 
                    src.Sme != null ? src.Sme.SmeId : 0)
                .Map(dest => dest.SmeEmployeeId, src => 
                    src.Sme != null && src.Sme.Employee != null ? src.Sme.Employee.EmployeeId : 0)
                .Map(dest => dest.SkillName, src => src.Skill.SkillName)
                .Map(dest => dest.MenteeName, src => 
                    $"{src.MenteeEmployee.Userprofile.FirstName} {src.MenteeEmployee.Userprofile.LastName}")
                .Map(dest => dest.SmeName, src => 
                    $"{src.Sme.Employee.Userprofile.FirstName} {src.Sme.Employee.Userprofile.LastName}")
                .Map(dest => dest.IsOverdue, src => CalculateIsOverdue(src))
                .Map(dest => dest.DaysOverdue, src => CalculateDaysOverdue(src));
        }

        private static bool CalculateIsOverdue(Lndassignment assignment)
        {
            var today = DateTime.Now.Date;
            var deadlineDate = assignment.Deadline?.Date;
            var isCompleted = assignment.Status == LnDConstants.ASSIGNMENT_STATUS.COMPLETED;
            
            return deadlineDate.HasValue && deadlineDate.Value < today && !isCompleted;
        }

        private static int? CalculateDaysOverdue(Lndassignment assignment)
        {
            var today = DateTime.Now.Date;
            var deadlineDate = assignment.Deadline?.Date;
            var isCompleted = assignment.Status == LnDConstants.ASSIGNMENT_STATUS.COMPLETED;
            
            var isOverdue = deadlineDate.HasValue && deadlineDate.Value < today && !isCompleted;
            
            return isOverdue && deadlineDate.HasValue 
                ? (int)(today - deadlineDate.Value).TotalDays 
                : null;
        }
    }
}
