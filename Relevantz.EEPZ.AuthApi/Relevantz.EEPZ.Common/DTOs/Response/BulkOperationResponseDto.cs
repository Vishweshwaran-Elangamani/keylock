using System.Text.Json.Serialization;

namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class BulkOperationResponseDto
    {
        [JsonPropertyName("totalRecords")]
        public int TotalRecords { get; set; }
        
        [JsonPropertyName("successCount")]
        public int SuccessCount { get; set; }
        
        [JsonPropertyName("failureCount")]
        public int FailureCount { get; set; }
        
        [JsonPropertyName("errors")]
        public List<string> Errors { get; set; } = new List<string>();
        
        [JsonPropertyName("successfulUsers")]
        public List<SuccessfulUserDto> SuccessfulUsers { get; set; } = new List<SuccessfulUserDto>();
        
        [JsonPropertyName("message")]
        public string Message { get; set; }
    }
    
    public class SuccessfulUserDto
    {
        [JsonPropertyName("email")]
        public string Email { get; set; }
        
        [JsonPropertyName("firstName")]
        public string FirstName { get; set; }
        
        [JsonPropertyName("lastName")]
        public string LastName { get; set; }
        
        [JsonPropertyName("employeeCompanyId")]
        public string EmployeeCompanyId { get; set; }
        
        [JsonPropertyName("role")]
        public string Role { get; set; }
        
        [JsonPropertyName("department")]
        public string Department { get; set; }
    }
}
