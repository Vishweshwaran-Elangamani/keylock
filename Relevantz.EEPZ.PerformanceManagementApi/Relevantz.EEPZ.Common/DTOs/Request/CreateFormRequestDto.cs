namespace Relevantz.EEPZ.Common.DTOs.Request

{

    public class CreateFormRequestDto

    {

        public string Name { get; set; } = null!;

        public string Type { get; set; } = null!; // "Self", "Manager", "HR Summary"

        public string DeliveryEnablement { get; set; } = null!; // "Delivery", "Enablement"

        public int CreatedBy { get; set; }

        public List<CompetencyDto> Competencies { get; set; } = new List<CompetencyDto>();

    }
 
    public class CompetencyDto

    {

        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public int? DisplayOrder { get; set; }

    }

}

 