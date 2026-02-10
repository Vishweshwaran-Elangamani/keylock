# Dependency-Scanning-Strategy
**Version:** 1.0  
**Author:** Team A
**Status:** Active  

## 1. Purpose
This document defines the manual dependency scanning process used to identify outdated or vulnerable third‑party libraries.  
Dependency-Scanning-Strategy gets updated every week.

## 2. Scan Commands Used
- Vulnerability scan:

--

dotnet list package --vulnerable

The given project `Relevantz.EEPZ.Api` has no vulnerable packages given the current sources.
The given project `Relevantz.EEPZ.Common` has no vulnerable packages given the current sources.
The given project `Relevantz.EEPZ.Core` has no vulnerable packages given the current sources.
The given project `Relevantz.EEPZ.Data` has no vulnerable packages given the current sources.
The given project `Relevantz.EEPZ.Api.Tests` has no vulnerable packages given the current sources.
The given project `Relevantz.EEPZ.Core.Tests` has no vulnerable packages given the current sources.
The given project `Relevantz.EEPZ.Data.Tests` has no vulnerable packages given the current sources.
The given project `Relevantz.EEPZ.Common.Tests` has no vulnerable packages given the current sources.

--

dotnet list package --outdated

Project `Relevantz.EEPZ.Api` has the following updates to its packages
   [net8.0]:
   Top-level Package                                     Requested   Resolved   Latest
   > Dapper                                              2.1.35      2.1.35     2.1.66
   > FluentValidation.AspNetCore                         11.3.0      11.3.0     11.3.1
   > FluentValidation.DependencyInjectionExtensions      11.11.0     11.11.0    12.1.1
   > MailKit                                             4.3.0       4.3.0      4.14.1
   > Microsoft.AspNetCore.Authentication.JwtBearer       8.0.0       8.0.0      10.0.2
   > Microsoft.EntityFrameworkCore                       9.0.10      9.0.10     10.0.2
   > Microsoft.EntityFrameworkCore.Design                9.0.10      9.0.10     10.0.2
   > Microsoft.EntityFrameworkCore.Relational            9.0.10      9.0.10     10.0.2
   > Serilog.AspNetCore                                  8.0.0       8.0.0      10.0.0
   > Serilog.Sinks.File                                  5.0.0       5.0.0      7.0.0
   > Swashbuckle.AspNetCore                              6.5.0       6.5.0      10.1.2
   > System.IdentityModel.Tokens.Jwt                     8.14.0      8.14.0     8.15.0

Project `Relevantz.EEPZ.Common` has the following updates to its packages
   [net8.0]:
   Top-level Package                           Requested   Resolved   Latest
   > FluentValidation                          11.11.0     11.11.0    12.1.1
   > Microsoft.AspNetCore.Http                 2.3.0       2.3.0      2.3.9
   > Microsoft.EntityFrameworkCore.Design      9.0.10      9.0.10     10.0.2

The given project `Relevantz.EEPZ.Core` has no updates given the current sources.
Project `Relevantz.EEPZ.Data` has the following updates to its packages
   [net8.0]:
   Top-level Package                               Requested   Resolved   Latest
   > Dapper                                        2.1.35      2.1.35     2.1.66
   > Microsoft.EntityFrameworkCore                 9.0.10      9.0.10     10.0.2
   > Microsoft.EntityFrameworkCore.Relational      9.0.10      9.0.10     10.0.2
   > Microsoft.EntityFrameworkCore.Tools           9.0.10      9.0.10     10.0.2
   > MySql.EntityFrameworkCore                     9.0.9       9.0.9      10.0.1

Project `Relevantz.EEPZ.Api.Tests` has the following updates to its packages
   [net8.0]:
   Top-level Package             Requested   Resolved   Latest
   > coverlet.collector          6.0.0       6.0.0      6.0.4
   > FluentAssertions            6.12.0      6.12.0     8.8.0
   > Microsoft.NET.Test.Sdk      17.8.0      17.8.0     18.0.1
   > Moq                         4.20.69     4.20.69    4.20.72
   > NUnit                       3.14.0      3.14.0     4.4.0
   > NUnit.Analyzers             3.9.0       3.9.0      4.11.2
   > NUnit3TestAdapter           4.5.0       4.5.0      6.1.0

Project `Relevantz.EEPZ.Core.Tests` has the following updates to its packages
   [net8.0]:
   Top-level Package             Requested   Resolved   Latest
   > coverlet.collector          6.0.0       6.0.0      6.0.4
   > Microsoft.NET.Test.Sdk      17.8.0      17.8.0     18.0.1
   > NUnit                       3.14.0      3.14.0     4.4.0
   > NUnit.Analyzers             3.9.0       3.9.0      4.11.2
   > NUnit3TestAdapter           4.5.0       4.5.0      6.1.0

Project `Relevantz.EEPZ.Data.Tests` has the following updates to its packages
   [net8.0]:
   Top-level Package             Requested   Resolved   Latest
   > coverlet.collector          6.0.0       6.0.0      6.0.4
   > Microsoft.NET.Test.Sdk      17.8.0      17.8.0     18.0.1
   > NUnit                       3.14.0      3.14.0     4.4.0
   > NUnit.Analyzers             3.9.0       3.9.0      4.11.2
   > NUnit3TestAdapter           4.5.0       4.5.0      6.1.0

Project `Relevantz.EEPZ.Common.Tests` has the following updates to its packages
   [net8.0]:
   Top-level Package             Requested   Resolved   Latest
   > coverlet.collector          6.0.0       6.0.0      6.0.4
   > Microsoft.NET.Test.Sdk      17.8.0      17.8.0     18.0.1
   > NUnit                       3.14.0      3.14.0     4.4.0
   > NUnit.Analyzers             3.9.0       3.9.0      4.11.2
   > NUnit3TestAdapter           4.5.0       4.5.0      6.1.0
