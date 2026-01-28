using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Data.Repository
{
    public class AddressRepository : IAddressRepository
    {
        private readonly EEPZDbContext _context;

        public AddressRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<List<Address>> GetByEmployeeIdAsync(int employeeId)
        {
            return await _context.Addresses
                .Where(a => a.EmployeeId == employeeId)
                .ToListAsync();
        }

        public async Task<Address?> GetByEmployeeIdAndTypeAsync(int employeeId, string addressType)
        {
            return await _context.Addresses
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.AddressType == addressType);
        }

        public async Task<Address> CreateAsync(Address address)
        {
            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();
            return address;
        }

        public async Task<Address> UpdateAsync(Address address)
        {
            _context.Addresses.Update(address);
            await _context.SaveChangesAsync();
            return address;
        }

        public async Task DeleteAsync(int addressId)
        {
            var address = await _context.Addresses.FindAsync(addressId);
            if (address != null)
            {
                _context.Addresses.Remove(address);
                await _context.SaveChangesAsync();
            }
        }
    }
}
