namespace Relevantz.EEPZ.Common.DTOs.Response;

public class CreateRewardTypeDto

{

    public string RewardCategory { get; set; }  

    public string RewardName { get; set; }

    public string Description { get; set; }

    public int? CreatedBy { get; set; }

}

public class UpdateRewardTypeDto

{

    public string RewardName { get; set; }

    public string Description { get; set; }

    public bool IsActive { get; set; }

}

public class CreateParameterDto

{

    public int RewardTypeId { get; set; }

    public string ParameterName { get; set; }

    public string ParameterType { get; set; }  

    public bool IsRequired { get; set; }

    public string PlaceholderText { get; set; }

    public int? MinimumValue { get; set; }

    public int? MaximumValue { get; set; }

    public int SortOrder { get; set; }

}

public class UpdateParameterDto

{

    public string ParameterName { get; set; }

    public string ParameterType { get; set; }

    public bool IsRequired { get; set; }

    public string PlaceholderText { get; set; }

    public int? MinimumValue { get; set; }

    public int? MaximumValue { get; set; }

    public int SortOrder { get; set; }

}

