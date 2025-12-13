using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.DBContexts;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class LeadershipRepository : ILeadershipRepository
    {
        private readonly EEPZDbContext _context;

        public LeadershipRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<List<LeadershipPerformanceRatingDto>> GetLeadershipPerformanceRatingsAsync()
        {
            var query = from detail in _context.Assessmentdetails
                        join reviewL1 in _context.Assessmentreviews.Where(r => r.ReviewerRole == "Approver")
                            on detail.DetailId equals reviewL1.DetailId into l1Group
                        from l1 in l1Group.DefaultIfEmpty()
                        join reviewL2 in _context.Assessmentreviews.Where(r => r.ReviewerRole == "Reviewer")
                            on detail.DetailId equals reviewL2.DetailId into l2Group
                        from l2 in l2Group.DefaultIfEmpty()
                        join assessment in _context.Selfassessments on detail.AssessmentId equals assessment.AssessmentId
                        join employee in _context.Employees on assessment.EmployeeId equals employee.EmployeeId
                        join competency in _context.Competencies on detail.CompetencyId equals competency.CompetencyId
                        join l1ReviewerAuth in _context.Userauthentications on l1.ReviewerId equals l1ReviewerAuth.UserId into l1ReviewerGroup
                        from l1Reviewer in l1ReviewerGroup.DefaultIfEmpty()
                        join l1ReviewerProfile in _context.Userprofiles on l1Reviewer.EmployeeId equals l1ReviewerProfile.EmployeeId into l1ProfileGroup
                        from l1Profile in l1ProfileGroup.DefaultIfEmpty()
                        join l2ReviewerAuth in _context.Userauthentications on l2.ReviewerId equals l2ReviewerAuth.UserId into l2ReviewerGroup
                        from l2Reviewer in l2ReviewerGroup.DefaultIfEmpty()
                        join l2ReviewerProfile in _context.Userprofiles on l2Reviewer.EmployeeId equals l2ReviewerProfile.EmployeeId into l2ProfileGroup
                        from l2Profile in l2ProfileGroup.DefaultIfEmpty()
                        select new LeadershipPerformanceRatingDto
                        {
                            EmployeeId = employee.EmployeeId,
                            EmployeeCompanyId = employee.EmployeeCompanyId,
                            EmployeeName = l1Profile != null 
                                ? $"{l1Profile.FirstName} {l1Profile.LastName}" 
                                : "N/A",
                            CompetencyName = competency.Name,
                            EmployeeRating = detail.EmployeeRating,
                            EmployeeComments = detail.EmployeeComments,
                            L1Rating = l1 != null ? l1.Rating : null,
                            L1Comments = l1 != null ? l1.Comments : null,
                            L1ReviewerName = l1Profile != null 
                                ? $"{l1Profile.FirstName} {l1Profile.LastName}" 
                                : "N/A",
                            L2Rating = l2 != null ? l2.Rating : null,
                            L2Comments = l2 != null ? l2.Comments : null,
                            L2ReviewerName = l2Profile != null 
                                ? $"{l2Profile.FirstName} {l2Profile.LastName}" 
                                : "N/A"
                        };

            return await query.ToListAsync();
        }
    }
}
