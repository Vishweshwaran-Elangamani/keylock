using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Address
{
    public int AddressId { get; set; }
    public int EmployeeId { get; set; }
    public string AddressType { get; set; } = null!;
    public string? DoorNumber { get; set; }
    public string? Street { get; set; }
    public string? Landmark { get; set; }
    public string? Area { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PinCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual Employee Employee { get; set; } = null!;
}
