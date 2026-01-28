using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.Extensions.Configuration;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Constants;
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
            var issuer = _configuration[TokenConstants.ConfigKeys.JwtIssuer] ?? TokenConstants.Defaults.DefaultIssuer;
            var audience = _configuration[TokenConstants.ConfigKeys.JwtAudience] ?? TokenConstants.Defaults.DefaultAudience;
            var secretKey =
                _configuration[TokenConstants.ConfigKeys.JwtSecretKey]
                ?? throw new InvalidOperationException(TokenConstants.ErrorMessages.SecretKeyNotConfigured);
            var expirationMinutes = _configuration.GetValue<int>(
                TokenConstants.ConfigKeys.AccessTokenExpirationMinutes,
                TokenConstants.Defaults.DefaultAccessTokenExpirationMinutes
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
            var expirationDays = _configuration.GetValue<int>(
                TokenConstants.ConfigKeys.RefreshTokenExpirationDays,
                TokenConstants.Defaults.DefaultRefreshTokenExpirationDays
            );
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
            EEPZServiceLog.Information(TokenConstants.LogMessages.RefreshTokenRevoked);
        }
        public async Task RevokeAllUserTokensAsync(int userId)
        {
            await _refreshTokenRepository.RevokeAllUserTokensAsync(userId);
            EEPZServiceLog.Information($"All refresh tokens revoked for UserId: {userId}");
        }
    }
}
