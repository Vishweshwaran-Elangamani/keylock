namespace Relevantz.EEPZ.Common.Enums
{
    public static class PromotionStatusConstants
    {
        public const string PendingHrApproval = "pending_hr_approval";
        
        // ✅ NEW: Status after HR approves
        public const string HrApproved = "hr_approved";
        
        // ✅ NEW: Waiting for Leadership approval
        public const string PendingLeadershipApproval = "pending_leadership_approval";
        
        public const string Approved = "approved";  // Final status
        public const string Rejected = "rejected";
    }
}
