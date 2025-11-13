using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Core.Service
{
    public class ProfileService : IProfileService
    {
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IUserAuthenticationRepository _userAuthRepository;
        private readonly EEPZDbContext _context;

        public ProfileService(
            IUserProfileRepository userProfileRepository,
            IUserAuthenticationRepository userAuthRepository,
            EEPZDbContext context)
        {
            _userProfileRepository = userProfileRepository;
            _userAuthRepository = userAuthRepository;
            _context = context;
        }

        public async Task<ApiResponseDto<ProfileResponseDto>> GetProfileByUserIdAsync(int userId)
        {
            try
            {
                var user = await _context.Userauthentications
                    .Include(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(u => u.Employee)
                        .ThenInclude(e => e.Employeedetailsmasters)
                            .ThenInclude(ed => ed.Department)
                    .Include(u => u.Employee)
                        .ThenInclude(e => e.Employeedetailsmasters)
                            .ThenInclude(ed => ed.Role)
                    .Include(u => u.Employee)
                        .ThenInclude(e => e.Addresses)
                    .FirstOrDefaultAsync(u => u.UserId == userId);

                if (user == null)
                {
                    return ApiResponseDto<ProfileResponseDto>.FailureResponse(Constants.Messages.UserNotFound);
                }

                var employee = user.Employee;
                var profile = employee?.Userprofile;

                if (profile == null)
                {
                    return ApiResponseDto<ProfileResponseDto>.FailureResponse("Profile not found");
                }

                var employeeDetails = employee.Employeedetailsmasters?.FirstOrDefault();
                var currentAddress = employee.Addresses?.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Current);
                var permanentAddress = employee.Addresses?.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Permanent);

                var response = MapToProfileResponse(profile, user.Email, employee, employeeDetails, currentAddress, permanentAddress);
                
                return ApiResponseDto<ProfileResponseDto>.SuccessResponse(response, "Profile retrieved successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error retrieving profile for UserId: {userId}", ex);
                return ApiResponseDto<ProfileResponseDto>.FailureResponse("An error occurred while retrieving profile");
            }
        }

        public async Task<ApiResponseDto<ProfileResponseDto>> UpdateProfileAsync(int userId, UpdateProfileRequestDto request)
{
    try
    {
        EEPZBusinessLog.Information($"Updating profile for UserId: {userId}");

        var user = await _context.Userauthentications
            .Include(u => u.Employee)
                .ThenInclude(e => e.Userprofile)
            .Include(u => u.Employee)
                .ThenInclude(e => e.Employeedetailsmasters)
                    .ThenInclude(ed => ed.Department)
            .Include(u => u.Employee)
                .ThenInclude(e => e.Employeedetailsmasters)
                    .ThenInclude(ed => ed.Role)
            .Include(u => u.Employee)
                .ThenInclude(e => e.Addresses)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
        {
            return ApiResponseDto<ProfileResponseDto>.FailureResponse(Constants.Messages.UserNotFound);
        }

        var employee = user.Employee;
        var profile = employee?.Userprofile;

        if (profile == null)
        {
            return ApiResponseDto<ProfileResponseDto>.FailureResponse("Profile not found");
        }

        // Update profile information
        if (request.FirstName != null) profile.FirstName = request.FirstName;
        if (request.MiddleName != null) profile.MiddleName = request.MiddleName;
        if (request.LastName != null) profile.LastName = request.LastName;
        if (request.CallingName != null) profile.CallingName = request.CallingName;
        if (request.Gender != null) profile.Gender = request.Gender;
        if (request.DateOfBirthOfficial.HasValue) profile.DateOfBirthOfficial = request.DateOfBirthOfficial;
        if (request.DateOfBirthActual.HasValue) profile.DateOfBirthActual = request.DateOfBirthActual;
        if (request.MobileNumber != null) profile.MobileNumber = request.MobileNumber;
        if (request.AlternateNumber != null) profile.AlternateNumber = request.AlternateNumber;
        if (request.PersonalEmail != null) profile.PersonalEmail = request.PersonalEmail;
        if (request.MaritalStatus != null) profile.MaritalStatus = request.MaritalStatus;
        if (request.Nationality != null) profile.Nationality = request.Nationality;

        await _userProfileRepository.UpdateAsync(profile);

        // Update Current Address
        if (request.CurrentAddress != null)
        {
            var currentAddress = employee.Addresses?.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Current);
            
            if (currentAddress != null)
            {
                // Update existing address
                currentAddress.DoorNumber = request.CurrentAddress.DoorNumber;
                currentAddress.Street = request.CurrentAddress.Street;
                currentAddress.Landmark = request.CurrentAddress.Landmark;
                currentAddress.Area = request.CurrentAddress.Area;
                currentAddress.City = request.CurrentAddress.City;
                currentAddress.State = request.CurrentAddress.State;
                currentAddress.Country = request.CurrentAddress.Country ?? "India";
                currentAddress.PinCode = request.CurrentAddress.PinCode;
                currentAddress.UpdatedAt = DateTime.UtcNow;

                _context.Addresses.Update(currentAddress);
            }
            else
            {
                // Create new address
                var newCurrentAddress = new Address
                {
                    EmployeeId = employee.EmployeeId,
                    AddressType = Constants.AddressTypes.Current,
                    DoorNumber = request.CurrentAddress.DoorNumber,
                    Street = request.CurrentAddress.Street,
                    Landmark = request.CurrentAddress.Landmark,
                    Area = request.CurrentAddress.Area,
                    City = request.CurrentAddress.City,
                    State = request.CurrentAddress.State,
                    Country = request.CurrentAddress.Country ?? "India",
                    PinCode = request.CurrentAddress.PinCode,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Addresses.AddAsync(newCurrentAddress);
            }
        }

        // Update Permanent Address
        if (request.PermanentAddress != null)
        {
            var permanentAddress = employee.Addresses?.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Permanent);
            
            if (permanentAddress != null)
            {
                // Update existing address
                permanentAddress.DoorNumber = request.PermanentAddress.DoorNumber;
                permanentAddress.Street = request.PermanentAddress.Street;
                permanentAddress.Landmark = request.PermanentAddress.Landmark;
                permanentAddress.Area = request.PermanentAddress.Area;
                permanentAddress.City = request.PermanentAddress.City;
                permanentAddress.State = request.PermanentAddress.State;
                permanentAddress.Country = request.PermanentAddress.Country ?? "India";
                permanentAddress.PinCode = request.PermanentAddress.PinCode;
                permanentAddress.UpdatedAt = DateTime.UtcNow;

                _context.Addresses.Update(permanentAddress);
            }
            else
            {
                // Create new address
                var newPermanentAddress = new Address
                {
                    EmployeeId = employee.EmployeeId,
                    AddressType = Constants.AddressTypes.Permanent,
                    DoorNumber = request.PermanentAddress.DoorNumber,
                    Street = request.PermanentAddress.Street,
                    Landmark = request.PermanentAddress.Landmark,
                    Area = request.PermanentAddress.Area,
                    City = request.PermanentAddress.City,
                    State = request.PermanentAddress.State,
                    Country = request.PermanentAddress.Country ?? "India",
                    PinCode = request.PermanentAddress.PinCode,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Addresses.AddAsync(newPermanentAddress);
            }
        }

        // Save all changes
        await _context.SaveChangesAsync();

        // Reload data to get updated addresses
        await _context.Entry(employee).Collection(e => e.Addresses).LoadAsync();

        var employeeDetails = employee.Employeedetailsmasters?.FirstOrDefault();
        var updatedCurrentAddress = employee.Addresses?.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Current);
        var updatedPermanentAddress = employee.Addresses?.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Permanent);

        var response = MapToProfileResponse(profile, user.Email, employee, employeeDetails, updatedCurrentAddress, updatedPermanentAddress);
        
        EEPZBusinessLog.Information($"Profile updated successfully for UserId: {userId}");

        return ApiResponseDto<ProfileResponseDto>.SuccessResponse(response, Constants.Messages.ProfileUpdatedSuccess);
    }
    catch (Exception ex)
    {
        EEPZBusinessLog.Error($"Error updating profile for UserId: {userId}", ex);
        return ApiResponseDto<ProfileResponseDto>.FailureResponse("An error occurred while updating profile");
    }
}


        private ProfileResponseDto MapToProfileResponse(
            Userprofile profile, 
            string email, 
            Employee employee,
            Employeedetailsmaster employeeDetails,
            Address currentAddress,
            Address permanentAddress)
        {
            return new ProfileResponseDto
            {
                ProfileId = profile.ProfileId,
                EmployeeId = profile.EmployeeId,
                EmployeeCompanyId = employee.EmployeeCompanyId,
                FirstName = profile.FirstName,
                MiddleName = profile.MiddleName,
                LastName = profile.LastName,
                CallingName = profile.CallingName,
                ReferredBy = profile.ReferredBy,
                Gender = profile.Gender,
                DateOfBirthOfficial = profile.DateOfBirthOfficial,
                DateOfBirthActual = profile.DateOfBirthActual,
                MobileNumber = profile.MobileNumber,
                AlternateNumber = profile.AlternateNumber,
                PersonalEmail = profile.PersonalEmail,
                Email = email,
                
                DepartmentName = employeeDetails?.Department?.DepartmentName,
                RoleName = employeeDetails?.Role?.RoleName,
                EmploymentType = employee?.EmploymentType,
                EmploymentStatus = employee?.EmploymentStatus,
                JoiningDate = employee?.JoiningDate,
                WorkLocation = employee?.WorkLocation,
                EmployeeType = employee?.EmployeeType,
                
                MaritalStatus = profile.MaritalStatus,
                Nationality = profile.Nationality,
                
                CurrentAddress = currentAddress != null ? new AddressDto
                {
                    AddressId = currentAddress.AddressId,
                    AddressType = currentAddress.AddressType,
                    DoorNumber = currentAddress.DoorNumber,
                    Street = currentAddress.Street,
                    Landmark = currentAddress.Landmark,
                    Area = currentAddress.Area,
                    City = currentAddress.City,
                    State = currentAddress.State,
                    Country = currentAddress.Country,
                    PinCode = currentAddress.PinCode
                } : null,
                
                PermanentAddress = permanentAddress != null ? new AddressDto
                {
                    AddressId = permanentAddress.AddressId,
                    AddressType = permanentAddress.AddressType,
                    DoorNumber = permanentAddress.DoorNumber,
                    Street = permanentAddress.Street,
                    Landmark = permanentAddress.Landmark,
                    Area = permanentAddress.Area,
                    City = permanentAddress.City,
                    State = permanentAddress.State,
                    Country = permanentAddress.Country,
                    PinCode = permanentAddress.PinCode
                } : null
            };
        }
    }
}
