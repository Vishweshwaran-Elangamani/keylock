using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Constants;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Core.Service
{
    public class ProfileService : IProfileService
    {
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IUserAuthenticationRepository _userAuthRepository;
        private readonly IProfileImageRepository _profileImageRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IMapper _mapper;

        public ProfileService(
            IUserProfileRepository userProfileRepository,
            IUserAuthenticationRepository userAuthRepository,
            IEmployeeRepository employeeRepository,
            IProfileImageRepository profileImageRepository,
            IMapper mapper)
        {
            _userProfileRepository = userProfileRepository;
            _userAuthRepository = userAuthRepository;
            _employeeRepository = employeeRepository;
            _profileImageRepository = profileImageRepository;
            _mapper = mapper;
        }

        public async Task<ProfileResponseDto> GetProfileByUserIdAsync(int userId)
        {
            var user = await _userAuthRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException(ProfileConstants.Messages.UserNotFound);
            }

            var profile = await _userProfileRepository.GetByEmployeeIdAsync(user.EmployeeId);
            if (profile == null)
            {
                throw new KeyNotFoundException(ProfileConstants.Messages.ProfileNotFound);
            }

            // Get employee with addresses
            var employee = await _employeeRepository.GetByIdAsync(user.EmployeeId);
            var addresses = employee?.Addresses?.ToList() ?? new List<Address>();

            var currentAddress = addresses.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Current);
            var permanentAddress = addresses.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Permanent);

            var employeeDetails = user.Employee?.Employeedetailsmasters?.FirstOrDefault();

            // Create ProfileResponseDto with Mapster where applicable
            var response = new ProfileResponseDto
            {
                ProfileId = profile.ProfileId,
                EmployeeId = profile.EmployeeId,
                EmployeeCompanyId = user.Employee?.EmployeeCompanyId ?? string.Empty,
                FirstName = profile.FirstName,
                MiddleName = profile.MiddleName,
                LastName = profile.LastName,
                CallingName = profile.CallingName,
                ReferredBy = profile.ReferredBy,
                Gender = profile.Gender ?? string.Empty,
                DateOfBirthOfficial = profile.DateOfBirthOfficial,
                DateOfBirthActual = profile.DateOfBirthActual,
                MobileNumber = profile.MobileNumber,
                AlternateNumber = profile.AlternateNumber,
                PersonalEmail = profile.PersonalEmail,
                Email = user.Email,
                DepartmentName = employeeDetails?.Department?.DepartmentName,
                RoleName = employeeDetails?.Role?.RoleName,
                EmploymentType = user.Employee?.EmploymentType ?? string.Empty,
                EmploymentStatus = user.Employee?.EmploymentStatus ?? string.Empty,
                JoiningDate = user.Employee?.JoiningDate,
                WorkLocation = user.Employee?.WorkLocation,
                EmployeeType = user.Employee?.EmployeeType ?? string.Empty,
                MaritalStatus = profile.MaritalStatus,
                Nationality = profile.Nationality,
                CurrentAddress = currentAddress != null ? _mapper.Map<AddressDto>(currentAddress) : null,
                PermanentAddress = permanentAddress != null ? _mapper.Map<AddressDto>(permanentAddress) : null
            };

            // Get profile photo from MongoDB
            var profileImage = await _profileImageRepository.GetImageAsync(user.EmployeeId);
            if (profileImage != null && profileImage.ImageData != null)
            {
                response.ProfilePhotoBase64 = Convert.ToBase64String(profileImage.ImageData);
            }

            return response;
        }

        public async Task<ProfileResponseDto> UpdateProfileAsync(int userId, UpdateProfileRequestDto request)
        {
            var user = await _userAuthRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException(ProfileConstants.Messages.UserNotFound);
            }

            var profile = await _userProfileRepository.GetByEmployeeIdAsync(user.EmployeeId);
            if (profile == null)
            {
                throw new KeyNotFoundException(ProfileConstants.Messages.ProfileNotFound);
            }

            // Update profile fields
            if (!string.IsNullOrWhiteSpace(request.FirstName))
                profile.FirstName = request.FirstName;

            profile.MiddleName = request.MiddleName;

            if (!string.IsNullOrWhiteSpace(request.LastName))
                profile.LastName = request.LastName;

            profile.CallingName = request.CallingName;

            if (!string.IsNullOrWhiteSpace(request.Gender))
                profile.Gender = request.Gender;

            profile.DateOfBirthOfficial = request.DateOfBirthOfficial;
            profile.DateOfBirthActual = request.DateOfBirthActual;
            profile.MobileNumber = request.MobileNumber;
            profile.AlternateNumber = request.AlternateNumber;
            profile.PersonalEmail = request.PersonalEmail;
            profile.MaritalStatus = request.MaritalStatus;
            profile.Nationality = request.Nationality;

            await _userProfileRepository.UpdateAsync(profile);

            // Get employee with addresses for updating
            var employee = await _employeeRepository.GetByIdAsync(user.EmployeeId);
            if (employee != null)
            {
                var addresses = employee.Addresses?.ToList() ?? new List<Address>();

                // Handle Current Address using Mapster
                if (request.CurrentAddress != null)
                {
                    var currentAddress = addresses.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Current);

                    if (currentAddress != null)
                    {
                        // Use Mapster to update address
                        _mapper.Map(request.CurrentAddress, currentAddress);
                        currentAddress.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        // Create new address
                        var newAddress = _mapper.Map<Address>(request.CurrentAddress);
                        newAddress.EmployeeId = user.EmployeeId;
                        newAddress.AddressType = Constants.AddressTypes.Current;
                        newAddress.CreatedAt = DateTime.UtcNow;
                        employee.Addresses.Add(newAddress);
                    }
                }

                // Handle Permanent Address using Mapster
                if (request.PermanentAddress != null)
                {
                    var permanentAddress = addresses.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Permanent);

                    if (permanentAddress != null)
                    {
                        // Use Mapster to update address
                        _mapper.Map(request.PermanentAddress, permanentAddress);
                        permanentAddress.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        // Create new address
                        var newAddress = _mapper.Map<Address>(request.PermanentAddress);
                        newAddress.EmployeeId = user.EmployeeId;
                        newAddress.AddressType = Constants.AddressTypes.Permanent;
                        newAddress.CreatedAt = DateTime.UtcNow;
                        employee.Addresses.Add(newAddress);
                    }
                }

                // Save employee changes (which includes addresses)
                await _employeeRepository.UpdateAsync(employee);
            }

            // Handle Profile Photo
            if (request.ProfilePhoto != null)
            {
                using var memoryStream = new MemoryStream();
                await request.ProfilePhoto.CopyToAsync(memoryStream);
                var imageData = memoryStream.ToArray();

                await _profileImageRepository.UploadImageAsync(
                    user.EmployeeId,
                    imageData,
                    request.ProfilePhoto.FileName,
                    request.ProfilePhoto.ContentType
                );
            }

            EEPZBusinessLog.Information($"Profile updated for UserId: {userId}");

            return await GetProfileByUserIdAsync(userId);
        }
    }
}
