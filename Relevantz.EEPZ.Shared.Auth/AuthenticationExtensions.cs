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
            // Remove default Microsoft claim remapping
            JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
            JwtSecurityTokenHandler.DefaultOutboundClaimTypeMap.Clear();

            // Build Keycloak authority safely (Docker & non‑Docker)
            var authority =
                configuration["Keycloak:Authority"]
                ?? $"{configuration["Keycloak:BaseUrl"]}/realms/{configuration["Keycloak:Realm"]}";

            services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.Authority = authority;

                    // Keycloak runs on HTTP in Docker
                    options.RequireHttpsMetadata = false;

                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero,

                        // 🔒 Controllers expect numeric ID here
                        NameClaimType = ClaimTypes.NameIdentifier,

                        // 🔒 ASP.NET authorization expects this
                        RoleClaimType = ClaimTypes.Role
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnTokenValidated = context =>
                        {
                            var identity = context.Principal?.Identity as ClaimsIdentity;
                            if (identity == null) return Task.CompletedTask;

                            // =====================================================
                            // ✅ USER ID NORMALIZATION (CRITICAL)
                            // Guarantees ClaimTypes.NameIdentifier = numeric ID
                            // =====================================================
                            var empId =
                                identity.FindFirst("empMasterId")
                                ?? identity.FindFirst("empId");

                            if (empId != null)
                            {
                                // Remove any existing NameIdentifier
                                var existing = identity.FindFirst(ClaimTypes.NameIdentifier);
                                if (existing != null)
                                    identity.RemoveClaim(existing);

                                identity.AddClaim(
                                    new Claim(ClaimTypes.NameIdentifier, empId.Value));

                                // Mirror for legacy access
                                if (!identity.HasClaim("empId", empId.Value))
                                    identity.AddClaim(new Claim("empId", empId.Value));

                                if (!identity.HasClaim("empMasterId", empId.Value))
                                    identity.AddClaim(new Claim("empMasterId", empId.Value));
                            }

                            // =====================================================
                            // ✅ USERNAME NORMALIZATION
                            // =====================================================
                            var username = identity.FindFirst("preferred_username");
                            if (username != null &&
                                !identity.HasClaim(ClaimTypes.Name, username.Value))
                            {
                                identity.AddClaim(
                                    new Claim(ClaimTypes.Name, username.Value));
                            }

                            // =====================================================
                            // ✅ ROLE NORMALIZATION — ALL FORMATS SUPPORTED
                            // =====================================================
                            void AddRole(string role)
                            {
                                if (!identity.HasClaim(ClaimTypes.Role, role))
                                    identity.AddClaim(
                                        new Claim(ClaimTypes.Role, role));

                                // Mirror legacy access
                                if (!identity.HasClaim("role", role))
                                    identity.AddClaim(
                                        new Claim("role", role));
                            }

                            // Direct "role"
                            foreach (var r in identity.FindAll("role"))
                                AddRole(r.Value);

                            // realm_access.roles
                            foreach (var r in identity.FindAll("realm_access.roles"))
                                AddRole(r.Value);

                            // resource_access.account.roles
                            foreach (var r in identity.FindAll("resource_access.account.roles"))
                                AddRole(r.Value);

                            return Task.CompletedTask;
                        }
                    };
                });

            services.AddAuthorization();
            return services;
        }
    }
}