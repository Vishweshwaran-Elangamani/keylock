using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IEmployeesService
    {
        Task<ApiResponse<List<object>>> GetAllManagersAsync();
        Task<ApiResponse<object>> GetUserRoleAsync(int userId);
    }
}
