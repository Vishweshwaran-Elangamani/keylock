using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
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
                    .Include(n => n.NominatedByUser)
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
                    .Include(n => n.NominatedByUser)
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
                    .Include(n => n.NominatedByUser)
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
                Console.WriteLine($"[Repository] GetByEmployeeAsync - UserId: {employeeUserId}");

                var nominations = await _context.Nominations
                    .Include(n => n.Opportunity)
                        .ThenInclude(o => o.Department)
                    .Include(n => n.NomineeUser)
                    .Include(n => n.NominatedByUser)
                    .Where(n => n.NomineeUserId == employeeUserId)
                    .OrderByDescending(n => n.SubmittedAt)
                    .ToListAsync();

                Console.WriteLine($"[Repository] Found {nominations.Count} nominations");

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
                    .Include(n => n.NominatedByUser)
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
                    .Include(n => n.NominatedByUser)
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
                    .Include(n => n.NominatedByUser)
                    .Where(n => 
                        n.CurrentApprovalLevel == 2 &&
                        n.DeptHeadUserId == deptHeadUserId &&
                        n.Status == "Pending_DeptHead_Review")
                    .OrderByDescending(n => n.SubmittedAt)
                    .ToListAsync();

                Console.WriteLine($"[Repository] Found {nominations.Count} nominations for dept head");

                return nominations;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error fetching pending nominations for Dept Head {deptHeadUserId}: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Nomination>> GetPendingManagerReviewByManagerIdAsync(int managerId)
        {
            try
            {
                Console.WriteLine($"[Repository] GetPendingManagerReviewByManagerIdAsync - ManagerId: {managerId}");

                // NOTE: L2ManagerUserId is used as "Manager" (from Project.L2approverEmployeeId)
                var nominations = await _context.Nominations
                    .Include(n => n.Opportunity)
                        .ThenInclude(o => o.Department)
                    .Include(n => n.NomineeUser)
                    .Include(n => n.NominatedByUser)
                    .Where(n => 
                        n.CurrentApprovalLevel == 1 && 
                        n.L2ManagerUserId == managerId && 
                        n.Status == "Pending_Manager_Review")
                    .OrderByDescending(n => n.SubmittedAt)
                    .ToListAsync();

                Console.WriteLine($"[Repository] Found {nominations.Count} pending nominations for manager {managerId}");

                return nominations;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in GetPendingManagerReviewByManagerIdAsync: {ex.Message}");
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
                    .AnyAsync(n =>
                        n.OpportunityId == opportunityId &&
                        n.NomineeUserId == employeeId &&
                        (n.Status == "Pending_Manager_Review" ||
                         n.Status == "Pending_DeptHead_Review" ||
                         n.Status == "Approved_By_DeptHead"));

                if (existingNomination)
                {
                    Console.WriteLine($"[Repository] Duplicate found - User {employeeId} already has active nomination for opportunity {opportunityId}");
                }
                else
                {
                    Console.WriteLine($"[Repository] No duplicate - User {employeeId} can apply for opportunity {opportunityId}");
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

        // ==================== PROJECT-BASED METHODS ====================

        /// <summary>
        /// Get Manager (L2) from employee's primary project
        /// Uses Project.L2approverEmployeeId → converts to UserId
        /// </summary>
        public async Task<int?> GetManagerFromProjectAsync(int employeeUserId)
        {
            try
            {
                Console.WriteLine($"[Repository] GetManagerFromProject - EmployeeUserId: {employeeUserId}");

                // Get employee's EmployeeId from Userauthentication
                var employeeAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.UserId == employeeUserId);

                if (employeeAuth == null || employeeAuth.EmployeeId <= 0)
                {
                    Console.WriteLine($"[Repository] No auth record found for UserId: {employeeUserId}");
                    return null;
                }

                // Get employee's primary project (or ANY project if no primary exists)
                var primaryProject = await _context.Projectemployees
                    .Include(pe => pe.Project)
                    .Where(pe => pe.EmployeeId == employeeAuth.EmployeeId)
                    .OrderByDescending(pe => pe.IsPrimary)  // Primary first, then any
                    .FirstOrDefaultAsync();

                if (primaryProject == null || primaryProject.Project == null)
                {
                    Console.WriteLine($"[Repository] No project found for EmployeeId: {employeeAuth.EmployeeId}");
                    return null;
                }

                // ✅ CHANGED: Get L2 approver (which is the Manager in new flow)
                if (primaryProject.Project.L2approverEmployeeId == null)
                {
                    Console.WriteLine($"[Repository] No L2approver (Manager) set in project {primaryProject.ProjectId}");
                    return null;
                }

                // Convert EmployeeId to UserId
                var managerAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.EmployeeId == primaryProject.Project.L2approverEmployeeId.Value);

                if (managerAuth == null)
                {
                    Console.WriteLine($"[Repository] No UserId found for Manager EmployeeId: {primaryProject.Project.L2approverEmployeeId}");
                    return null;
                }

                Console.WriteLine($"[Repository] Found Manager UserId: {managerAuth.UserId} (from L2approver) in Project: {primaryProject.ProjectId}");
                return managerAuth.UserId;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in GetManagerFromProjectAsync: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Get DeptHead from employee's primary project
        /// Uses Project.ResourceOwnerEmployeeId → converts to UserId
        /// </summary>
        public async Task<int?> GetDeptHeadFromProjectAsync(int employeeUserId)
        {
            try
            {
                Console.WriteLine($"[Repository] GetDeptHeadFromProject - EmployeeUserId: {employeeUserId}");

                // Get employee's EmployeeId from Userauthentication
                var employeeAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.UserId == employeeUserId);

                if (employeeAuth == null || employeeAuth.EmployeeId <= 0)
                {
                    Console.WriteLine($"[Repository] No auth record found for UserId: {employeeUserId}");
                    return null;
                }

                // Get employee's primary project (or ANY project if no primary exists)
                var primaryProject = await _context.Projectemployees
                    .Include(pe => pe.Project)
                    .Where(pe => pe.EmployeeId == employeeAuth.EmployeeId)
                    .OrderByDescending(pe => pe.IsPrimary)  // Primary first, then any
                    .FirstOrDefaultAsync();

                if (primaryProject == null || primaryProject.Project == null)
                {
                    Console.WriteLine($"[Repository] No project found for EmployeeId: {employeeAuth.EmployeeId}");
                    return null;
                }

                // ✅ CHANGED: Get ResourceOwner (which is the DeptHead)
                if (primaryProject.Project.ResourceOwnerEmployeeId == null)
                {
                    Console.WriteLine($"[Repository] No ResourceOwner (DeptHead) set in project {primaryProject.ProjectId}");
                    return null;
                }

                // Convert EmployeeId to UserId
                var deptHeadAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.EmployeeId == primaryProject.Project.ResourceOwnerEmployeeId.Value);

                if (deptHeadAuth == null)
                {
                    Console.WriteLine($"[Repository] No UserId found for DeptHead EmployeeId: {primaryProject.Project.ResourceOwnerEmployeeId}");
                    return null;
                }

                Console.WriteLine($"[Repository] Found DeptHead UserId: {deptHeadAuth.UserId} (from ResourceOwner) in Project: {primaryProject.ProjectId}");
                return deptHeadAuth.UserId;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in GetDeptHeadFromProjectAsync: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Get user's role name from Employeedetailsmaster
        /// </summary>
        public async Task<string?> GetUserRoleNameAsync(int userId)
        {
            try
            {
                var userAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.UserId == userId);

                if (userAuth == null || userAuth.EmployeeId <= 0)
                    return null;

                var employeeDetails = await _context.Employeedetailsmasters
                    .Include(edm => edm.Role)
                    .FirstOrDefaultAsync(edm => edm.EmployeeId == userAuth.EmployeeId);

                return employeeDetails?.Role?.RoleName;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error getting role for UserId {userId}: {ex.Message}");
                return null;
            }
        }
    }
}
