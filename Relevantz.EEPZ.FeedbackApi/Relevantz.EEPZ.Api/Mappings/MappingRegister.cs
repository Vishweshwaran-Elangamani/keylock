using Mapster;
using System.Reflection;


public static class MappingRegister
{
    public static void RegisterMappings()
    {
        TypeAdapterConfig.GlobalSettings.Scan(Assembly.GetExecutingAssembly());
    }
}
