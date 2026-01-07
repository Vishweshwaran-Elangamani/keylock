using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateProfileRequestDto
    {
        [Required(ErrorMessage = "First name is required")]
        [StringLength(100, ErrorMessage = "First name cannot exceed 100 characters")]
        public string? FirstName { get; set; }
        [StringLength(100, ErrorMessage = "Middle name cannot exceed 100 characters")]
        public string? MiddleName { get; set; }
        [Required(ErrorMessage = "Last name is required")]
        [StringLength(100, ErrorMessage = "Last name cannot exceed 100 characters")]
        public string? LastName { get; set; }
        [StringLength(100, ErrorMessage = "Calling name cannot exceed 100 characters")]
        public string? CallingName { get; set; }
        [Required(ErrorMessage = "Gender is required")]
        public string? Gender { get; set; }
        public DateOnly? DateOfBirthOfficial { get; set; }
        public DateOnly? DateOfBirthActual { get; set; }
        [Phone(ErrorMessage = "Invalid phone number format")]
        [StringLength(20, ErrorMessage = "Mobile number cannot exceed 20 characters")]
        public string? MobileNumber { get; set; }
        [Phone(ErrorMessage = "Invalid phone number format")]
        [StringLength(20, ErrorMessage = "Alternate number cannot exceed 20 characters")]
        public string? AlternateNumber { get; set; }
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255, ErrorMessage = "Personal email cannot exceed 255 characters")]
        public string? PersonalEmail { get; set; }
        public string? MaritalStatus { get; set; }
        [StringLength(100, ErrorMessage = "Nationality cannot exceed 100 characters")]
        public string? Nationality { get; set; }
        public IFormFile? ProfilePhoto { get; set; }
        public UpdateAddressDto? CurrentAddress { get; set; }
        public UpdateAddressDto? PermanentAddress { get; set; }
    }
    public class UpdateAddressDto
    {
        public int? AddressId { get; set; }
        [StringLength(50)]
        public string? DoorNumber { get; set; }
        [StringLength(200)]
        public string? Street { get; set; }
        [StringLength(200)]
        public string? Landmark { get; set; }
        [StringLength(100)]
        public string? Area { get; set; }
        [StringLength(100)]
        public string? City { get; set; }
        [StringLength(100)]
        public string? State { get; set; }
        [StringLength(100)]
        public string? Country { get; set; }
        [StringLength(20)]
        public string? PinCode { get; set; }
    }
}
