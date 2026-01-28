using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IAddressRepository
    {
        Task<List<Address>> GetByEmployeeIdAsync(int employeeId);
        Task<Address?> GetByEmployeeIdAndTypeAsync(int employeeId, string addressType);
        Task<Address> CreateAsync(Address address);
        Task<Address> UpdateAsync(Address address);
        Task DeleteAsync(int addressId);
    }
}
