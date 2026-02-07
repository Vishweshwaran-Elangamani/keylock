namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request parameters for paginated API queries.
    /// </summary>
    public class PaginationRequestDto
    {
        private const int MaxPageSize = 100;

        /// <summary>Page number to retrieve (default = 1).</summary>
        public int PageNumber { get; set; } = 1;

        private int _pageSize = 10;

        /// <summary>Number of records per page (max = 100).</summary>
        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
        }

        /// <summary>Field name to sort by.</summary>
        public string? SortBy { get; set; }

        /// <summary>Sort direction (true = descending).</summary>
        public bool Descending { get; set; } = false;

        /// <summary>Search term for filtering results.</summary>
        public string? Search { get; set; }
    }
}
