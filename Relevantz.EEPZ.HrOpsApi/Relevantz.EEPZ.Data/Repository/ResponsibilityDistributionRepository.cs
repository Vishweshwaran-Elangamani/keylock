using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;
namespace Relevantz.EEPZ.Data.Repository
{
    public class ResponsibilityDistributionRepository : IResponsibilityDistributionRepository
    {
        private readonly EEPZDbContext _context;
        public ResponsibilityDistributionRepository(EEPZDbContext context)
        {
            _context = context;
        }
        public async Task<Teamworkload?> GetByIdAsync(int workloadId)
        {
            try
            {
                Console.WriteLine($"[REPO GET BY ID] Fetching workload ID: {workloadId}");
                var result = await _context.Teamworkloads
                    .AsNoTracking()
                    .FirstOrDefaultAsync(tw => tw.WorkloadId == workloadId);
                if (result == null)
                {
                    Console.WriteLine($"[REPO GET BY ID] Workload not found: {workloadId}");
                }
                else
                {
                    Console.WriteLine($"[REPO GET BY ID] Found: {result.WorkloadId}, Team: {result.TeamId}");
                }
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[REPO GET BY ID] Error: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Teamworkload>> GetAllAsync()
        {
            try
            {
                Console.WriteLine("[REPO GET ALL] Starting GetAllAsync");
                var count = await _context.Teamworkloads.CountAsync();
                Console.WriteLine($"[REPO GET ALL] Total count: {count}");
                var result = await _context.Teamworkloads
                    .AsNoTracking()
                    .ToListAsync();
                Console.WriteLine($"[REPO GET ALL] Returned {result.Count} records");
                foreach (var item in result)
                {
                    Console.WriteLine($"[REPO GET ALL] ID: {item.WorkloadId}, TeamId: {item.TeamId}, Status: {item.Status}");
                }
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[REPO GET ALL] Exception: {ex.GetType().Name}");
                Console.WriteLine($"[REPO GET ALL] Message: {ex.Message}");
                Console.WriteLine($"[REPO GET ALL] Stack: {ex.StackTrace}");
                throw;
            }
        }
        public async Task<List<Teamworkload>> GetByDepartmentIdAsync(int departmentId)
        {
            try
            {
                Console.WriteLine($"[REPO GET BY DEPT] Fetching for department: {departmentId}");
                var result = await _context.Teamworkloads
                    .AsNoTracking()
                    .Where(tw => tw.TeamId == departmentId)
                    .ToListAsync();
                Console.WriteLine($"[REPO GET BY DEPT] Found {result.Count} records");
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[REPO GET BY DEPT] Error: {ex.Message}");
                throw;
            }
        }
        public async Task<Teamworkload?> GetByDepartmentAsync(int departmentId)
        {
            try
            {
                Console.WriteLine($"[REPO GET BY DEPT SINGLE] Fetching for department: {departmentId}");
                var result = await _context.Teamworkloads
                    .AsNoTracking()
                    .FirstOrDefaultAsync(tw => tw.TeamId == departmentId);
                if (result == null)
                {
                    Console.WriteLine($"[REPO GET BY DEPT SINGLE] Not found");
                }
                else
                {
                    Console.WriteLine($"[REPO GET BY DEPT SINGLE] Found: {result.WorkloadId}");
                }
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[REPO GET BY DEPT SINGLE] Error: {ex.Message}");
                throw;
            }
        }
        public async Task<Teamworkload> CreateAsync(Teamworkload workload)
        {
            try
            {
                Console.WriteLine("[REPO CREATE] Adding workload");
                _context.Teamworkloads.Add(workload);
                await _context.SaveChangesAsync();
                Console.WriteLine($"[REPO CREATE] Saved with ID: {workload.WorkloadId}");
                return workload;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[REPO CREATE] Error: {ex.Message}");
                throw;
            }
        }
        public async Task<Teamworkload> UpdateAsync(Teamworkload workload)
        {
            try
            {
                Console.WriteLine($"[REPO UPDATE] Updating: {workload.WorkloadId}");
                _context.Teamworkloads.Update(workload);
                await _context.SaveChangesAsync();
                Console.WriteLine($"[REPO UPDATE] Updated successfully");
                return workload;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[REPO UPDATE] Error: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> DeleteAsync(int workloadId)
        {
            try
            {
                Console.WriteLine($"[REPO DELETE] Deleting: {workloadId}");
                var workload = await _context.Teamworkloads.FindAsync(workloadId);
                if (workload == null)
                {
                    Console.WriteLine($"[REPO DELETE] Not found");
                    return false;
                }
                _context.Teamworkloads.Remove(workload);
                await _context.SaveChangesAsync();
                Console.WriteLine($"[REPO DELETE] Deleted successfully");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[REPO DELETE] Error: {ex.Message}");
                throw;
            }
        }
    }
}
