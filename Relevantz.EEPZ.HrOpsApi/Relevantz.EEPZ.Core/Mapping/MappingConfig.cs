using System;
using System.Reflection;
using Mapster;
using MapsterMapper;
using Microsoft.Extensions.DependencyInjection;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Mapping
{
    public static class MappingConfig
    {
        public static void RegisterMapsterConfiguration(this IServiceCollection services)
        {
            var config = TypeAdapterConfig.GlobalSettings;

            // Scan current assembly for any [AdaptTo]/[AdaptFrom] etc (if you use them)
            config.Scan(Assembly.GetExecutingAssembly());

            config.Default.PreserveReference(true);
            config.Default.MaxDepth(3);

            RegisterBudgetMappings(config);
            RegisterPolicyMappings(config);
            RegisterViolationMappings(config);
            RegisterSlaEscalationMappings(config);
            RegisterEmployeeMappings(config);
            RegisterDepartmentMappings(config);

            services.AddSingleton(config);
            services.AddScoped<IMapper, Mapper>();
        }

        private static void RegisterBudgetMappings(TypeAdapterConfig config)
        {
            config.NewConfig<Departmentbudget, CostMappingResponseDto>()
                .Map(dest => dest.BudgetId, src => src.BudgetId)
                .Map(dest => dest.DepartmentId, src => src.DepartmentId)
                .Map(dest => dest.DepartmentName, src => src.Department != null ? src.Department.DepartmentName : "Unknown")
                .Map(dest => dest.FiscalYear, src => src.FiscalYear)
                .Map(dest => dest.TotalBudget, src => src.TotalBudget)
                .Map(dest => dest.AllocatedAmount, src => src.AllocatedAmount ?? 0)
                .Map(dest => dest.UtilizedAmount, src => src.UtilizedAmount ?? 0)
                .Map(dest => dest.UtilizationPercentage, src => src.UtilizationPercentage ?? 0)
                .Map(dest => dest.Headcount, src => src.Headcount ?? 0)
                .Map(dest => dest.AvgCostPerEmployee, src => src.AvgCostPerEmployee ?? 0)
                .Map(dest => dest.CreatedAt, src => src.CreatedAt)
                .Map(dest => dest.UpdatedAt, src => src.UpdatedAt);

            config.NewConfig<CreateCostMappingRequestDto, Departmentbudget>()
                .Map(dest => dest.DepartmentId, src => src.DepartmentId)
                .Map(dest => dest.FiscalYear, src => src.FiscalYear)
                .Map(dest => dest.TotalBudget, src => src.TotalBudget)
                .Map(dest => dest.Headcount, src => src.Headcount)
                .Map(dest => dest.AllocatedAmount, src => 0)
                .Map(dest => dest.UtilizedAmount, src => 0)
                .Map(dest => dest.UtilizationPercentage, src => 0)
                .Map(dest => dest.AvgCostPerEmployee, src =>
                    src.Headcount.HasValue && src.Headcount.Value > 0
                        ? src.TotalBudget / src.Headcount.Value
                        : 0)
                .Map(dest => dest.CreatedAt, src => DateTime.Now)
                .Ignore(dest => dest.UpdatedAt)
                .Ignore(dest => dest.BudgetId)
                .Ignore(dest => dest.Department)
                .Ignore(dest => dest.Budgetallocations)
                .Ignore(dest => dest.Budgetperiodallocations);

            config.NewConfig<Budgetperiodallocation, PeriodAllocationResponseDto>()
                .Map(dest => dest.PeriodAllocationId, src => src.PeriodAllocationId)
                .Map(dest => dest.BudgetId, src => src.BudgetId)
                .Map(dest => dest.DepartmentId, src => src.Budget != null ? src.Budget.DepartmentId : 0)
                .Map(dest => dest.DepartmentName, src =>
                    src.Budget != null && src.Budget.Department != null
                        ? src.Budget.Department.DepartmentName
                        : "Unknown")
                .Map(dest => dest.Period, src => src.Period)
                .Map(dest => dest.PeriodYear, src => src.PeriodYear)
                .Map(dest => dest.AllocatedAmount, src => src.AllocatedAmount)
                .Map(dest => dest.UtilizedAmount, src => src.UtilizedAmount)
                .Map(dest => dest.UtilizationPercentage, src => src.UtilizationPercentage)
                .Map(dest => dest.AllocatedByUserId, src => src.AllocatedByUserId)
                .Map(dest => dest.AllocatedByEmail, src => src.AllocatedByUser != null ? src.AllocatedByUser.Email : "Unknown")
                .Map(dest => dest.AllocatedAt, src => src.AllocatedAt)
                .Map(dest => dest.UpdatedAt, src => src.UpdatedAt)
                .Map(dest => dest.Notes, src => src.Notes)
                .Map(dest => dest.RemainingAmount, src => src.AllocatedAmount - src.UtilizedAmount)
                .Map(dest => dest.SubAllocationCount, src => 0);

            config.NewConfig<CreatePeriodAllocationDto, Budgetperiodallocation>()
                .Map(dest => dest.BudgetId, src => src.BudgetId)
                .Map(dest => dest.Period, src => src.Period)
                .Map(dest => dest.PeriodYear, src => src.PeriodYear)
                .Map(dest => dest.AllocatedAmount, src => src.AllocatedAmount)
                .Map(dest => dest.AllocatedByUserId, src => src.AllocatedByUserId)
                .Map(dest => dest.Notes, src => src.Notes)
                .Map(dest => dest.UtilizedAmount, src => 0)
                .Map(dest => dest.UtilizationPercentage, src => 0)
                .Map(dest => dest.AllocatedAt, src => DateTime.Now)
                .Ignore(dest => dest.UpdatedAt)
                .Ignore(dest => dest.PeriodAllocationId)
                .Ignore(dest => dest.Budget)
                .Ignore(dest => dest.AllocatedByUser);

            config.NewConfig<Budgetallocation, FundAllocationResponseDto>()
                .Map(dest => dest.AllocationId, src => src.AllocationId)
                .Map(dest => dest.BudgetId, src => src.BudgetId.HasValue ? src.BudgetId.Value : 0)
                .Map(dest => dest.DepartmentId, src => src.DepartmentId)
                .Map(dest => dest.DepartmentName, src => src.Department != null ? src.Department.DepartmentName : "Unknown")
                .Map(dest => dest.EmployeeUserId, src => src.EmployeeUserId)
                .Map(dest => dest.EmployeeEmail, src => src.EmployeeUser != null ? src.EmployeeUser.Email : null)
                .Map(dest => dest.AllocationType, src => src.AllocationType)
                .Map(dest => dest.Amount, src => src.Amount)
                .Map(dest => dest.GoalStatus, src => src.GoalStatus)
                .Map(dest => dest.Notes, src => src.Notes)
                .Map(dest => dest.AllocatedByUserId, src => src.AllocatedByUserId)
                .Map(dest => dest.AllocatedByEmail, src => src.AllocatedByUser != null ? src.AllocatedByUser.Email : "Unknown")
                .Map(dest => dest.AllocatedAt, src => src.AllocatedAt)
                .Map(dest => dest.UtilizedAmount, src => src.UtilizedAmount ?? 0)
                .Map(dest => dest.UtilizationPercentage, src => src.UtilizationPercentage ?? 0)
                .Map(dest => dest.UpdatedAt, src => src.UpdatedAt)
                .Map(dest => dest.Period, src => src.Period)
                .Map(dest => dest.PeriodYear, src => src.PeriodYear);

            config.NewConfig<CreateFundAllocationRequestDto, Budgetallocation>()
                .Map(dest => dest.BudgetId, src => src.BudgetId)
                .Map(dest => dest.DepartmentId, src => src.DepartmentId)
                .Map(dest => dest.EmployeeUserId, src => src.EmployeeUserId)
                .Map(dest => dest.AllocationType, src => src.AllocationType)
                .Map(dest => dest.Amount, src => src.Amount)
                .Map(dest => dest.GoalStatus, src => src.GoalStatus)
                .Map(dest => dest.Notes, src => src.Notes)
                .Map(dest => dest.AllocatedByUserId, src => src.AllocatedByUserId)
                .Map(dest => dest.Period, src => src.Period)
                .Map(dest => dest.PeriodYear, src => src.PeriodYear)
                .Map(dest => dest.UtilizedAmount, src => 0)
                .Map(dest => dest.UtilizationPercentage, src => 0)
                .Map(dest => dest.AllocatedAt, src => DateTime.Now)
                .Ignore(dest => dest.UpdatedAt)
                .Ignore(dest => dest.AllocationId)
                .Ignore(dest => dest.Budget)
                .Ignore(dest => dest.Department)
                .Ignore(dest => dest.AllocatedByUser)
                .Ignore(dest => dest.EmployeeUser);
        }

        private static void RegisterPolicyMappings(TypeAdapterConfig config)
        {
            config.NewConfig<Organizationalpolicy, PolicyResponseDto>()
                .Map(dest => dest.PolicyId, src => src.PolicyId)
                .Map(dest => dest.PolicyName, src => src.PolicyName)
                .Map(dest => dest.Category, src => src.Category)
                .Map(dest => dest.Description, src => src.Description)
                .Map(dest => dest.ComplianceGuidance, src => src.ComplianceGuidance)
                .Map(dest => dest.Status, src => src.Status)
                .Map(dest => dest.CreatedByUserId, src => src.CreatedByUserId)
                .Map(dest => dest.CreatedByEmail, src => src.CreatedByUser != null ? src.CreatedByUser.Email : null)
                .Map(dest => dest.CreatedAt, src => src.CreatedAt)
                .Map(dest => dest.UpdatedAt, src => src.UpdatedAt)
                .Map(dest => dest.ViolationsCount, src => src.Policyviolations != null ? src.Policyviolations.Count : 0)
                .Map(dest => dest.DocumentUrl, src => src.DocumentUrl)
                .Map(dest => dest.DocumentName, src => src.DocumentName)
                .Map(dest => dest.DocumentType, src => src.DocumentType)
                .Map(dest => dest.DocumentSize, src => src.DocumentSize)
                .Map(dest => dest.DocumentSizeFormatted, src => FormatFileSize(src.DocumentSize))
                .Map(dest => dest.DocumentUploadedAt, src => src.DocumentUploadedAt)
                .Map(dest => dest.IsPublished, src => src.IsPublished)
                .Map(dest => dest.PublishedAt, src => src.PublishedAt)
                .Map(dest => dest.PublishedBy, src => src.PublishedBy)
                .Map(dest => dest.PublishedByEmail, src => src.PublishedByNavigation != null ? src.PublishedByNavigation.Email : null);

            config.NewConfig<CreatePolicyRequestDto, Organizationalpolicy>()
                .Map(dest => dest.PolicyName, src => src.PolicyName)
                .Map(dest => dest.Category, src => src.Category)
                .Map(dest => dest.Description, src => src.Description)
                .Map(dest => dest.ComplianceGuidance, src => src.ComplianceGuidance)
                .Map(dest => dest.Status, src => !string.IsNullOrEmpty(src.Status) ? src.Status : "Draft")
                .Map(dest => dest.DocumentUrl, src => src.DocumentUrl)
                .Map(dest => dest.DocumentName, src => src.DocumentName)
                .Map(dest => dest.DocumentType, src => src.DocumentType)
                .Map(dest => dest.DocumentSize, src => src.DocumentSize)
                .Map(dest => dest.DocumentUploadedAt, src => src.DocumentSize.HasValue ? DateTime.Now : (DateTime?)null)
                .Map(dest => dest.IsPublished, src => false)
                .Map(dest => dest.CreatedAt, src => DateTime.Now)
                .Ignore(dest => dest.PolicyId)
                .Ignore(dest => dest.CreatedByUserId)
                .Ignore(dest => dest.UpdatedAt)
                .Ignore(dest => dest.PublishedAt)
                .Ignore(dest => dest.PublishedBy)
                .Ignore(dest => dest.CreatedByUser)
                .Ignore(dest => dest.PublishedByNavigation)
                .Ignore(dest => dest.Policyviolations);
        }

        private static void RegisterViolationMappings(TypeAdapterConfig config)
        {
            config.NewConfig<Policyviolation, ViolationResponseDto>()
                .Map(dest => dest.ViolationId, src => src.ViolationId)
                .Map(dest => dest.EmployeeUserId, src => src.EmployeeUserId)
                .Map(dest => dest.EmployeeName, src => GetEmployeeName(src))
                .Map(dest => dest.EmployeeEmail, src => src.EmployeeUser != null ? src.EmployeeUser.Email : null)
                .Map(dest => dest.PolicyId, src => src.PolicyId)
                .Map(dest => dest.PolicyName, src => src.Policy != null ? src.Policy.PolicyName : null)
                .Map(dest => dest.ViolationType, src => src.ViolationType)
                .Map(dest => dest.Description, src => src.Description)
                .Map(dest => dest.Severity, src => src.Severity)
                .Map(dest => dest.Status, src => src.Status)
                .Map(dest => dest.ReportedByUserId, src => src.ReportedByUserId)
                .Map(dest => dest.ReportedByEmail, src => src.ReportedByUser != null ? src.ReportedByUser.Email : null)
                .Map(dest => dest.ReportedDate, src => src.ReportedDate)
                .Map(dest => dest.EscalatedToUserId, src => src.EscalatedToUserId)
                .Map(dest => dest.EscalatedToEmail, src => src.EscalatedToUser != null ? src.EscalatedToUser.Email : null)
                .Map(dest => dest.ResolutionNotes, src => src.ResolutionNotes)
                .Map(dest => dest.ResolvedAt, src => src.ResolvedAt);

            config.NewConfig<ReportViolationRequestDto, Policyviolation>()
                .Map(dest => dest.EmployeeUserId, src => src.EmployeeUserId)
                .Map(dest => dest.PolicyId, src => src.PolicyId)
                .Map(dest => dest.ViolationType, src => src.ViolationType)
                .Map(dest => dest.Description, src => src.Description)
                .Map(dest => dest.Severity, src => src.Severity)
                .Map(dest => dest.Status, src => "Reported")
                .Map(dest => dest.ReportedDate, src => DateOnly.FromDateTime(DateTime.Now))
                .Map(dest => dest.EscalatedToUserId, src => src.EscalatedToUserId)
                .Ignore(dest => dest.ViolationId)
                .Ignore(dest => dest.ReportedByUserId)
                .Ignore(dest => dest.ResolutionNotes)
                .Ignore(dest => dest.ResolvedAt)
                .Ignore(dest => dest.EmployeeUser)
                .Ignore(dest => dest.EscalatedToUser)
                .Ignore(dest => dest.Policy)
                .Ignore(dest => dest.ReportedByUser);
        }

        /// <summary>
        /// Updated: hardened mapping to avoid CS1660 by forcing typed source lambdas & using generic static NewConfig.
        /// </summary>
        private static void RegisterSlaEscalationMappings(TypeAdapterConfig config)
{
    // Use MapWith to avoid member-level Map overload ambiguity (CS1660)
    TypeAdapterConfig<Slaescalation, SlaEscalationResponseDto>.NewConfig()
        .MapWith((Slaescalation s) => new SlaEscalationResponseDto
        {
            EscalationId = s.EscalationId,
            SlaId = s.Slaid,
            SlaType = "SLA",

            EmployeeCompanyId = s.Sla != null && s.Sla.Employee != null
                ? s.Sla.Employee.EmployeeCompanyId
                : null,

            EmployeeName = GetSlaEmployeeName(s),
            EmployeeEmail = GetSlaEmployeeEmail(s),

            EscalatedToEmployeeId = s.EscalatedToEmployeeId,
            EscalatedToEmployeeCompanyId = s.EscalatedToEmployee != null
                ? s.EscalatedToEmployee.EmployeeCompanyId
                : null,

            EscalatedToName = GetEscalatedToName(s),
            EscalatedToEmail = GetEscalatedToEmail(s),

            EscalationLevel = s.EscalationLevel,
            Reason = s.Reason,
            Description = s.Description,
            EscalationStatus = s.EscalationStatus,

            SubmittedByName = GetSlaSubmittedByName(s),
            SubmittedAt = s.SubmittedAt,

            EscalationDeadline = s.EscalationDeadline,
            ResolvedAt = s.ResolvedAt,

            ResolvedByName = GetResolvedByName(s),
            ResolutionComments = s.ResolutionComments,

            SlaDeadline = s.Sla != null ? s.Sla.Deadline : null,
            SlaStatus = s.Sla != null ? s.Sla.Status : null,

            DaysOverdue = CalculateDaysOverdue(s),
            Severity = DetermineSeverity(s)
        });
}


        private static void RegisterEmployeeMappings(TypeAdapterConfig config)
        {
            config.NewConfig<Userauthentication, EmployeeWithoutGoalsDto>()
                .Map(dest => dest.UserId, src => src.UserId)
                .Map(dest => dest.EmployeeUserId, src => src.EmployeeId)
                .Map(dest => dest.Email, src => src.Email)
                .Map(dest => dest.EmployeeCompanyId, src => src.Employee != null ? src.Employee.EmployeeCompanyId : null)
                .Map(dest => dest.EmployeeName, src => GetUserEmployeeName(src))
                .Map(dest => dest.DepartmentName, src => GetUserDepartmentName(src))
                .Map(dest => dest.DaysWithoutGoals, src => (int?)(DateTime.Now - src.CreatedAt).TotalDays)
                .Map(dest => dest.RecommendedAction, src => "Encourage goal setting");

            config.NewConfig<Userauthentication, UserForGoalDto>()
                .Map(dest => dest.UserId, src => src.UserId)
                .Map(dest => dest.EmployeeId, src => src.EmployeeId)
                .Map(dest => dest.Email, src => src.Email)
                .Map(dest => dest.CreatedAt, src => src.CreatedAt);
        }

        private static void RegisterDepartmentMappings(TypeAdapterConfig config)
        {
            config.NewConfig<Department, DepartmentSimpleDto>()
                .Map(dest => dest.DepartmentId, src => src.DepartmentId)
                .Map(dest => dest.DepartmentName, src => src.DepartmentName);

            config.NewConfig<Department, HeadcountResponseDto>()
                .Map(dest => dest.DepartmentId, src => src.DepartmentId)
                .Map(dest => dest.DepartmentName, src => src.DepartmentName)
                .Map(dest => dest.CurrentHeadcount, src => src.Employeedetailsmasters != null ? src.Employeedetailsmasters.Count : 0)
                .Map(dest => dest.Timestamp, src => DateTime.Now);
        }

        private static string? FormatFileSize(long? bytes)
        {
            if (!bytes.HasValue || bytes.Value == 0)
                return null;

            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = bytes.Value;
            int order = 0;

            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }

            return $"{len:0.##} {sizes[order]}";
        }

        private static int CalculateDaysOverdue(Slaescalation escalation)
        {
            if (escalation.EscalationDeadline == null)
                return 0;

            var deadline = escalation.EscalationDeadline.Value;
            var now = DateTime.Now;

            if (now > deadline && escalation.EscalationStatus != "Resolved")
            {
                return (int)(now - deadline).TotalDays;
            }

            return 0;
        }

        private static string DetermineSeverity(Slaescalation escalation)
        {
            var daysOverdue = CalculateDaysOverdue(escalation);

            if (daysOverdue >= 7)
                return "Critical";
            else if (daysOverdue >= 3)
                return "High";
            else if (daysOverdue >= 1)
                return "Medium";
            else
                return "Low";
        }

        private static string? GetEmployeeName(Policyviolation violation)
        {
            if (violation.EmployeeUser?.Employee?.Userprofile != null)
            {
                var profile = violation.EmployeeUser.Employee.Userprofile;
                return $"{profile.FirstName} {profile.LastName}";
            }
            return null;
        }

        private static string GetUserEmployeeName(Userauthentication user)
        {
            if (user.Employee?.Userprofile != null)
            {
                var profile = user.Employee.Userprofile;
                return $"{profile.FirstName} {profile.LastName}";
            }
            return string.Empty;
        }

        private static string GetUserDepartmentName(Userauthentication user)
        {
            // TODO: Implement department lookup if required
            return string.Empty;
        }

        private static string? GetSlaEmployeeName(Slaescalation escalation)
        {
            if (escalation.Sla?.Employee?.Userprofile != null)
            {
                var profile = escalation.Sla.Employee.Userprofile;
                return $"{profile.FirstName} {profile.LastName}";
            }
            return null;
        }

        private static string? GetSlaEmployeeEmail(Slaescalation escalation)
        {
            return escalation.Sla?.Employee?.Userauthentication?.Email;
        }

        private static string? GetEscalatedToName(Slaescalation escalation)
        {
            if (escalation.EscalatedToEmployee?.Userprofile != null)
            {
                var profile = escalation.EscalatedToEmployee.Userprofile;
                return $"{profile.FirstName} {profile.LastName}";
            }
            return null;
        }

        private static string? GetEscalatedToEmail(Slaescalation escalation)
        {
            return escalation.EscalatedToEmployee?.Userauthentication?.Email;
        }

        private static string? GetSlaSubmittedByName(Slaescalation escalation)
        {
            if (escalation.SubmittedByEmployee?.Userprofile != null)
            {
                var profile = escalation.SubmittedByEmployee.Userprofile;
                return $"{profile.FirstName} {profile.LastName}";
            }
            return null;
        }

        private static string? GetResolvedByName(Slaescalation escalation)
        {
            if (escalation.ResolvedByEmployee?.Userprofile != null)
            {
                var profile = escalation.ResolvedByEmployee.Userprofile;
                return $"{profile.FirstName} {profile.LastName}";
            }
            return null;
        }
    }
}