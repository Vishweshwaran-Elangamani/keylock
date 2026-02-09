using Mapster;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Response.Employees;
using Relevantz.EEPZ.Common.Constants;


namespace Relevantz.EEPZ.Core.Mapping
{
    public static class MapsterConfig
    {
        public static void RegisterMappings()
        {
            MapFeedback();
            MapGoalFeedback();
            MapMentorFeedback();
            MapHRFeedback();
            MapManagerReview();
            MapGoalMappings();
            MapOrgGoalFeedback();
            MapPeerFeedback();
        }

        private static void MapFeedback()
        {
            TypeAdapterConfig<CreateFeedbackRequestDto, Feedback>.NewConfig();
            TypeAdapterConfig<UpdateFeedbackRequestDto, Feedback>.NewConfig();
            TypeAdapterConfig<Feedback, FeedbackResponseDto>.NewConfig();
        }

        private static void MapPeerFeedback()
{
    TypeAdapterConfig<CreatePeerFeedbackRequestDto, Peerfeedbackqueue>.NewConfig()
        .Map(dest => dest.Status, src => PeerFeedbackConstants.Status.Pending);

    TypeAdapterConfig<UpdatePeerFeedbackRequestDto, Peerfeedbackqueue>
        .NewConfig()
        .IgnoreNullValues(true);

    TypeAdapterConfig<Peerfeedbackqueue, PeerFeedbackQueueResponseDto>.NewConfig()
        .Map(dest => dest.SubmitterName,
            src => src.SubmittedByEmployee != null
                ? src.SubmittedByEmployee.EmployeeId.ToString()
                : MessageConstants.AnonymousUser)
        .Map(dest => dest.RecipientName,
            src => src.RecipientEmployee != null
                ? src.RecipientEmployee.EmployeeId.ToString()
                : MessageConstants.UnknownUser)
        .Map(dest => dest.ApprovedByHRName,
            src => src.ApprovedByHr != null
                ? src.ApprovedByHr.EmployeeId.ToString()
                : MessageConstants.UnknownUser);
}


        private static void MapGoalFeedback()
        {
            TypeAdapterConfig<CreateGoalFeedbackRequestDto, Projectgoalfeedback>.NewConfig();
            TypeAdapterConfig<UpdateGoalFeedbackRequestDto, Projectgoalfeedback>.NewConfig();
            TypeAdapterConfig<Projectgoalfeedback, GoalFeedbackResponseDto>.NewConfig();

            TypeAdapterConfig<CreateOrgGoalFeedbackRequestDto, Organizationgoalfeedback>.NewConfig();
            TypeAdapterConfig<UpdateOrgGoalFeedbackRequestDto, Organizationgoalfeedback>.NewConfig();
            TypeAdapterConfig<Organizationgoalfeedback, OrgGoalFeedbackResponseDto>.NewConfig();
        }

        private static void MapMentorFeedback()
{
    TypeAdapterConfig<CreateMentorFeedbackRequestDto, Mentorfeedbacktracking>.NewConfig();

    TypeAdapterConfig<UpdateMentorFeedbackRequestDto, Mentorfeedbacktracking>
        .NewConfig()
        .IgnoreNullValues(true);

    TypeAdapterConfig<Mentorfeedbacktracking, MentorFeedbackResponseDto>.NewConfig()

        .Map(dest => dest.MentorName,
            src => src.MentorEmployee != null
                ? src.MentorEmployee.EmployeeId.ToString()
                : MessageConstants.UnknownUser)

        .Map(dest => dest.MenteeName,
            src => src.MenteeEmployee != null
                ? src.MenteeEmployee.EmployeeId.ToString()
                : MessageConstants.UnknownUser)

        .Map(dest => dest.SkillName,
            src => src.SkillIdReferenceNavigation != null
                ? src.SkillIdReferenceNavigation.SkillName
                : MessageConstants.UnknownUser);
}



        private static void MapHRFeedback()
        {
            TypeAdapterConfig<CreateHRFeedbackFormRequestDto, Hrfeedbackform>.NewConfig();
            TypeAdapterConfig<UpdateHRFormRequestDto, Hrfeedbackform>.NewConfig();
            TypeAdapterConfig<Hrfeedbackform, HrFeedbackFormResponseDto>.NewConfig();
        }

        private static void MapManagerReview()
        {
            TypeAdapterConfig<CreateManagerReviewRequestDto, Review>.NewConfig();
            TypeAdapterConfig<UpdateManagerReviewRequestDto, Review>.NewConfig();
            TypeAdapterConfig<Review, ManagerReviewResponseDto>.NewConfig();
        }

        private static void MapGoalMappings()
{
    TypeAdapterConfig<Goal, ProjectGoalResponseDto>.NewConfig()
        .Map(dest => dest.ProjectName, src => src.Project.ProjectName)
        .Map(dest => dest.CreatedBy, src => src.CreatedByNavigation);

    TypeAdapterConfig<Employeedetailsmaster, EmployeeBasicInfoDto>.NewConfig()
        .Map(dest => dest.EmployeeCompanyId, src => src.Employee.EmployeeCompanyId)
        .Map(dest => dest.FirstName, src => src.Employee.Userprofile.FirstName)
        .Map(dest => dest.LastName, src => src.Employee.Userprofile.LastName)
        .Map(dest => dest.Email, src => src.Employee.Userauthentication.Email)
        .Map(dest => dest.RoleName, src => src.Role.RoleName)
        .Map(dest => dest.DepartmentName, src => src.Department.DepartmentName);
}

private static void MapOrgGoalFeedback()
{
    TypeAdapterConfig<CreateOrgGoalFeedbackRequestDto, Feedback>.NewConfig()
        .Map(dest => dest.RelatedGoalId, src => src.GoalId)
        .Map(dest => dest.Comments, src => src.FeedbackComments)
        .Map(dest => dest.SubmittedByEmployeeId, src => src.IsAnonymous ? (int?)null : src.SubmittedByEmployeeId)
        .Map(dest => dest.FeedbackType, src => FeedbackConstants.Type.OrganizationalGoal)
        .Map(dest => dest.Status, src => FeedbackConstants.Status.Submitted);

    TypeAdapterConfig<UpdateOrgGoalFeedbackRequestDto, Feedback>
        .NewConfig()
        .IgnoreNullValues(true)
        .Map(dest => dest.Comments, src => src.FeedbackComments);

    TypeAdapterConfig<Feedback, OrgGoalFeedbackResponseDto>.NewConfig()
        .Map(dest => dest.OrgGoalFeedbackId, src => src.FeedbackId)
        .Map(dest => dest.GoalId, src => src.RelatedGoalId ?? 0)
        .Map(dest => dest.OrganizationGoalName, src => src.RelatedGoal != null ? src.RelatedGoal.GoalTitle : null)
        .Map(dest => dest.GoalDescription, src => src.RelatedGoal != null ? src.RelatedGoal.GoalDescription : null)
        .Map(dest => dest.GoalType, src => src.RelatedGoal != null ? src.RelatedGoal.GoalType : null)
        .Map(dest => dest.SubmitterName,
            src => src.IsAnonymous
                ? MessageConstants.AnonymousUser
                : (src.SubmittedByEmployee != null
                    ? src.SubmittedByEmployee.EmployeeId.ToString()
                    : MessageConstants.UnknownUser))
        .Map(dest => dest.RecipientName,
            src => src.RecipientEmployee != null
                ? src.RecipientEmployee.EmployeeId.ToString()
                : MessageConstants.UnknownUser);
}

    }
}
