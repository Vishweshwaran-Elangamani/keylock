using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Constants
{
    public static class EmployeeResponseMessages
    {
        public static class Codes
        {
            public const string EMPLOYEES_RETRIEVED_SUCCESS = "EMPLOYEES_RETRIEVED_SUCCESS";
            public const string MANAGERS_RETRIEVED_SUCCESS = "MANAGERS_RETRIEVED_SUCCESS";
            public const string EMPLOYEE_RETRIEVED_SUCCESS = "EMPLOYEE_RETRIEVED_SUCCESS";
            public const string EMPLOYEE_NOT_FOUND = "EMPLOYEE_NOT_FOUND";
            public const string EMPLOYEE_SEARCH_QUERY_REQUIRED = "EMPLOYEE_SEARCH_QUERY_REQUIRED";
            public const string DEPARTMENTS_RETRIEVED_SUCCESS = "DEPARTMENTS_RETRIEVED_SUCCESS";
            public const string DEPARTMENT_NOT_FOUND = "DEPARTMENT_NOT_FOUND";
            public const string BUSINESS_UNITS_RETRIEVED_SUCCESS = "BUSINESS_UNITS_RETRIEVED_SUCCESS";
            public const string RESOURCE_POOL_MAPPING_SUCCESS = "RESOURCE_POOL_MAPPING_SUCCESS";
            public const string INVALID_REQUEST = "INVALID_REQUEST";
        }

        private static readonly Dictionary<string, (string Code, string Message)> Messages =
            new Dictionary<string, (string, string)>
            {
                { Codes.EMPLOYEES_RETRIEVED_SUCCESS, (Codes.EMPLOYEES_RETRIEVED_SUCCESS, "Employees retrieved successfully") },
                { Codes.MANAGERS_RETRIEVED_SUCCESS, (Codes.MANAGERS_RETRIEVED_SUCCESS, "Managers retrieved successfully") },
                { Codes.EMPLOYEE_RETRIEVED_SUCCESS, (Codes.EMPLOYEE_RETRIEVED_SUCCESS, "Employee retrieved successfully") },
                { Codes.EMPLOYEE_NOT_FOUND, (Codes.EMPLOYEE_NOT_FOUND, "Employee not found") },
                { Codes.EMPLOYEE_SEARCH_QUERY_REQUIRED, (Codes.EMPLOYEE_SEARCH_QUERY_REQUIRED, "Search query is required") },
                { Codes.DEPARTMENTS_RETRIEVED_SUCCESS, (Codes.DEPARTMENTS_RETRIEVED_SUCCESS, "Departments retrieved successfully") },
                { Codes.DEPARTMENT_NOT_FOUND, (Codes.DEPARTMENT_NOT_FOUND, "Department not found") },
                { Codes.BUSINESS_UNITS_RETRIEVED_SUCCESS, (Codes.BUSINESS_UNITS_RETRIEVED_SUCCESS, "Business units retrieved successfully") },
                { Codes.RESOURCE_POOL_MAPPING_SUCCESS, (Codes.RESOURCE_POOL_MAPPING_SUCCESS, "Employees mapped to resource pool successfully") },
                { Codes.INVALID_REQUEST, (Codes.INVALID_REQUEST, "Invalid request") }
            };

        public static (string Code, string Message) GetMessage(string code)
        {
            return Messages.ContainsKey(code) ? Messages[code] : (code, "Unknown response code");
        }
    }
}
