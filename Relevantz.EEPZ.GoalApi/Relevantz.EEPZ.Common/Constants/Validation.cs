namespace Relevantz.EEPZ.Common.Constants
{
    // Validation constants
    public static class VALIDATION
    {
        public const int MIN_CHECKLIST_ITEMS = 3;
        public const int MAX_CHECKLIST_ITEMS = 50;
        public const int MAX_CHECKLIST_TITLE_LENGTH = 200;
        public const int MIN_GOAL_TITLE_LENGTH = 3;
        public const int MAX_GOAL_TITLE_LENGTH = 200;
        public const int MAX_GOAL_DESCRIPTION_LENGTH = 5000;
        public const int MIN_GOAL_DESCRIPTION_LENGTH = 10;
        public const int MIN_COMMENT_LENGTH = 1;
        public const int MAX_COMMENT_LENGTH = 1000;
        public const int MIN_PROGRESS = 0;
        public const int MAX_PROGRESS = 100;
        public const int COMPLETION_PROGRESS_THRESHOLD = 100;
        public const int DEFAULT_PAGE_SIZE = 10;
        public const int MAX_PAGE_SIZE = 100;
        public const int MIN_PAGE_SIZE = 1;
        public const int DEFAULT_PAGE_NUMBER = 1;
        public const int MIN_DEADLINE_DAYS_FROM_NOW = 1;
        public const int MAX_DEADLINE_DAYS_FROM_NOW = 365;
        public const int MIN_PROOF_ATTACHMENTS = 1;
        public const int DESCRIPTION_SHORT_LENGTH = 80;

        public static bool IsValidProgress(int progress)
        {
            return progress >= MIN_PROGRESS && progress <= MAX_PROGRESS;
        }

        public static bool IsValidPageSize(int pageSize)
        {
            return pageSize >= MIN_PAGE_SIZE && pageSize <= MAX_PAGE_SIZE;
        }

        public static bool IsValidPageNumber(int pageNumber)
        {
            return pageNumber >= DEFAULT_PAGE_NUMBER;
        }

        public static bool IsValidGoalTitle(string title)
        {
            return !string.IsNullOrWhiteSpace(title)
                && title.Length >= MIN_GOAL_TITLE_LENGTH
                && title.Length <= MAX_GOAL_TITLE_LENGTH;
        }

        public static bool IsValidGoalDescription(string description)
        {
            return !string.IsNullOrWhiteSpace(description)
                && description.Length >= MIN_GOAL_DESCRIPTION_LENGTH
                && description.Length <= MAX_GOAL_DESCRIPTION_LENGTH;
        }

        public static bool IsValidComment(string comment)
        {
            return !string.IsNullOrWhiteSpace(comment)
                && comment.Length >= MIN_COMMENT_LENGTH
                && comment.Length <= MAX_COMMENT_LENGTH;
        }

        public static bool HasMinimumChecklistItems(int count)
        {
            return count >= MIN_CHECKLIST_ITEMS;
        }

        public static bool IsWithinMaxChecklistItems(int count)
        {
            return count <= MAX_CHECKLIST_ITEMS;
        }

        public static bool IsValidDeadline(DateTime deadline)
        {
            var now = DateTime.UtcNow;
            var minDeadline = now.AddDays(MIN_DEADLINE_DAYS_FROM_NOW);
            var maxDeadline = now.AddDays(MAX_DEADLINE_DAYS_FROM_NOW);
            return deadline >= minDeadline && deadline <= maxDeadline;
        }
    }
}
