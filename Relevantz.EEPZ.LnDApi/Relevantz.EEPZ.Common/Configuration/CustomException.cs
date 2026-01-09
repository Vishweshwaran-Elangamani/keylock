namespace Relevantz.EEPZ.Common.Exceptions
{
    public class EEPZException : Exception
    {
        public EEPZException(string message) : base(message) { }
        public EEPZException(string message, Exception innerException) 
            : base(message, innerException) { }
    }

    public class DuplicateEntityException : EEPZException
    {
        public string EntityName { get; }
        public object EntityKey { get; }

        public DuplicateEntityException(string entityName, object entityKey) 
            : base($"Duplicate {entityName} found with key: {entityKey}")
        {
            EntityName = entityName;
            EntityKey = entityKey;
        }

        public DuplicateEntityException(string message) : base(message) { }
    }

    public class UnauthorizedAccessException : EEPZException
    {
        public UnauthorizedAccessException(string message) : base(message) { }
    }

    public class EntityNotFoundException : EEPZException
    {
        public EntityNotFoundException(string entityName, object entityId) 
            : base($"{entityName} with ID {entityId} not found") { }
        
        public EntityNotFoundException(string message) : base(message) { }
    }

    public class BusinessRuleViolationException : EEPZException
    {
        public BusinessRuleViolationException(string message) : base(message) { }
    }
}
