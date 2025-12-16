using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Userprofile
{
    public int ProfileId { get; set; }

    public int EmployeeId { get; set; }

    public string FirstName { get; set; } = null!;

    public string? MiddleName { get; set; }

    public string LastName { get; set; } = null!;

    public string? CallingName { get; set; }

    public byte[]? ProfilePhoto { get; set; }

    public string? ReferredBy { get; set; }

    public string? Gender { get; set; }

    public DateOnly? DateOfBirthOfficial { get; set; }

    public DateOnly? DateOfBirthActual { get; set; }

    public string? MobileNumber { get; set; }

    public string? AlternateNumber { get; set; }

    public string? PersonalEmail { get; set; }

    public string? MaritalStatus { get; set; }

    public string? Nationality { get; set; }

    public virtual Employee Employee { get; set; } = null!;
}
