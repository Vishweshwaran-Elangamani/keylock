using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IEmployeesRepository
    {
        Task<List<object>> GetAllManagersAsync();
        Task<object> GetUserRoleAsync(int userId);
    }
}
