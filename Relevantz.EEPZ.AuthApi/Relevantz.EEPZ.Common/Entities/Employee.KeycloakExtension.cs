// ────────────────────────────────────────────────────────────────────────────
// DO NOT touch Employee.cs — this partial extension is the ONLY entity change.
// The column already exists in the DB: KeycloakUserId varchar(36) NULL
// Adding it here makes EF Core map it — zero risk to other microservices.
// ────────────────────────────────────────────────────────────────────────────
namespace Relevantz.EEPZ.Common.Entities;

public partial class Employee
{
    /// <summary>
    /// Keycloak UUID for this employee (e.g. "f81d4fae-7dec-11d0-a765-00a0c91e6bf6").
    /// Set at user creation time. Used to call Keycloak Admin API for
    /// disable/enable/password-reset/attribute operations.
    /// </summary>
    // public string? KeycloakUserId { get; set; }
}
