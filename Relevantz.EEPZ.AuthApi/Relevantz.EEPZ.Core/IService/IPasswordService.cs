namespace Relevantz.EEPZ.Core.IService
{
    public interface IPasswordService
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string passwordHash);
        string GenerateTemporaryPassword(int length = 12);
        bool ValidatePasswordStrength(string password);
    }
}
