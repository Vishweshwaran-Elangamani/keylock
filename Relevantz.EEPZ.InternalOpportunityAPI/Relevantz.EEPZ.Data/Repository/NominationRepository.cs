// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Threading.Tasks;
// using Microsoft.EntityFrameworkCore;
// using Relevantz.EEPZ.Common.Entities;
// using Relevantz.EEPZ.Common.Enums;
// using Relevantz.EEPZ.Data.DBContexts;
// using Relevantz.EEPZ.Data.IRepository;

// namespace Relevantz.EEPZ.Data.Repository
// {
//     public class NominationRepository : INominationRepository
//     {
//         private readonly EEPZDbContext _context;

//         public NominationRepository(EEPZDbContext context)
//         {
//             _context = context;
//         }

//         public async Task<Nomination> CreateAsync(Nomination nomination)
//         {
//             try
//             {
//                 if (nomination == null)
//                     throw new ArgumentNullException(nameof(nomination));

//                 _context.Nominations.Add(nomination);
//                 await _context.SaveChangesAsync();
//                 return nomination;
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Error in CreateAsync: {ex.Message}");
//                 throw;
//             }
//         }

//         public async Task<Nomination?> GetByIdAsync(int id)
//         {
//             try
//             {
//                 return await _context.Nominations
//                     .Include(n => n.Opportunity)
//                         .ThenInclude(o => o.Department)
//                     .Include(n => n.NomineeUser)
//                     .Include(n => n.NominatedByUser)
//                     .Include(n => n.ReviewedByUser)
//                     .FirstOrDefaultAsync(n => n.NominationId == id);
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Error in GetByIdAsync: {ex.Message}");
//                 throw;
//             }
//         }

//         public async Task<List<Nomination>> GetAllAsync()
//         {
//             try
//             {
//                 return await _context.Nominations
//                     .Include(n => n.Opportunity)
//                         .ThenInclude(o => o.Department)
//                     .Include(n => n.NomineeUser)
//                     .Include(n => n.NominatedByUser)
//                     .OrderByDescending(n => n.SubmittedAt)
//                     .ToListAsync();
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Error in GetAllAsync: {ex.Message}");
//                 throw;
//             }
//         }

//         public async Task<List<Nomination>> GetByOpportunityAsync(int opportunityId)
//         {
//             try
//             {
//                 return await _context.Nominations
//                     .Include(n => n.NomineeUser)
//                     .Include(n => n.NominatedByUser)
//                     .Where(n => n.OpportunityId == opportunityId)
//                     .OrderByDescending(n => n.SubmittedAt)
//                     .ToListAsync();
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Error in GetByOpportunityAsync: {ex.Message}");
//                 throw;
//             }
//         }

//         public async Task<List<Nomination>> GetByEmployeeAsync(int employeeUserId)
//         {
//             try
//             {
//                 Console.WriteLine($"Repository: GetByEmployeeAsync - UserId: {employeeUserId}");

//                 var nominations = await _context.Nominations
//                     .Include(n => n.Opportunity)
//                         .ThenInclude(o => o.Department)
//                     .Include(n => n.NomineeUser)
//                     .Include(n => n.NominatedByUser)
//                     .Where(n => n.NomineeUserId == employeeUserId)
//                     .OrderByDescending(n => n.SubmittedAt)
//                     .ToListAsync();

//                 Console.WriteLine($"Repository: Found {nominations.Count} nominations");

//                 return nominations;
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Error in GetByEmployeeAsync: {ex.Message}");
//                 throw;
//             }
//         }

//         public async Task<List<Nomination>> GetByStatusAsync(string status)
//         {
//             try
//             {
//                 if (string.IsNullOrEmpty(status))
//                     return new List<Nomination>();

//                 return await _context.Nominations
//                     .Include(n => n.Opportunity)
//                         .ThenInclude(o => o.Department)
//                     .Include(n => n.NomineeUser)
//                     .Include(n => n.NominatedByUser)
//                     .Where(n => n.Status == status)
//                     .OrderByDescending(n => n.SubmittedAt)
//                     .ToListAsync();
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Error in GetByStatusAsync: {ex.Message}");
//                 throw;
//             }
//         }

//         public async Task<List<Nomination>> GetPendingManagerReviewAsync()
//         {
//             try
//             {
//                 return await _context.Nominations
//                     .Include(n => n.Opportunity)
//                     .Include(n => n.NomineeUser)
//                     .Where(n => n.Status == NominationStatusConstants.PendingManagerReview)
//                     .OrderByDescending(n => n.SubmittedAt)
//                     .ToListAsync();
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Error in GetPendingManagerReviewAsync: {ex.Message}");
//                 throw;
//             }
//         }

