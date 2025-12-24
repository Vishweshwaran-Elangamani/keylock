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
    public class PromotionRepository : IPromotionRepository
    {
        private readonly EEPZDbContext _context;

        public PromotionRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Promotion> CreateAsync(Promotion promotion)
        {
            try
            {
                if (promotion == null)
                    throw new ArgumentNullException(nameof(promotion));

                _context.Promotions.Add(promotion);
                await _context.SaveChangesAsync();

                Console.WriteLine($"  Promotion created: PromotionId={promotion.PromotionId}, NominationId={promotion.NominationId}");

                return promotion;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  Error in CreateAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<Promotion?> GetByIdAsync(int id)
        {
            try
            {
                return await _context.Promotions
                    .Include(p => p.EmployeeUser)
                    .Include(p => p.Department)
                    .Include(p => p.ApprovedByUser)
                    .Include(p => p.Nomination)
                        .ThenInclude(n => n.Opportunity)
                    .FirstOrDefaultAsync(p => p.PromotionId == id);
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error in GetByIdAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Promotion>> GetAllAsync()
        {
            try
            {
                return await _context.Promotions
                    .Include(p => p.EmployeeUser)
                    .Include(p => p.Department)
                    .Include(p => p.Nomination)
                        .ThenInclude(n => n.Opportunity)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error in GetAllAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Promotion>> GetByEmployeeAsync(int employeeUserId)
        {
            try
            {
                return await _context.Promotions
                    .Include(p => p.EmployeeUser)
                    .Include(p => p.Department)
                    .Include(p => p.Nomination)
                    .Where(p => p.EmployeeUserId == employeeUserId)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error in GetByEmployeeAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Promotion>> GetByStatusAsync(string status)
        {
            try
            {
                if (string.IsNullOrEmpty(status))
                    return new List<Promotion>();

                return await _context.Promotions
                    .Include(p => p.EmployeeUser)
                    .Include(p => p.Department)
                    .Include(p => p.Nomination)
                    .Where(p => p.Status == status)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error in GetByStatusAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Promotion>> GetPendingHrApprovalAsync()
        {
            try
            {
                return await _context.Promotions
                    .Include(p => p.EmployeeUser)
                    .Include(p => p.Department)
                    .Include(p => p.Nomination)
                        .ThenInclude(n => n.Opportunity)
                    .Where(p => p.Status == PromotionStatusConstants.PendingHrApproval)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error in GetPendingHrApprovalAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<Promotion?> GetByNominationIdAsync(int nominationId)
        {
            try
            {
                Console.WriteLine($"Repository: Getting promotion for NominationId={nominationId}");

                return await _context.Promotions
                    .Include(p => p.EmployeeUser)
                    .Include(p => p.Department)
                    .Include(p => p.Nomination)
                    .FirstOrDefaultAsync(p => p.NominationId == nominationId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   Error in GetByNominationIdAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<Promotion> UpdateAsync(Promotion promotion)
        {
            try
            {
                if (promotion == null)
                    throw new ArgumentNullException(nameof(promotion));

                promotion.UpdatedAt = DateTime.UtcNow;
                _context.Promotions.Update(promotion);
                await _context.SaveChangesAsync();

                Console.WriteLine($"  Promotion updated: PromotionId={promotion.PromotionId}");

                return promotion;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   Error in UpdateAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteAsync(int id)
        {
            try
            {
                var promotion = await _context.Promotions.FindAsync(id);
                if (promotion == null)
                    return false;

                _context.Promotions.Remove(promotion);
                await _context.SaveChangesAsync();

                Console.WriteLine($"  Promotion deleted: PromotionId={id}");

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   Error in DeleteAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Promotionhistory>> GetPromotionHistoryByEmployeeAsync(int employeeUserId)
        {
            try
            {
                return await _context.Promotionhistories
                    .Include(h => h.EmployeeUser)
                    .Where(h => h.EmployeeUserId == employeeUserId)
                    .OrderByDescending(h => h.RecordedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   Error in GetPromotionHistoryByEmployeeAsync: {ex.Message}");
                throw;
            }
        }
        // Get promotions pending leadership approval
        public async Task<List<Promotion>> GetPendingLeadershipApprovalAsync()
        {
            try
            {
                Console.WriteLine("Repository: Getting promotions pending leadership approval");

                return await _context.Promotions
                    .Include(p => p.EmployeeUser)
                    .Include(p => p.Department)
                    .Include(p => p.Nomination)
                        .ThenInclude(n => n.Opportunity)
                    .Where(p => p.Status == PromotionStatusConstants.PendingLeadershipApproval)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   Error in GetPendingLeadershipApprovalAsync: {ex.Message}");
                throw;
            }
        }
        public async Task AddPromotionHistoryAsync(Promotionhistory history)
        {
            _context.Promotionhistories.Add(history);
            await _context.SaveChangesAsync();
        }


    }
}
