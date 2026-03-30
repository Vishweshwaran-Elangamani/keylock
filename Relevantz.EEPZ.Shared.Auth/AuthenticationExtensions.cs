using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Relevantz.EEPZ.Shared.Auth
{
    public static class AuthenticationExtensions
    {
        public static IServiceCollection AddEepzAuthentication(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

            services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.Authority =
                        configuration["Keycloak:Authority"];

                    options.RequireHttpsMetadata = true;

                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero,

                        NameClaimType = ClaimTypes.NameIdentifier,
                        RoleClaimType = ClaimTypes.Role
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnTokenValidated = context =>
                        {
                            var identity =
                                context.Principal?.Identity as ClaimsIdentity;
                            if (identity == null) return Task.CompletedTask;

                            // ✅ Normalize UserId
                            var empId =
                                identity.FindFirst("empMasterId") ??
                                identity.FindFirst("empId");

                            if (empId != null)
                            {
                                var existing =
                                    identity.FindFirst(ClaimTypes.NameIdentifier);
                                if (existing != null)
                                    identity.RemoveClaim(existing);

                                identity.AddClaim(
                                    new Claim(ClaimTypes.NameIdentifier, empId.Value));
                            }

                            // ✅ Normalize Role
                            var role =
                                identity.FindFirst("role") ??
                                identity.FindFirst(ClaimTypes.Role);

                            if (role != null &&
                                !identity.HasClaim(c => c.Type == ClaimTypes.Role))
                            {
                                identity.AddClaim(
                                    new Claim(ClaimTypes.Role, role.Value));
                            }

                            return Task.CompletedTask;
                        }
                    };
                });

            services.AddAuthorization();
            return services;
        }
    }
}