//         public async Task<List<Nomination>> GetPendingDeptHeadApprovalAsync()
//         {
//             try
//             {
//                 return await _context.Nominations
//                     .Include(n => n.Opportunity)
//                         .ThenInclude(o => o.Department)
//                     .Include(n => n.NomineeUser)
//                     .Include(n => n.NominatedByUser)
//                     .Where(n => n.Status == NominationStatusConstants.PendingDeptHeadApproval)
//                     .OrderByDescending(n => n.SubmittedAt)
//                     .ToListAsync();
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Error in GetPendingDeptHeadApprovalAsync: {ex.Message}");
//                 throw;
//             }
//         }

//         public async Task<List<Nomination>> GetPendingDeptHeadApprovalByDeptHeadIdAsync(int deptHeadUserId)
// {
//     try
//     {
//         // Step 1: Get the Department Head's EmployeeId via user authentication
//         var deptHeadAuth = await _context.Userauthentications
//             .FirstOrDefaultAsync(u => u.UserId == deptHeadUserId);

//         if (deptHeadAuth == null)
//         {
//             Console.WriteLine("Department Head user authentication not found");
//             return new List<Nomination>();
//         }

//         var deptHeadEmployeeId = deptHeadAuth.EmployeeId;

//         // Step 2: Get DepartmentId for the Department Head employee
//         var deptHeadDetails = await _context.Employeedetailsmasters
//             .FirstOrDefaultAsync(ed => ed.EmployeeId == deptHeadEmployeeId);

//         if (deptHeadDetails == null)
//         {
//             Console.WriteLine("Department Head details not found");
//             return new List<Nomination>();
//         }

//         var deptHeadDepartmentId = deptHeadDetails.DepartmentId;

//         // Step 3: Fetch nominations for PendingDeptHeadApproval status linked to this department
//         var nominations = await _context.Nominations
//             .Include(n => n.Opportunity)
//                 .ThenInclude(o => o.Department)
//             .Include(n => n.NomineeUser)
//             .Include(n => n.NominatedByUser)
//             .Where(n => 
//                 n.Status == NominationStatusConstants.PendingDeptHeadApproval &&
//                 n.Opportunity.DepartmentId == deptHeadDepartmentId)
//             .OrderByDescending(n => n.SubmittedAt)
//             .ToListAsync();

//         return nominations;
//     }
//     catch (Exception ex)
//     {
//         Console.WriteLine($"Error fetching pending nominations for Dept Head {deptHeadUserId}: {ex.Message}");
//         throw;
//     }
// }


//         public async Task<List<Nomination>> GetPendingManagerReviewByManagerIdAsync(int managerId)
//         {
//             try
//             {
//                 Console.WriteLine($"Repository: GetPendingManagerReviewByManagerIdAsync - ManagerId: {managerId}");

//                 var managerUser = await _context.Userauthentications
//                     .FirstOrDefaultAsync(u => u.UserId == managerId);

//                 if (managerUser == null)
//                 {
//                     Console.WriteLine($"Manager user not found");
//                     return new List<Nomination>();
//                 }

//                 var managerEmployeeId = managerUser.EmployeeId;

//                 if (managerEmployeeId <= 0)
//                 {
//                     Console.WriteLine($"Manager has invalid EmployeeId: {managerEmployeeId}");
//                     return new List<Nomination>();
//                 }

//                 Console.WriteLine($"Manager EmployeeId: {managerEmployeeId}");

//                 var teamEmployeeIds = await _context.Employees
//                     .Where(e => e.ReportingManagerEmployeeId == managerEmployeeId)
//                     .Select(e => e.EmployeeId)
//                     .ToListAsync();

//                 Console.WriteLine($"Team EmployeeIds: {string.Join(", ", teamEmployeeIds)}");

//                 if (!teamEmployeeIds.Any())
//                 {
//                     Console.WriteLine($"No team members found");
//                     return new List<Nomination>();
//                 }

//                 var teamUserIds = await _context.Userauthentications
//                     .Where(u => teamEmployeeIds.Contains(u.EmployeeId))
//                     .Select(u => u.UserId)
//                     .ToListAsync();

//                 Console.WriteLine($"Team UserIds: {string.Join(", ", teamUserIds)}");

//                 var nominations = await _context.Nominations
//                     .Include(n => n.Opportunity)
//                         .ThenInclude(o => o.Department)
//                     .Include(n => n.NomineeUser)
//                     .Include(n => n.NominatedByUser)
//                     .Where(n => 
//                         n.Status == NominationStatusConstants.PendingManagerReview &&
//                         teamUserIds.Contains(n.NomineeUserId))
//                     .OrderByDescending(n => n.SubmittedAt)
//                     .ToListAsync();

//                 Console.WriteLine($"Found {nominations.Count} pending nominations");

//                 return nominations;
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Error in GetPendingManagerReviewByManagerIdAsync: {ex.Message}");
//                 throw;
//             }
//         }

//         public async Task<Nomination> UpdateAsync(Nomination nomination)
//         {
//             try
//             {
//                 if (nomination == null)
//                     throw new ArgumentNullException(nameof(nomination));

