namespace Relevantz.EEPZ.Common.Constants
{  
     // Approval user role context 
    public static class APPROVAL_USER_ROLE
    {
        public const string REQUESTER = "Requester";
        public const string APPROVER = "Approver";
        public const string GOAL_CREATOR = "GoalCreator";
        public const string GOAL_ASSIGNEE = "GoalAssignee";
        public const string POTENTIAL_APPROVER = "PotentialApprover";
        public const string OBSERVER = "Observer";
        public const string MANAGER = "Manager";

        public static readonly string[] ALL =
        {
            REQUESTER,
            APPROVER,
            GOAL_CREATOR,
            GOAL_ASSIGNEE,
            POTENTIAL_APPROVER,
            OBSERVER,
            MANAGER,
        };
    }
}