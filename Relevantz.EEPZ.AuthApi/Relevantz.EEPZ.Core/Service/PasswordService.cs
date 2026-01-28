using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.Extensions.Configuration;
using Relevantz.EEPZ.Common.Constants;
namespace Relevantz.EEPZ.Core.Service
{
    public class PasswordService : IPasswordService
    {
        private readonly IConfiguration _configuration;
        public PasswordService(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        public string HashPassword(string password)
        {
            return PasswordHelper.HashPassword(password);
        }
        public bool VerifyPassword(string password, string passwordHash)
        {
            return PasswordHelper.VerifyPassword(password, passwordHash);
        }
        public string GenerateTemporaryPassword(int length = 12)
        {
            var configLength = _configuration.GetValue<int>("PasswordSettings:TemporaryPasswordLength", 12);
            return PasswordHelper.GenerateTemporaryPassword(configLength);
        }
        public bool ValidatePasswordStrength(string password)
        {
            var requireUppercase = _configuration.GetValue<bool>("PasswordSettings:RequireUppercase", true);
            var requireLowercase = _configuration.GetValue<bool>("PasswordSettings:RequireLowercase", true);
            var requireDigit = _configuration.GetValue<bool>("PasswordSettings:RequireDigit", true);
            var requireSpecialChar = _configuration.GetValue<bool>("PasswordSettings:RequireSpecialChar", true);
            var minLength = _configuration.GetValue<int>("PasswordSettings:MinimumLength", 8);
            return PasswordHelper.ValidatePasswordStrength(
                password,
                requireUppercase,
                requireLowercase,
                requireDigit,
                requireSpecialChar,
                minLength);
        }
    }
}
