using System;

namespace Relevantz.EEPZ.Common.Enums
{
    public static class InternalOpportunitiesConstants
    {
        public static class NominationTypes
        {
            public const string EmployeeSelf = "employee_self";
            public const string ManagerNomination = "manager_nomination";
            public const string PeerNomination = "peer_nomination";
        }

        public static class OpportunityStatus
        {
            public const string Active = "Active";
            public const string Closed = "Closed";
        }

        public static class PromotionTypes
        {
            public const string RoleChange = "RoleChange";
            public const string Increment = "Increment";
        }
    }
}
