using Mapster;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Mapping
{
    public static class MappingConfig
    {
        public static void RegisterMappings()
        {
            // ========== Entity to Response Mappings ==========
            
            // Userauthentication -> UserResponseDto
            TypeAdapterConfig<Userauthentication, UserResponseDto>
                .NewConfig()
                .Map(dest => dest.UserId, src => src.UserId)
                .Map(dest => dest.EmployeeId, src => src.EmployeeId)
                .Map(dest => dest.EmployeeCompanyId, src => src.Employee != null ? src.Employee.EmployeeCompanyId : string.Empty)
                .Map(dest => dest.Email, src => src.Email)
                .Map(dest => dest.Status, src => src.Status)
                .Map(dest => dest.IsFirstLogin, src => src.IsFirstLogin ?? false)
                .Map(dest => dest.LastLoginAt, src => src.LastLoginAt)
                .Map(dest => dest.EmploymentType, src => src.Employee != null ? src.Employee.EmploymentType : string.Empty)
                .Map(dest => dest.EmploymentStatus, src => src.Employee != null ? src.Employee.EmploymentStatus : string.Empty)
                .Map(dest => dest.JoiningDate, src => src.Employee != null ? src.Employee.JoiningDate : DateOnly.MinValue)
                .Map(dest => dest.ConfirmationDate, src => src.Employee != null ? src.Employee.ConfirmationDate : null)
                .Map(dest => dest.ExitDate, src => src.Employee != null ? src.Employee.ExitDate : null)
                .Map(dest => dest.WorkLocation, src => src.Employee != null ? src.Employee.WorkLocation : null)
                .Map(dest => dest.EmployeeType, src => src.Employee != null ? src.Employee.EmployeeType : string.Empty)
                .Map(dest => dest.NoticePeriodDays, src => src.Employee != null ? src.Employee.NoticePeriodDays ?? 0 : 0)
                .Map(dest => dest.IsActive, src => src.Employee != null && src.Employee.IsActive == true)
                .Map(dest => dest.FirstName, src => src.Employee != null && src.Employee.Userprofile != null ? src.Employee.Userprofile.FirstName : string.Empty)
                .Map(dest => dest.MiddleName, src => src.Employee != null && src.Employee.Userprofile != null ? src.Employee.Userprofile.MiddleName : null)
                .Map(dest => dest.LastName, src => src.Employee != null && src.Employee.Userprofile != null ? src.Employee.Userprofile.LastName : string.Empty)
                .Map(dest => dest.CallingName, src => src.Employee != null && src.Employee.Userprofile != null ? src.Employee.Userprofile.CallingName : null)
                .Map(dest => dest.Gender, src => src.Employee != null && src.Employee.Userprofile != null ? src.Employee.Userprofile.Gender : null)
                .Map(dest => dest.DateOfBirthOfficial, src => src.Employee != null && src.Employee.Userprofile != null ? src.Employee.Userprofile.DateOfBirthOfficial : null)
                .Map(dest => dest.MobileNumber, src => src.Employee != null && src.Employee.Userprofile != null ? src.Employee.Userprofile.MobileNumber : null)
                .Map(dest => dest.PersonalEmail, src => src.Employee != null && src.Employee.Userprofile != null ? src.Employee.Userprofile.PersonalEmail : null)
                .Map(dest => dest.RoleName, src => src.Employee != null && src.Employee.Employeedetailsmasters != null && src.Employee.Employeedetailsmasters.Any() ? src.Employee.Employeedetailsmasters.First().Role.RoleName : null)
                .Map(dest => dest.DepartmentId, src => src.Employee != null && src.Employee.Employeedetailsmasters != null && src.Employee.Employeedetailsmasters.Any() ? (int?)src.Employee.Employeedetailsmasters.First().DepartmentId : null)
                .Map(dest => dest.DepartmentName, src => src.Employee != null && src.Employee.Employeedetailsmasters != null && src.Employee.Employeedetailsmasters.Any() ? src.Employee.Employeedetailsmasters.First().Department.DepartmentName : null);

            // Changerequest -> ChangeRequestResponseDto
            TypeAdapterConfig<Changerequest, ChangeRequestResponseDto>
                .NewConfig()
                .Map(dest => dest.RequestId, src => src.RequestId)
                .Map(dest => dest.EmployeeId, src => src.EmployeeId)
                .Map(dest => dest.EmployeeCompanyId, src => src.Employee != null ? src.Employee.EmployeeCompanyId : string.Empty)
                .Map(dest => dest.EmployeeName, src => src.Employee != null && src.Employee.Userprofile != null 
                    ? $"{src.Employee.Userprofile.FirstName} {src.Employee.Userprofile.LastName}" 
                    : string.Empty)
                .Map(dest => dest.ChangeType, src => src.ChangeType)
                .Map(dest => dest.CurrentValue, src => src.CurrentValue)
                .Map(dest => dest.NewValue, src => src.NewValue)
                .Map(dest => dest.Reason, src => src.Reason)
                .Map(dest => dest.Status, src => src.Status)
                .Map(dest => dest.AdminRemarks, src => src.AdminRemarks)
                .Map(dest => dest.RequestedAt, src => src.RequestedAt)
                .Map(dest => dest.ProcessedAt, src => src.ProcessedAt);

            // Department -> DepartmentResponseDto
            TypeAdapterConfig<Department, DepartmentResponseDto>
                .NewConfig()
                .Map(dest => dest.DepartmentId, src => src.DepartmentId)
                .Map(dest => dest.DepartmentName, src => src.DepartmentName)
                .Map(dest => dest.DepartmentCode, src => src.DepartmentCode)
                .Map(dest => dest.Description, src => src.Description)
                .Map(dest => dest.Status, src => src.Status)
                .Map(dest => dest.ParentDepartmentId, src => src.ParentDepartmentId)
                .Map(dest => dest.ParentDepartmentName, src => src.ParentDepartment != null ? src.ParentDepartment.DepartmentName : null)
                .Map(dest => dest.HodEmployeeId, src => src.HodEmployeeId)
                .Map(dest => dest.HodEmployeeName, src => src.HodEmployee != null && src.HodEmployee.Userprofile != null 
                    ? $"{src.HodEmployee.Userprofile.FirstName} {src.HodEmployee.Userprofile.LastName}" 
                    : null)
                .Map(dest => dest.HodEmployeeCompanyId, src => src.HodEmployee != null ? src.HodEmployee.EmployeeCompanyId : null)
                .Map(dest => dest.BudgetAllocated, src => src.BudgetAllocated)
                .Map(dest => dest.CostCenter, src => src.CostCenter)
                .Map(dest => dest.CreatedAt, src => src.CreatedAt)
                .Map(dest => dest.UpdatedAt, src => src.UpdatedAt)
                .Map(dest => dest.ChildDepartmentCount, src => src.InverseParentDepartment.Count)
                .Map(dest => dest.HasChildren, src => src.InverseParentDepartment.Any());

            // Address -> AddressDto
            TypeAdapterConfig<Address, AddressDto>
                .NewConfig()
                .Map(dest => dest.AddressId, src => src.AddressId)
                .Map(dest => dest.AddressType, src => src.AddressType)
                .Map(dest => dest.DoorNumber, src => src.DoorNumber)
                .Map(dest => dest.Street, src => src.Street)
                .Map(dest => dest.Landmark, src => src.Landmark)
                .Map(dest => dest.Area, src => src.Area)
                .Map(dest => dest.City, src => src.City)
                .Map(dest => dest.State, src => src.State)
                .Map(dest => dest.Country, src => src.Country)
                .Map(dest => dest.PinCode, src => src.PinCode);

            // Role -> RoleResponseDto
            TypeAdapterConfig<Role, RoleResponseDto>
                .NewConfig()
                .Map(dest => dest.RoleId, src => src.RoleId)
                .Map(dest => dest.RoleName, src => src.RoleName)
                .Map(dest => dest.RoleCode, src => src.RoleCode)
                .Map(dest => dest.Description, src => src.Description)
                .Map(dest => dest.IsSystemRole, src => src.IsSystemRole ?? false)
                .Map(dest => dest.CreatedAt, src => src.CreatedAt)
                .Map(dest => dest.UpdatedAt, src => src.UpdatedAt);

            // ========== Request to Entity Mappings ==========
            
            // CreateUserRequestDto -> Employee
            TypeAdapterConfig<CreateUserRequestDto, Employee>
                .NewConfig()
                .Map(dest => dest.EmployeeCompanyId, src => src.EmployeeCompanyId)
                .Map(dest => dest.EmploymentType, src => src.EmploymentType)
                .Map(dest => dest.EmploymentStatus, src => src.EmploymentStatus)
                .Map(dest => dest.JoiningDate, src => src.JoiningDate)
                .Map(dest => dest.ConfirmationDate, src => src.ConfirmationDate)
                .Map(dest => dest.ReportingManagerEmployeeId, src => src.ReportingManagerEmployeeId)
                .Map(dest => dest.WorkLocation, src => src.WorkLocation)
                .Map(dest => dest.EmployeeType, src => src.EmployeeType)
                .Map(dest => dest.NoticePeriodDays, src => src.NoticePeriodDays)
                .Map(dest => dest.IsActive, src => true)
                .Map(dest => dest.CreatedAt, src => DateTime.UtcNow);

            // CreateUserRequestDto -> Userprofile
            TypeAdapterConfig<CreateUserRequestDto, Userprofile>
                .NewConfig()
                .Map(dest => dest.FirstName, src => src.FirstName)
                .Map(dest => dest.MiddleName, src => src.MiddleName)
                .Map(dest => dest.LastName, src => src.LastName)
                .Map(dest => dest.CallingName, src => src.CallingName)
                .Map(dest => dest.ReferredBy, src => src.ReferredBy)
                .Map(dest => dest.Gender, src => src.Gender)
                .Map(dest => dest.DateOfBirthOfficial, src => src.DateOfBirthOfficial)
                .Map(dest => dest.DateOfBirthActual, src => src.DateOfBirthActual)
                .Map(dest => dest.MobileNumber, src => src.MobileNumber)
                .Map(dest => dest.AlternateNumber, src => src.AlternateNumber)
                .Map(dest => dest.PersonalEmail, src => src.PersonalEmail);

            // CreateDepartmentRequestDto -> Department
            TypeAdapterConfig<CreateDepartmentRequestDto, Department>
                .NewConfig()
                .Map(dest => dest.DepartmentName, src => src.DepartmentName)
                .Map(dest => dest.DepartmentCode, src => src.DepartmentCode)
                .Map(dest => dest.Description, src => src.Description)
                .Map(dest => dest.Status, src => src.Status)
                .Map(dest => dest.ParentDepartmentId, src => src.ParentDepartmentId)
                .Map(dest => dest.HodEmployeeId, src => src.HodEmployeeId)
                .Map(dest => dest.BudgetAllocated, src => src.BudgetAllocated)
                .Map(dest => dest.CostCenter, src => src.CostCenter)
                .Map(dest => dest.CreatedAt, src => DateTime.UtcNow);

            // CreateRoleRequestDto -> Role
            TypeAdapterConfig<CreateRoleRequestDto, Role>
                .NewConfig()
                .Map(dest => dest.RoleName, src => src.RoleName)
                .Map(dest => dest.RoleCode, src => src.RoleCode)
                .Map(dest => dest.Description, src => src.Description)
                .Map(dest => dest.IsSystemRole, src => false)
                .Map(dest => dest.CreatedAt, src => DateTime.UtcNow);

            // UpdateAddressDto -> Address (for updating existing addresses)
            TypeAdapterConfig<UpdateAddressDto, Address>
                .NewConfig()
                .Map(dest => dest.DoorNumber, src => src.DoorNumber)
                .Map(dest => dest.Street, src => src.Street)
                .Map(dest => dest.Landmark, src => src.Landmark)
                .Map(dest => dest.Area, src => src.Area)
                .Map(dest => dest.City, src => src.City)
                .Map(dest => dest.State, src => src.State)
                .Map(dest => dest.Country, src => src.Country)
                .Map(dest => dest.PinCode, src => src.PinCode)
                .Map(dest => dest.UpdatedAt, src => DateTime.UtcNow);
        }
    }
}
