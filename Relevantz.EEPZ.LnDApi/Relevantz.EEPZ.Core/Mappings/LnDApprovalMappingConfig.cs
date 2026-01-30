using Mapster;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Mappings
{
    public class LnDApprovalMappingConfig : IRegister
    {
        public void Register(TypeAdapterConfig config)
        {
            // Mapping from Lndapproval to ApprovalDetailsResponseModel
            config.NewConfig<Lndapproval, ApprovalDetailsResponseModel>()
                .Map(dest => dest.ApprovalId, src => src.ApprovalId)
                .Map(dest => dest.ApprovalType, src => src.ApprovalType)
                .Map(dest => dest.AssignmentId, src => src.AssignmentId)
                .Map(dest => dest.SkillId, src => src.SkillId)
                .Map(dest => dest.SkillName, src => src.Skill != null ? src.Skill.SkillName : null)
                .Map(dest => dest.RequesterEmployeeId, src => src.RequesterEmployeeId)
                .Map(dest => dest.RequesterName,
                    src => $"{src.RequesterEmployee.Userprofile.FirstName} {src.RequesterEmployee.Userprofile.LastName}")
                .Map(dest => dest.RequesterEmail, src => src.RequesterEmployee.Userprofile.PersonalEmail)
                .Map(dest => dest.ApproverEmployeeId, src => src.ApproverEmployeeId)
                .Map(dest => dest.ApproverName,
                    src => src.ApproverEmployee != null
                        ? $"{src.ApproverEmployee.Userprofile.FirstName} {src.ApproverEmployee.Userprofile.LastName}"
                        : null)
                .Map(dest => dest.ApproverEmail, src => src.ApproverEmployee != null ? src.ApproverEmployee.Userprofile.PersonalEmail : null)
                .Map(dest => dest.Status, src => src.Status)
                .Map(dest => dest.Notes, src => src.Notes)
                .Map(dest => dest.RequestedOn, src => src.RequestedOn)
                .Map(dest => dest.UpdatedOn, src => src.UpdatedOn)
                .Map(dest => dest.AttachmentId, src => src.AttachmentId)
                .Map(dest => dest.AttachmentFileName, src => src.Attachment != null ? src.Attachment.FileName : null)
                .Map(dest => dest.AttachmentFilePath, src => src.Attachment != null ? src.Attachment.FilePath : null)
                .Map(dest => dest.AttachmentFileSize, src => src.Attachment != null ? src.Attachment.FileSize : null)
                .Map(dest => dest.AttachmentType, src => src.Attachment != null ? src.Attachment.AttachmentType : null)
                .Map(dest => dest.Assignment, src => src.Assignment);

            // Mapping from Lndassignment to AssignmentDetailsResponseModel (nested)
            config.NewConfig<Lndassignment, AssignmentDetailsResponseModel>()
                .Map(dest => dest.AssignmentId, src => src.AssignmentId)
                .Map(dest => dest.MenteeName,
                    src => $"{src.MenteeEmployee.Userprofile.FirstName} {src.MenteeEmployee.Userprofile.LastName}")
                .Map(dest => dest.SmeName,
                    src => $"{src.Sme.Employee.Userprofile.FirstName} {src.Sme.Employee.Userprofile.LastName}")
                .Map(dest => dest.SkillName, src => src.Skill.SkillName)
                .Map(dest => dest.Deadline, src => src.Deadline)
                .Map(dest => dest.Status, src => src.Status)
                .Map(dest => dest.ProofFilePath, src => src.ProofFilePath)
                .Map(dest => dest.CompletionNotes, src => src.CompletionNotes)
                .Map(dest => dest.CompletionRating, src => src.CompletionRating);

            // Mapping for creating Lndsme from Lndapproval (SME Registration)
            config.NewConfig<Lndapproval, Lndsme>()
                .Ignore(dest => dest.SmeId)
                .Ignore(dest => dest.EmployeeId)
                .Ignore(dest => dest.SkillId)
                .Ignore(dest => dest.AttachmentId)
                .Ignore(dest => dest.ApprovedByEmployeeId)
                .Ignore(dest => dest.ApprovedOn)
                .Ignore(dest => dest.CreatedOn)
                .Ignore(dest => dest.IsActive)
                .Ignore(dest => dest.Employee)
                .Ignore(dest => dest.Skill)
                .Ignore(dest => dest.Attachment)
                .Ignore(dest => dest.ApprovedByEmployee)
                .Ignore(dest => dest.Lndassignments);

            // Mapping for cloning Lndapproval (for manager approval creation)
            config.NewConfig<Lndapproval, Lndapproval>()
                .Ignore(dest => dest.ApprovalId)
                .Ignore(dest => dest.ApprovalType)
                .Ignore(dest => dest.AssignmentId)
                .Ignore(dest => dest.SkillId)
                .Ignore(dest => dest.AttachmentId)
                .Ignore(dest => dest.RequesterEmployeeId)
                .Ignore(dest => dest.ApproverEmployeeId)
                .Ignore(dest => dest.Status)
                .Ignore(dest => dest.Notes)
                .Ignore(dest => dest.RequestedOn)
                .Ignore(dest => dest.UpdatedOn)
                .Ignore(dest => dest.RequesterEmployee)
                .Ignore(dest => dest.ApproverEmployee)
                .Ignore(dest => dest.Assignment)
                .Ignore(dest => dest.Attachment)
                .Ignore(dest => dest.Skill);
        }
    }
}