//                 _context.Nominations.Update(nomination);
//                 await _context.SaveChangesAsync();
//                 return nomination;
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Error in UpdateAsync: {ex.Message}");
//                 throw;
//             }
//         }

//         public async Task<bool> DeleteAsync(int id)
//         {
//             try
//             {
//                 var nomination = await _context.Nominations.FindAsync(id);
//                 if (nomination == null)
//                     return false;

//                 _context.Nominations.Remove(nomination);
//                 await _context.SaveChangesAsync();
//                 return true;
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Error in DeleteAsync: {ex.Message}");
//                 throw;
//             }
//         }

//         public async Task<bool> ExistsDuplicateAsync(int opportunityId, int employeeId)
//         {
//             try
//             {
//                 return await _context.Nominations
//                     .AnyAsync(n =>
//                         n.OpportunityId == opportunityId &&
//                         n.NomineeUserId == employeeId &&
//                         (n.Status == NominationStatusConstants.PendingManagerReview ||
//                          n.Status == NominationStatusConstants.PendingDeptHeadApproval ||
//                          n.Status == NominationStatusConstants.Approved));
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Error in ExistsDuplicateAsync: {ex.Message}");
//                 throw;
//             }
//         }

//         public async Task AddReviewMetricAsync(Nominationreviewmetric metric)
//         {
//             _context.Nominationreviewmetrics.Add(metric);
//             await _context.SaveChangesAsync();
//         }
//     }
// }

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

        // ✅ UPDATED: Now checks CurrentApprovalLevel = 3 and DeptHeadUserId
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

        // ✅ UPDATED: Now checks L1 and L2 levels separately
        public async Task<List<Nomination>> GetPendingManagerReviewByManagerIdAsync(int managerId)
        {
            try
            {
                Console.WriteLine($"Repository: GetPendingManagerReviewByManagerIdAsync - ManagerId: {managerId}");

                // Get nominations where this manager is L1 (level 1) or L2 (level 2)
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

        public async Task<bool> ExistsDuplicateAsync(int opportunityId, int employeeId)
        {
            try
            {
                return await _context.Nominations
                    .AnyAsync(n =>
                        n.OpportunityId == opportunityId &&
                        n.NomineeUserId == employeeId &&
                        (n.Status == "Pending_L1_Review" ||
                         n.Status == "Pending_L2_Review" ||
                         n.Status == "Pending_DeptHead_Review" ||
                         n.Status == "Approved_By_DeptHead"));
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

        // ✅ NEW: Get L1 Manager UserId from employee's ReportingManagerEmployeeId
        public async Task<int?> GetL1ManagerUserIdAsync(int employeeUserId)
        {
            try
            {
                // Get employee's auth record to find EmployeeId
                var employeeAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.UserId == employeeUserId);

                if (employeeAuth == null || employeeAuth.EmployeeId <= 0)
                    return null;

                // Get employee record to find ReportingManagerEmployeeId
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeId == employeeAuth.EmployeeId);

                if (employee?.ReportingManagerEmployeeId == null)
                    return null;

                // Get L1 manager's UserId
                var l1ManagerAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.EmployeeId == employee.ReportingManagerEmployeeId.Value);

                return l1ManagerAuth?.UserId;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetL1ManagerUserIdAsync: {ex.Message}");
                return null;
            }
        }

        // ✅ NEW: Get L2 Manager UserId (L1's manager)
        public async Task<int?> GetL2ManagerUserIdAsync(int l1ManagerUserId)
        {
            try
            {
                // Get L1 manager's auth record
                var l1ManagerAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.UserId == l1ManagerUserId);

                if (l1ManagerAuth == null || l1ManagerAuth.EmployeeId <= 0)
                    return null;

                // Get L1 manager's employee record
                var l1Manager = await _context.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeId == l1ManagerAuth.EmployeeId);

                if (l1Manager?.ReportingManagerEmployeeId == null)
                    return null;

                // Get L2 manager's UserId
                var l2ManagerAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.EmployeeId == l1Manager.ReportingManagerEmployeeId.Value);

                return l2ManagerAuth?.UserId;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetL2ManagerUserIdAsync: {ex.Message}");
                return null;
            }
        }

        // ✅ NEW: Get DeptHead UserId (L2's manager)
        public async Task<int?> GetDeptHeadUserIdAsync(int l2ManagerUserId)
        {
            try
            {
                // Get L2 manager's auth record
                var l2ManagerAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.UserId == l2ManagerUserId);

                if (l2ManagerAuth == null || l2ManagerAuth.EmployeeId <= 0)
                    return null;

                // Get L2 manager's employee record
                var l2Manager = await _context.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeId == l2ManagerAuth.EmployeeId);

                if (l2Manager?.ReportingManagerEmployeeId == null)
                    return null;

                // Get DeptHead's UserId
                var deptHeadAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.EmployeeId == l2Manager.ReportingManagerEmployeeId.Value);

                return deptHeadAuth?.UserId;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetDeptHeadUserIdAsync: {ex.Message}");
                return null;
            }
        }
    }
}
