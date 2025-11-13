using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IInternalOpportunityRepository
    {
        Task<Internalopportunity> GetByIdAsync(int id);
        Task<List<Internalopportunity>> GetAllAsync();
        Task<List<Internalopportunity>> GetActiveAsync();
        Task<List<Internalopportunity>> GetByDepartmentAsync(int departmentId);
        Task<List<Internalopportunity>> GetByStatusAsync(string status);
        Task<Internalopportunity> CreateAsync(Internalopportunity opportunity);
        Task<Internalopportunity> UpdateAsync(Internalopportunity opportunity);
        Task<bool> DeleteAsync(int id);
        Task<int> CountAsync();
        Task<int> CountByStatusAsync(string status);
    }
}
