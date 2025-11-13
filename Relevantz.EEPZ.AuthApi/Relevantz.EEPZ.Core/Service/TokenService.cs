using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.Extensions.Configuration;
using Relevantz.EEPZ.Data.DBContexts;

namespace Relevantz.EEPZ.Core.Service
{
    public class TokenService : ITokenService
    {
        private readonly EEPZDbContext _context;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IConfiguration _configuration;

        public TokenService(
            EEPZDbContext context,
            IRefreshTokenRepository refreshTokenRepository,
            IConfiguration configuration
        )
        {
            _context = context;
            _refreshTokenRepository = refreshTokenRepository;
            _configuration = configuration;
        }

        public string GenerateAccessToken(Userauthentication user, string roleName)
        {
            var issuer = _configuration["Jwt:Issuer"] ?? "EEPZ";
            var audience = _configuration["Jwt:Audience"] ?? "EEPZUsers";
            var secretKey =
                _configuration["Jwt:SecretKey"]
                ?? throw new InvalidOperationException("JWT Secret Key not configured");
            var expirationMinutes = _configuration.GetValue<int>(
                "Jwt:AccessTokenExpirationMinutes",
                60
            );

            var empId = _context
                .Employeedetailsmasters.Where(edm => edm.EmployeeId == user.EmployeeId)
                .Select(edm => edm.EmployeeId)
                .FirstOrDefault();

            var empMasterId = _context
                .Employeedetailsmasters.Where(edm => edm.EmployeeId == user.EmployeeId)
                .Select(edm => edm.EmployeeMasterId)
                .FirstOrDefault();

            return JwtHelper.GenerateAccessToken(
                user.UserId,
                empId: empId,
                empMasterId: empMasterId,
                user.Email,
                roleName,
                issuer,
                audience,
                secretKey,
                expirationMinutes
            );
        }

        public async Task<string> GenerateRefreshTokenAsync(int userId, string? ipAddress)
        {
            var token = JwtHelper.GenerateRefreshToken();
            var expirationDays = _configuration.GetValue<int>("Jwt:RefreshTokenExpirationDays", 7);

            var refreshToken = new Refreshtoken
            {
                UserId = userId,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(expirationDays),
                IsRevoked = false,
                CreatedAt = DateTime.UtcNow,
                IpAddress = ipAddress,
            };

            await _refreshTokenRepository.CreateAsync(refreshToken);
            EEPZServiceLog.Information($"Refresh token generated for UserId: {userId}");
            return token;
        }

        public async Task<bool> ValidateRefreshTokenAsync(string token)
        {
            var refreshToken = await _refreshTokenRepository.GetByTokenAsync(token);

            if (
                refreshToken == null
                || refreshToken.IsRevoked
                || refreshToken.ExpiresAt < DateTime.UtcNow
            )
            {
                return false;
            }

            return true;
        }

        public async Task RevokeRefreshTokenAsync(string token)
        {
            await _refreshTokenRepository.RevokeTokenAsync(token);
            EEPZServiceLog.Information($"Refresh token revoked");
        }

        public async Task RevokeAllUserTokensAsync(int userId)
        {
            await _refreshTokenRepository.RevokeAllUserTokensAsync(userId);
            EEPZServiceLog.Information($"All refresh tokens revoked for UserId: {userId}");
        }
    }
}
