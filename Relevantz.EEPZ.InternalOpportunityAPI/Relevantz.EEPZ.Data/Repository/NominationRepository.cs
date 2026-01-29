using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;


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
            try
            {
                if (nomination == null)
                    throw new ArgumentNullException(nameof(nomination));


                _context.Nominations.Add(nomination);
                await _context.SaveChangesAsync();
                return nomination;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in CreateAsync: {ex.Message}");
                throw;
            }
        }


        public async Task<Nomination?> GetByIdAsync(int id)
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in GetByIdAsync: {ex.Message}");
                throw;
            }
        }


        public async Task<List<Nomination>> GetAllAsync()
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in GetAllAsync: {ex.Message}");
                throw;
            }
        }


        public async Task<List<Nomination>> GetByOpportunityAsync(int opportunityId)
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in GetByOpportunityAsync: {ex.Message}");
                throw;
            }
        }


        public async Task<List<Nomination>> GetByEmployeeAsync(int employeeUserId)
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in GetByEmployeeAsync: {ex.Message}");
                throw;
            }
        }


        public async Task<List<Nomination>> GetByStatusAsync(string status)
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in GetByStatusAsync: {ex.Message}");
                throw;
            }
        }


        public async Task<List<Nomination>> GetPendingManagerReviewAsync()
        {
            try
            {
                return await _context.Nominations
                    .Include(n => n.Opportunity)
                    .Include(n => n.NomineeUser)
                        .ThenInclude(u => u.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Where(n => n.Status == "Pending_Manager_Review")
                    .OrderByDescending(n => n.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in GetPendingManagerReviewAsync: {ex.Message}");
                throw;
            }
        }


        public async Task<List<Nomination>> GetPendingDeptHeadApprovalAsync()
        {
            try
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
                    .Where(n => n.Status == "Pending_DeptHead_Review")
                    .OrderByDescending(n => n.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in GetPendingDeptHeadApprovalAsync: {ex.Message}");
                throw;
            }
        }


        public async Task<List<Nomination>> GetPendingDeptHeadApprovalByDeptHeadIdAsync(int deptHeadUserId)
        {
            try
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
                             && n.Status == "Pending_DeptHead_Review")
                    .OrderByDescending(n => n.SubmittedAt)
                    .ToListAsync();


                Console.WriteLine($"[Repository] Found {nominations.Count} nominations for dept head");
                return nominations;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error: {ex.Message}");
                throw;
            }
        }


        public async Task<List<Nomination>> GetPendingManagerReviewByManagerIdAsync(int managerId)
        {
            try
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
                             && (n.Status == "Pending_Manager_Review" || n.Status == "Pending_Manager_ReReview"))
                    .OrderByDescending(n => n.SubmittedAt)
                    .ToListAsync();


                Console.WriteLine($"[Repository] Found {nominations.Count} pending nominations for manager {managerId}");
                return nominations;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error: {ex.Message}");
                throw;
            }
        }


        public async Task<List<Nomination>> GetManagerTeamNominationsAsync(int managerId, string? status = null)
        {
            try
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
                    .Where(n => n.NominatedByUserId == managerId && n.NominationType == "manager_nomination");


                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(n => n.Status == status);
                }


                var nominations = await query.OrderByDescending(n => n.SubmittedAt).ToListAsync();


                Console.WriteLine($"[Repository] Found {nominations.Count} team nominations");
                return nominations;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error: {ex.Message}");
                throw;
            }
        }


        public async Task<Nomination> UpdateAsync(Nomination nomination)
        {
            try
            {
                if (nomination == null)
                    throw new ArgumentNullException(nameof(nomination));


                _context.Nominations.Update(nomination);
                await _context.SaveChangesAsync();
                return nomination;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in UpdateAsync: {ex.Message}");
                throw;
            }
        }


        public async Task<bool> DeleteAsync(int id)
        {
            try
            {
                var nomination = await _context.Nominations.FindAsync(id);
                if (nomination == null)
                    return false;


                _context.Nominations.Remove(nomination);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in DeleteAsync: {ex.Message}");
                throw;
            }
        }


        public async Task<bool> ExistsDuplicateAsync(int opportunityId, int employeeId)
        {
            try
            {
                Console.WriteLine($"[Repository] Checking duplicate - OpportunityId: {opportunityId}, EmployeeId: {employeeId}");


                var existingNomination = await _context.Nominations
                    .AnyAsync(n => n.OpportunityId == opportunityId
                               && n.NomineeUserId == employeeId
                               && (n.Status == "Pending_Manager_Review"
                                   || n.Status == "Pending_Manager_ReReview"
                                   || n.Status == "Pending_DeptHead_Review"
                                   || n.Status == "Approved_By_DeptHead"));


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
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in ExistsDuplicateAsync: {ex.Message}");
                throw;
            }
        }


        public async Task AddReviewMetricAsync(Nominationreviewmetric metric)
        {
            _context.Nominationreviewmetrics.Add(metric);
            await _context.SaveChangesAsync();
        }


        public async Task<int?> GetManagerFromProjectAsync(int employeeUserId)
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error: {ex.Message}");
                return null;
            }
        }


        public async Task<int?> GetManagerFromReportingHierarchyAsync(int employeeUserId)
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error: {ex.Message}");
                return null;
            }
        }


        public async Task<int?> GetFirstAvailableManagerAsync()
        {
            try
            {
                Console.WriteLine($"[Repository] GetFirstAvailableManager");


                var managerRole = await _context.Roles
                    .FirstOrDefaultAsync(r => r.RoleName == "Manager");


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
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error: {ex.Message}");
                return null;
            }
        }


        public async Task<int?> GetDeptHeadFromProjectAsync(int employeeUserId)
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error: {ex.Message}");
                return null;
            }
        }


        public async Task<int?> GetFirstAvailableDeptHeadAsync()
        {
            try
            {
                Console.WriteLine($"[Repository] GetFirstAvailableDeptHead");


                var deptHeadRole = await _context.Roles
                    .FirstOrDefaultAsync(r => r.RoleName == "Department Head"
                                           || r.RoleName == "DepartmentHead"
                                           || r.RoleName == "DEPTHEAD");


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
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error: {ex.Message}");
                return null;
            }
        }


        public async Task<string?> GetUserRoleNameAsync(int userId)
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error getting role: {ex.Message}");
                return null;
            }
        }


        public async Task<List<Nomination>> GetNominationHistoryByUserIdAsync(int userId, string? status = null)
        {
            try
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
                        (n.NomineeUserId == userId && n.NominationType == "employee_self") ||
                        (n.NominatedByUserId == userId && n.NominationType == "manager_nomination")
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
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error: {ex.Message}");
                throw;
            }
        }
        
        public async Task<bool> IsUserL2ManagerAsync(int userId)
        {
            try
            {
                Console.WriteLine($"[Repository] IsUserL2ManagerAsync - Checking UserId: {userId}");

                // Get EmployeeId from UserId
                var employeeAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.UserId == userId);

                if (employeeAuth == null || employeeAuth.EmployeeId == 0)
                {
                    Console.WriteLine($"[Repository] No employee found for UserId {userId}");
                    return false;
                }

                // Check if this employee is an L2 Approver in any active project
                var isL2Manager = await _context.Projects
                    .AnyAsync(p => p.L2approverEmployeeId == employeeAuth.EmployeeId);

                Console.WriteLine($"[Repository] User {userId} (EmployeeId: {employeeAuth.EmployeeId}) is L2 Manager: {isL2Manager}");
                return isL2Manager;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in IsUserL2ManagerAsync: {ex.Message}");
                return false;
            }
        }
    }
}
