# =========================
# BUILD STAGE
# =========================
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# --- API project ---
COPY Relevantz.EEPZ.InternalOpportunityAPI/Relevantz.EEPZ.Api/Relevantz.EEPZ.Api.csproj \
     Relevantz.EEPZ.InternalOpportunityAPI/Relevantz.EEPZ.Api/

# --- Module dependencies ---
COPY Relevantz.EEPZ.InternalOpportunityAPI/Relevantz.EEPZ.Common/Relevantz.EEPZ.Common.csproj \
     Relevantz.EEPZ.InternalOpportunityAPI/Relevantz.EEPZ.Common/

COPY Relevantz.EEPZ.InternalOpportunityAPI/Relevantz.EEPZ.Core/Relevantz.EEPZ.Core.csproj \
     Relevantz.EEPZ.InternalOpportunityAPI/Relevantz.EEPZ.Core/

COPY Relevantz.EEPZ.InternalOpportunityAPI/Relevantz.EEPZ.Data/Relevantz.EEPZ.Data.csproj \
     Relevantz.EEPZ.InternalOpportunityAPI/Relevantz.EEPZ.Data/

# --- Shared Auth (GLOBAL) ---
COPY Relevantz.EEPZ.Shared.Auth/Relevantz.EEPZ.Shared.Auth.csproj \
     Relevantz.EEPZ.Shared.Auth/

# Restore
RUN dotnet restore Relevantz.EEPZ.InternalOpportunityAPI/Relevantz.EEPZ.Api/Relevantz.EEPZ.Api.csproj

# Copy everything
COPY . .

# Publish
WORKDIR /src/Relevantz.EEPZ.InternalOpportunityAPI/Relevantz.EEPZ.Api
RUN dotnet publish -c Release -o /app/publish