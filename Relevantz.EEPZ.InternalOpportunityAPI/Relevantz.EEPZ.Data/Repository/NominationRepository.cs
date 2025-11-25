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
                Console.WriteLine($"Error in CreateAsync: {ex.Message}");
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
                Console.WriteLine($"Error in GetByIdAsync: {ex.Message}");
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
                Console.WriteLine($"Error in GetAllAsync: {ex.Message}");
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
                Console.WriteLine($"Error in GetByOpportunityAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Nomination>> GetByEmployeeAsync(int employeeUserId)
        {
            try
            {
                Console.WriteLine($"Repository: GetByEmployeeAsync - UserId: {employeeUserId}");

                var nominations = await _context.Nominations
                    .Include(n => n.Opportunity)
                        .ThenInclude(o => o.Department)
                    .Include(n => n.NomineeUser)
                    .Include(n => n.NominatedByUser)
                    .Where(n => n.NomineeUserId == employeeUserId)
                    .OrderByDescending(n => n.SubmittedAt)
                    .ToListAsync();

                Console.WriteLine($"Repository: Found {nominations.Count} nominations");

                return nominations;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetByEmployeeAsync: {ex.Message}");
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
                Console.WriteLine($"Error in GetByStatusAsync: {ex.Message}");
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
                    .Where(n => n.Status == "Pending_L1_Review" || n.Status == "Pending_L2_Review")
                    .OrderByDescending(n => n.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPendingManagerReviewAsync: {ex.Message}");
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
                Console.WriteLine($"Error in GetPendingDeptHeadApprovalAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Nomination>> GetPendingDeptHeadApprovalByDeptHeadIdAsync(int deptHeadUserId)
        {
            try
            {
                Console.WriteLine($"Repository: GetPendingDeptHeadApprovalByDeptHeadIdAsync - DeptHeadUserId: {deptHeadUserId}");

                var nominations = await _context.Nominations
                    .Include(n => n.Opportunity)
                        .ThenInclude(o => o.Department)
                    .Include(n => n.NomineeUser)
                    .Include(n => n.NominatedByUser)
                    .Where(n => 
                        n.CurrentApprovalLevel == 3 &&
                        n.DeptHeadUserId == deptHeadUserId &&
                        n.Status == "Pending_DeptHead_Review")
                    .OrderByDescending(n => n.SubmittedAt)
                    .ToListAsync();

                Console.WriteLine($"Repository: Found {nominations.Count} nominations for dept head");

                return nominations;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching pending nominations for Dept Head {deptHeadUserId}: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Nomination>> GetPendingManagerReviewByManagerIdAsync(int managerId)
        {
            try
            {
                Console.WriteLine($"Repository: GetPendingManagerReviewByManagerIdAsync - ManagerId: {managerId}");

                var nominations = await _context.Nominations
                    .Include(n => n.Opportunity)
                        .ThenInclude(o => o.Department)
                    .Include(n => n.NomineeUser)
                    .Include(n => n.NominatedByUser)
                    .Where(n => 
                        (n.CurrentApprovalLevel == 1 && n.L1ManagerUserId == managerId && n.Status == "Pending_L1_Review") ||
                        (n.CurrentApprovalLevel == 2 && n.L2ManagerUserId == managerId && n.Status == "Pending_L2_Review"))
                    .OrderByDescending(n => n.SubmittedAt)
                    .ToListAsync();

                Console.WriteLine($"Found {nominations.Count} pending nominations for manager {managerId}");

                return nominations;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPendingManagerReviewByManagerIdAsync: {ex.Message}");
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
                Console.WriteLine($"Error in UpdateAsync: {ex.Message}");
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
                Console.WriteLine($"Error in DeleteAsync: {ex.Message}");
                throw;
            }
        }

        // Check if user already has an active (pending/approved) nomination for this opportunity
public async Task<bool> ExistsDuplicateAsync(int opportunityId, int employeeId)
{
    try
    {
        Console.WriteLine($"[Repository] Checking duplicate - OpportunityId: {opportunityId}, EmployeeId: {employeeId}");

        // Check if user has a PENDING or APPROVED nomination (cannot reapply)
        var existingNomination = await _context.Nominations
            .AnyAsync(n =>
                n.OpportunityId == opportunityId &&
                n.NomineeUserId == employeeId &&
                (n.Status == "Pending_L1_Review" ||
                 n.Status == "Pending_L2_Review" ||
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
        Console.WriteLine($"Error in ExistsDuplicateAsync: {ex.Message}");
        throw;
    }
}


        public async Task AddReviewMetricAsync(Nominationreviewmetric metric)
        {
            _context.Nominationreviewmetrics.Add(metric);
            await _context.SaveChangesAsync();
        }

        // HELPER: Get role name for a user via Employeedetailsmaster
        private async Task<string?> GetUserRoleNameAsync(int userId)
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

        // UPDATED: Returns null if direct manager is "Manager" role (L2), meaning no L1 exists
        public async Task<int?> GetL1ManagerUserIdAsync(int employeeUserId)
        {
            try
            {
                Console.WriteLine($"[Repository] GetL1ManagerUserIdAsync - EmployeeUserId: {employeeUserId}");

                var employeeAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.UserId == employeeUserId);

                if (employeeAuth == null || employeeAuth.EmployeeId <= 0)
                {
                    Console.WriteLine($"[Repository] No auth record found for UserId: {employeeUserId}");
                    return null;
                }

                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeId == employeeAuth.EmployeeId);

                if (employee?.ReportingManagerEmployeeId == null)
                {
                    Console.WriteLine($"[Repository] No reporting manager found for EmployeeId: {employeeAuth.EmployeeId}");
                    return null;
                }

                var directManagerAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.EmployeeId == employee.ReportingManagerEmployeeId.Value);

                if (directManagerAuth == null)
                    return null;

                // Check direct manager's role
                var managerRole = await GetUserRoleNameAsync(directManagerAuth.UserId);
                
                Console.WriteLine($"[Repository] Direct manager UserId {directManagerAuth.UserId} has role: {managerRole}");

                // If direct manager has "Manager" role, they are L2 (no L1 exists)
                if (managerRole == "Manager")
                {
                    Console.WriteLine($"[Repository] Direct manager is L2-level (Manager role), no L1 exists");
                    return null;
                }

                // Otherwise, they are L1
                Console.WriteLine($"[Repository] Found L1 Manager UserId: {directManagerAuth.UserId}");
                return directManagerAuth.UserId;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in GetL1ManagerUserIdAsync: {ex.Message}");
                return null;
            }
        }

        // UPDATED: Get L2 Manager - returns direct manager if they have "Manager" role, else their manager
        public async Task<int?> GetL2ManagerUserIdAsync(int employeeUserId)
        {
            try
            {
                Console.WriteLine($"[Repository] GetL2ManagerUserIdAsync - EmployeeUserId: {employeeUserId}");

                var employeeAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.UserId == employeeUserId);

                if (employeeAuth == null || employeeAuth.EmployeeId <= 0)
                {
                    Console.WriteLine($"[Repository] No auth record found for UserId: {employeeUserId}");
                    return null;
                }

                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeId == employeeAuth.EmployeeId);

                if (employee?.ReportingManagerEmployeeId == null)
                {
                    Console.WriteLine($"[Repository] No reporting manager found for EmployeeId: {employeeAuth.EmployeeId}");
                    return null;
                }

                // Get direct manager
                var directManagerAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.EmployeeId == employee.ReportingManagerEmployeeId.Value);

                if (directManagerAuth == null)
                    return null;

                // Check if direct manager is L2-level (has "Manager" role)
                var managerRole = await GetUserRoleNameAsync(directManagerAuth.UserId);
                
                Console.WriteLine($"[Repository] Direct manager UserId {directManagerAuth.UserId} has role: {managerRole}");

                if (managerRole == "Manager")
                {
                    Console.WriteLine($"[Repository] Direct manager is L2 Manager");
                    return directManagerAuth.UserId;
                }

                // Otherwise, get L1's manager (who should be L2)
                var l1Manager = await _context.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeId == employee.ReportingManagerEmployeeId.Value);

                if (l1Manager?.ReportingManagerEmployeeId == null)
                {
                    Console.WriteLine($"[Repository] L1 has no manager");
                    return null;
                }

                var l2ManagerAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.EmployeeId == l1Manager.ReportingManagerEmployeeId.Value);

                Console.WriteLine($"[Repository] Found L2 Manager UserId: {l2ManagerAuth?.UserId}");
                return l2ManagerAuth?.UserId;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in GetL2ManagerUserIdAsync: {ex.Message}");
                return null;
            }
        }

        // Get DeptHead UserId (L2's manager) - should have "Department Head" role
        public async Task<int?> GetDeptHeadUserIdAsync(int l2ManagerUserId)
        {
            try
            {
                Console.WriteLine($"[Repository] GetDeptHeadUserIdAsync - L2ManagerUserId: {l2ManagerUserId}");

                var l2ManagerAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.UserId == l2ManagerUserId);

                if (l2ManagerAuth == null || l2ManagerAuth.EmployeeId <= 0)
                {
                    Console.WriteLine($"[Repository] No auth record found for L2ManagerUserId: {l2ManagerUserId}");
                    return null;
                }

                var l2Manager = await _context.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeId == l2ManagerAuth.EmployeeId);

                if (l2Manager?.ReportingManagerEmployeeId == null)
                {
                    Console.WriteLine($"[Repository] No reporting manager found for L2Manager EmployeeId: {l2ManagerAuth.EmployeeId}");
                    return null;
                }

                var deptHeadAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.EmployeeId == l2Manager.ReportingManagerEmployeeId.Value);

                if (deptHeadAuth != null)
                {
                    var deptHeadRole = await GetUserRoleNameAsync(deptHeadAuth.UserId);
                    Console.WriteLine($"[Repository] Found DeptHead UserId: {deptHeadAuth.UserId} with role: {deptHeadRole}");
                }

                return deptHeadAuth?.UserId;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Repository] Error in GetDeptHeadUserIdAsync: {ex.Message}");
                return null;
            }
        }
    }
}
