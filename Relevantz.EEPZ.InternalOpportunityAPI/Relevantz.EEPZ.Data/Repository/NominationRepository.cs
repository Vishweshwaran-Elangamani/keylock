using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Data.Constants;

namespace Relevantz.EEPZ.Data.Repository
{
    public class NominationRepository : INominationRepository
    {
        private readonly EEPZDbContext _context;

        public NominationRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Nomination> CreateAsync(Nomination nomination)
        {
            if (nomination == null)
                throw new ArgumentNullException(nameof(nomination));

            _context.Nominations.Add(nomination);
            await _context.SaveChangesAsync();
            return nomination;
        }

        public async Task<Nomination?> GetByIdAsync(int id)
        {
            return await _context.Nominations
                .Include(n => n.Opportunity)
                    .ThenInclude(o => o.Department)
                .Include(n => n.NomineeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.NominatedByUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.L1managerUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.L2managerUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.DeptHeadUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.ReviewedByUser)
                .FirstOrDefaultAsync(n => n.NominationId == id);
        }

        public async Task<List<Nomination>> GetAllAsync()
        {
            return await _context.Nominations
                .Include(n => n.Opportunity)
                    .ThenInclude(o => o.Department)
                .Include(n => n.NomineeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.NominatedByUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .OrderByDescending(n => n.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Nomination>> GetByOpportunityAsync(int opportunityId)
        {
            return await _context.Nominations
                .Include(n => n.NomineeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.NominatedByUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Where(n => n.OpportunityId == opportunityId)
                .OrderByDescending(n => n.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Nomination>> GetByEmployeeAsync(int employeeUserId)
        {
            Console.WriteLine($"[Repository] GetByEmployeeAsync - Fetching nominations for UserId: {employeeUserId}");

            var nominations = await _context.Nominations
                .Include(n => n.Opportunity)
                    .ThenInclude(o => o.Department)
                .Include(n => n.NomineeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.NominatedByUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.L2managerUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.DeptHeadUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Where(n => n.NomineeUserId == employeeUserId)
                .OrderByDescending(n => n.SubmittedAt)
                .ToListAsync();

            Console.WriteLine($"[Repository] Found {nominations.Count} nominations for user {employeeUserId}");

            foreach (var nom in nominations)
            {
                Console.WriteLine($"  - Nomination {nom.NominationId}: Nominee={nom.NomineeUser?.Email}, Opportunity={nom.Opportunity?.OpportunityName}, Status={nom.Status}");
            }

            return nominations;
        }

        public async Task<List<Nomination>> GetByStatusAsync(string status)
        {
            if (string.IsNullOrEmpty(status))
                return new List<Nomination>();

            return await _context.Nominations
                .Include(n => n.Opportunity)
                    .ThenInclude(o => o.Department)
                .Include(n => n.NomineeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.NominatedByUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Where(n => n.Status == status)
                .OrderByDescending(n => n.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Nomination>> GetPendingManagerReviewAsync()
        {
            return await _context.Nominations
                .Include(n => n.Opportunity)
                .Include(n => n.NomineeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Where(n => n.Status == RepositoryConstants.StatusPendingManagerReview)
                .OrderByDescending(n => n.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Nomination>> GetPendingDeptHeadApprovalAsync()
        {
            return await _context.Nominations
                .Include(n => n.Opportunity)
                    .ThenInclude(o => o.Department)
                .Include(n => n.NomineeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.NominatedByUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Where(n => n.Status == RepositoryConstants.StatusPendingDeptHeadReview)
                .OrderByDescending(n => n.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Nomination>> GetPendingDeptHeadApprovalByDeptHeadIdAsync(int deptHeadUserId)
        {
            Console.WriteLine($"[Repository] GetPendingDeptHeadApprovalByDeptHeadIdAsync - DeptHeadUserId: {deptHeadUserId}");

            var nominations = await _context.Nominations
                .Include(n => n.Opportunity)
                    .ThenInclude(o => o.Department)
                .Include(n => n.NomineeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.NominatedByUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.L2managerUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Where(n => n.CurrentApprovalLevel == 2
                         && n.DeptHeadUserId == deptHeadUserId
                         && n.Status == RepositoryConstants.StatusPendingDeptHeadReview)
                .OrderByDescending(n => n.SubmittedAt)
                .ToListAsync();

            Console.WriteLine($"[Repository] Found {nominations.Count} nominations for dept head");
            return nominations;
        }

        public async Task<List<Nomination>> GetPendingManagerReviewByManagerIdAsync(int managerId)
        {
            Console.WriteLine($"[Repository] GetPendingManagerReviewByManagerIdAsync - ManagerId: {managerId}");

            var nominations = await _context.Nominations
                .Include(n => n.Opportunity)
                    .ThenInclude(o => o.Department)
                .Include(n => n.NomineeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.NominatedByUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.DeptHeadUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Where(n => n.CurrentApprovalLevel == 1
                         && n.L2managerUserId == managerId
                         && (n.Status == RepositoryConstants.StatusPendingManagerReview || n.Status == RepositoryConstants.StatusPendingManagerReReview))
                .OrderByDescending(n => n.SubmittedAt)
                .ToListAsync();

            Console.WriteLine($"[Repository] Found {nominations.Count} pending nominations for manager {managerId}");
            return nominations;
        }

        public async Task<List<Nomination>> GetManagerTeamNominationsAsync(int managerId, string? status = null)
        {
            Console.WriteLine($"[Repository] GetManagerTeamNominationsAsync - ManagerId: {managerId}");

            var query = _context.Nominations
                .Include(n => n.Opportunity)
                    .ThenInclude(o => o.Department)
                .Include(n => n.NomineeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.NominatedByUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.L2managerUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.DeptHeadUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Where(n => n.NominatedByUserId == managerId && n.NominationType == RepositoryConstants.NominationTypeManagerNomination);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(n => n.Status == status);
            }

            var nominations = await query.OrderByDescending(n => n.SubmittedAt).ToListAsync();

            Console.WriteLine($"[Repository] Found {nominations.Count} team nominations");
            return nominations;
        }

        public async Task<Nomination> UpdateAsync(Nomination nomination)
        {
            if (nomination == null)
                throw new ArgumentNullException(nameof(nomination));

            _context.Nominations.Update(nomination);
            await _context.SaveChangesAsync();
            return nomination;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var nomination = await _context.Nominations.FindAsync(id);
            if (nomination == null)
                return false;

            _context.Nominations.Remove(nomination);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsDuplicateAsync(int opportunityId, int employeeId)
        {
            Console.WriteLine($"[Repository] Checking duplicate - OpportunityId: {opportunityId}, EmployeeId: {employeeId}");

            var existingNomination = await _context.Nominations
                .AnyAsync(n => n.OpportunityId == opportunityId
                           && n.NomineeUserId == employeeId
                           && (n.Status == RepositoryConstants.StatusPendingManagerReview
                               || n.Status == RepositoryConstants.StatusPendingManagerReReview
                               || n.Status == RepositoryConstants.StatusPendingDeptHeadReview
                               || n.Status == RepositoryConstants.StatusApprovedByDeptHead));

            if (existingNomination)
            {
                Console.WriteLine($"[Repository] Duplicate found");
            }
            else
            {
                Console.WriteLine($"[Repository] No duplicate - can apply");
            }

            return existingNomination;
        }

        public async Task AddReviewMetricAsync(Nominationreviewmetric metric)
        {
            _context.Nominationreviewmetrics.Add(metric);
            await _context.SaveChangesAsync();
        }

        public async Task<int?> GetManagerFromProjectAsync(int employeeUserId)
        {
            Console.WriteLine($"[Repository] GetManagerFromProject - EmployeeUserId: {employeeUserId}");

            var employeeAuth = await _context.Userauthentications
                .FirstOrDefaultAsync(u => u.UserId == employeeUserId);

            if (employeeAuth == null || employeeAuth.EmployeeId == 0)
            {
                Console.WriteLine($"[Repository] No auth record found for UserId {employeeUserId}");
                return null;
            }

            var primaryProject = await _context.Projectemployees
                .Include(pe => pe.Project)
                .Where(pe => pe.EmployeeId == employeeAuth.EmployeeId)
                .OrderByDescending(pe => pe.IsPrimary)
                .FirstOrDefaultAsync();

            if (primaryProject == null || primaryProject.Project == null)
            {
                Console.WriteLine($"[Repository] No project found for EmployeeId {employeeAuth.EmployeeId}");
                return null;
            }

            if (primaryProject.Project.L2approverEmployeeId == null)
            {
                Console.WriteLine($"[Repository] No L2approver (Manager) set in project {primaryProject.ProjectId}");
                return null;
            }

            var managerAuth = await _context.Userauthentications
                .FirstOrDefaultAsync(u => u.EmployeeId == primaryProject.Project.L2approverEmployeeId.Value);

            if (managerAuth == null)
            {
                Console.WriteLine($"[Repository] No UserId found for Manager EmployeeId {primaryProject.Project.L2approverEmployeeId}");
                return null;
            }

            Console.WriteLine($"[Repository] Found Manager UserId {managerAuth.UserId} from L2approver in Project {primaryProject.ProjectId}");
            return managerAuth.UserId;
        }

        public async Task<int?> GetManagerFromReportingHierarchyAsync(int employeeUserId)
        {
            Console.WriteLine($"[Repository] GetManagerFromReportingHierarchy - UserId: {employeeUserId}");

            var employeeAuth = await _context.Userauthentications
                .FirstOrDefaultAsync(u => u.UserId == employeeUserId);

            if (employeeAuth == null || employeeAuth.EmployeeId == 0)
            {
                return null;
            }

            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeAuth.EmployeeId);

            if (employee == null || employee.ReportingManagerEmployeeId == null)
            {
                Console.WriteLine($"[Repository] No ReportingManager found");
                return null;
            }

            var managerAuth = await _context.Userauthentications
                .FirstOrDefaultAsync(u => u.EmployeeId == employee.ReportingManagerEmployeeId.Value);

            if (managerAuth == null)
            {
                return null;
            }

            Console.WriteLine($"[Repository] Found Manager UserId {managerAuth.UserId} from ReportingManager");
            return managerAuth.UserId;
        }

        public async Task<int?> GetFirstAvailableManagerAsync()
        {
            Console.WriteLine($"[Repository] GetFirstAvailableManager");

            var managerRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleName == RepositoryConstants.RoleNameManager);

            if (managerRole == null)
            {
                return null;
            }

            var managerEmployee = await _context.Employeedetailsmasters
                .Where(edm => edm.RoleId == managerRole.RoleId)
                .FirstOrDefaultAsync();

            if (managerEmployee == null)
            {
                return null;
            }

            var managerAuth = await _context.Userauthentications
                .FirstOrDefaultAsync(u => u.EmployeeId == managerEmployee.EmployeeId);

            if (managerAuth == null)
            {
                return null;
            }

            Console.WriteLine($"[Repository] Found first available Manager UserId {managerAuth.UserId}");
            return managerAuth.UserId;
        }

        public async Task<int?> GetDeptHeadFromProjectAsync(int employeeUserId)
        {
            Console.WriteLine($"[Repository] GetDeptHeadFromProject - EmployeeUserId: {employeeUserId}");

            var employeeAuth = await _context.Userauthentications
                .FirstOrDefaultAsync(u => u.UserId == employeeUserId);

            if (employeeAuth == null || employeeAuth.EmployeeId == 0)
            {
                Console.WriteLine($"[Repository] No auth record found");
                return null;
            }

            var primaryProject = await _context.Projectemployees
                .Include(pe => pe.Project)
                .Where(pe => pe.EmployeeId == employeeAuth.EmployeeId)
                .OrderByDescending(pe => pe.IsPrimary)
                .FirstOrDefaultAsync();

            if (primaryProject == null || primaryProject.Project == null)
            {
                Console.WriteLine($"[Repository] No project found");
                return null;
            }

            if (primaryProject.Project.ResourceOwnerEmployeeId == null)
            {
                Console.WriteLine($"[Repository] No ResourceOwner (DeptHead) set in project");
                return null;
            }

            var deptHeadAuth = await _context.Userauthentications
                .FirstOrDefaultAsync(u => u.EmployeeId == primaryProject.Project.ResourceOwnerEmployeeId.Value);

            if (deptHeadAuth == null)
            {
                Console.WriteLine($"[Repository] No UserId found for DeptHead");
                return null;
            }

            Console.WriteLine($"[Repository] Found DeptHead UserId {deptHeadAuth.UserId}");
            return deptHeadAuth.UserId;
        }

        public async Task<int?> GetFirstAvailableDeptHeadAsync()
        {
            Console.WriteLine($"[Repository] GetFirstAvailableDeptHead");

            var deptHeadRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleName == RepositoryConstants.RoleNameDepartmentHead
                                       || r.RoleName == RepositoryConstants.RoleNameDepartmentHeadAlt1
                                       || r.RoleName == RepositoryConstants.RoleNameDepartmentHeadAlt2);

            if (deptHeadRole == null)
            {
                return null;
            }

            var deptHeadEmployee = await _context.Employeedetailsmasters
                .Where(edm => edm.RoleId == deptHeadRole.RoleId)
                .FirstOrDefaultAsync();

            if (deptHeadEmployee == null)
            {
                return null;
            }

            var deptHeadAuth = await _context.Userauthentications
                .FirstOrDefaultAsync(u => u.EmployeeId == deptHeadEmployee.EmployeeId);

            if (deptHeadAuth == null)
            {
                return null;
            }

            Console.WriteLine($"[Repository] Found first available DeptHead UserId {deptHeadAuth.UserId}");
            return deptHeadAuth.UserId;
        }

        public async Task<string?> GetUserRoleNameAsync(int userId)
        {
            var userAuth = await _context.Userauthentications
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (userAuth == null || userAuth.EmployeeId == 0)
                return null;

            var employeeDetails = await _context.Employeedetailsmasters
                .Include(edm => edm.Role)
                .FirstOrDefaultAsync(edm => edm.EmployeeId == userAuth.EmployeeId);

            return employeeDetails?.Role?.RoleName;
        }

        public async Task<List<Nomination>> GetNominationHistoryByUserIdAsync(int userId, string? status = null)
        {
            Console.WriteLine($"[Repository] GetNominationHistoryByUserIdAsync - UserId: {userId}");

            var query = _context.Nominations
                .Include(n => n.Opportunity)
                    .ThenInclude(o => o.Department)
                .Include(n => n.NomineeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.NominatedByUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.L1managerUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.L2managerUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(n => n.DeptHeadUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Where(n =>
                    (n.NomineeUserId == userId && n.NominationType == RepositoryConstants.NominationTypeEmployeeSelf) ||
                    (n.NominatedByUserId == userId && n.NominationType == RepositoryConstants.NominationTypeManagerNomination)
                );

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(n => n.Status.Contains(status));
            }

            var nominations = await query
                .OrderByDescending(n => n.SubmittedAt)
                .ToListAsync();

            Console.WriteLine($"[Repository] Found {nominations.Count} historical nominations for user {userId}");
            return nominations;
        }
        
        public async Task<bool> IsUserL2ManagerAsync(int userId)
        {
            Console.WriteLine($"[Repository] IsUserL2ManagerAsync - Checking UserId: {userId}");

            var employeeAuth = await _context.Userauthentications
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (employeeAuth == null || employeeAuth.EmployeeId == 0)
            {
                Console.WriteLine($"[Repository] No employee found for UserId {userId}");
                return false;
            }

            var isL2Manager = await _context.Projects
                .AnyAsync(p => p.L2approverEmployeeId == employeeAuth.EmployeeId);

            Console.WriteLine($"[Repository] User {userId} (EmployeeId: {employeeAuth.EmployeeId}) is L2 Manager: {isL2Manager}");
            return isL2Manager;
        }
    }
}
