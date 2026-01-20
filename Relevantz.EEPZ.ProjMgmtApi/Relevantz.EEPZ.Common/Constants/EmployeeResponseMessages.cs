using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Constants
{
    public static class EmployeeResponseMessages
    {
        public static class Codes
        {
            public const string EMPLOYEES_RETRIEVED_SUCCESS = "EMPLOYEES_RETRIEVED_SUCCESS";
            public const string EMPLOYEE_RETRIEVED_SUCCESS = "EMPLOYEE_RETRIEVED_SUCCESS";
            public const string DEPARTMENTS_RETRIEVED_SUCCESS = "DEPARTMENTS_RETRIEVED_SUCCESS";
            public const string BUSINESS_UNITS_RETRIEVED_SUCCESS = "BUSINESS_UNITS_RETRIEVED_SUCCESS";
            public const string RESOURCE_POOL_MAPPING_SUCCESS = "RESOURCE_POOL_MAPPING_SUCCESS";

            public const string EMPLOYEE_NOT_FOUND = "EMPLOYEE_NOT_FOUND";
            public const string EMPLOYEE_SEARCH_QUERY_REQUIRED = "EMPLOYEE_SEARCH_QUERY_REQUIRED";
            public const string DEPARTMENT_NOT_FOUND = "DEPARTMENT_NOT_FOUND";
            public const string INVALID_REQUEST = "INVALID_REQUEST";

            // Adding the INTERNAL_SERVER_ERROR code
            public const string INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR";
        }

        private static readonly Dictionary<string, string> Messages = new()
        {
            { Codes.EMPLOYEES_RETRIEVED_SUCCESS, "Employees retrieved successfully" },
            { Codes.EMPLOYEE_RETRIEVED_SUCCESS, "Employee retrieved successfully" },
            { Codes.DEPARTMENTS_RETRIEVED_SUCCESS, "Departments retrieved successfully" },
            { Codes.BUSINESS_UNITS_RETRIEVED_SUCCESS, "Business units retrieved successfully" },
            { Codes.RESOURCE_POOL_MAPPING_SUCCESS, "Employees mapped to resource pool successfully" },
            { Codes.EMPLOYEE_NOT_FOUND, "Employee not found" },
            { Codes.EMPLOYEE_SEARCH_QUERY_REQUIRED, "Search query is required" },
            { Codes.DEPARTMENT_NOT_FOUND, "Department not found" },
            { Codes.INVALID_REQUEST, "Invalid request" },

            // Adding the INTERNAL_SERVER_ERROR message
            { Codes.INTERNAL_SERVER_ERROR, "An internal server error occurred" }
        };

        public static string GetMessage(string code)
        {
            return Messages.TryGetValue(code, out var msg) ? msg : "Unknown response code";
        }
    }
}
