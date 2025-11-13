using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IPromotionHistoryRepository
    {
        Task<Promotionhistory> GetByIdAsync(int id);
        Task<List<Promotionhistory>> GetByEmployeeAsync(int employeeId);
        Task<List<Promotionhistory>> GetByPromotionAsync(int promotionId);
        Task<Promotionhistory> CreateAsync(Promotionhistory history);
    }
}
