FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY Relevantz.EEPZ.Api/Relevantz.EEPZ.Api.csproj Relevantz.EEPZ.Api/
RUN dotnet restore Relevantz.EEPZ.Api/Relevantz.EEPZ.Api.csproj
COPY . ./
WORKDIR /src/Relevantz.EEPZ.Api
RUN dotnet publish -c Release -o /app/publish
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5101
ENTRYPOINT ["dotnet", "Relevantz.EEPZ.Api.dll"]




