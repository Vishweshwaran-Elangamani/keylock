using Microsoft.AspNetCore.Http;

namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class ProfileResponseDto
    {
        public int ProfileId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeCompanyId { get; set; }
        public string FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string LastName { get; set; }
        public string? CallingName { get; set; }
        public string? ReferredBy { get; set; }
        public string Gender { get; set; }
        public DateOnly? DateOfBirthOfficial { get; set; }
        public DateOnly? DateOfBirthActual { get; set; }
        public string? MobileNumber { get; set; }
        public string? AlternateNumber { get; set; }
        public string? PersonalEmail { get; set; }
        public string Email { get; set; }
        public string? DepartmentName { get; set; }
        public string? RoleName { get; set; }
        public string EmploymentType { get; set; }
        public string EmploymentStatus { get; set; }
        public DateOnly? JoiningDate { get; set; }
        public string? WorkLocation { get; set; }
        public string EmployeeType { get; set; }
        public string? MaritalStatus { get; set; }
        public string? Nationality { get; set; }
        public AddressDto? CurrentAddress { get; set; }
        public AddressDto? PermanentAddress { get; set; }
        public string? ProfilePhotoBase64 { get; set; }
    }

    public class AddressDto
    {
        public int AddressId { get; set; }
        public string AddressType { get; set; }
        public string? DoorNumber { get; set; }
        public string? Street { get; set; }
        public string? Landmark { get; set; }
        public string? Area { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; }
        public string? PinCode { get; set; }
    }
}
