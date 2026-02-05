namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class PaginationRequestDto
    {
        private const int MaxPageSize = 100;

        public int PageNumber { get; set; } = 1;

        private int _pageSize = 10;
        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
        }

        public string? SortBy { get; set; }
        public bool Descending { get; set; } = false;
        public string? Search { get; set; }
    }
}
