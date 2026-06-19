---
type: Guide
tags: [testing, architecture, netarchtest, clean-architecture, dotnet]
---

# Architecture Tests (.NET)

Enforce clean architecture rules at test time using **NetArchTest**. One dedicated `*.ArchTests` project per module.

## Project Structure

```
Modules/{Module}/tests/{Module}.ArchTests/
├── TestInfrastructure.cs       # Ns + Assemblies constants
├── LayerDependency/            # Dependency direction rules
├── Conventions/                # Naming rules
└── ModuleBoundary/             # Cross-module isolation
```

## TestInfrastructure.cs

Centralise assembly references and namespace constants — all test files reference these, never hard-coded strings.

```csharp
internal static class Ns
{
    public const string Domain         = "MyApp.MyModule.Domain";
    public const string AppWrite       = "MyApp.MyModule.Application";
    public const string AppRead        = "MyApp.MyModule.Application.Read";
    public const string Infrastructure = "MyApp.MyModule.Infrastructure";
    public const string Web            = "MyApp.MyModule.Web";

    // Other modules (forbidden namespaces)
    public const string OtherDomain    = "MyApp.OtherModule.Domain";
    public const string OtherInfra     = "MyApp.OtherModule.Infrastructure";
    public const string OtherApp       = "MyApp.OtherModule.Application";
}

internal static class Assemblies
{
    public static readonly Assembly Domain         = typeof(SomeEntity).Assembly;
    public static readonly Assembly AppWrite       = typeof(SomeCommand).Assembly;
    public static readonly Assembly AppRead        = typeof(SomeQuery).Assembly;
    public static readonly Assembly Infrastructure = typeof(SomeDbContext).Assembly;
    public static readonly Assembly Web            = typeof(SomeEndpoint).Assembly;

    public static readonly Assembly[] All = [Domain, AppWrite, AppRead, Infrastructure, Web];
}
```

## Layer Dependency Tests

```csharp
[Fact]
public void Domain_ShouldNot_DependOn_Infrastructure() =>
    Types.InAssembly(Assemblies.Domain)
        .Should().NotHaveDependencyOn(Ns.Infrastructure)
        .GetResult().IsSuccessful.Should().BeTrue();

[Fact]
public void Web_ShouldNot_DependOn_Infrastructure() =>
    Types.InAssembly(Assemblies.Web)
        .Should().NotHaveDependencyOn(Ns.Infrastructure)
        .GetResult().IsSuccessful.Should().BeTrue();
```

Enforce: `Web → Application → Domain ← Infrastructure`

## Convention Tests

```csharp
[Fact]
public void Commands_ShouldReside_InApplicationWrite()
{
    foreach (var assembly in Assemblies.All)
    {
        var result = Types.InAssembly(assembly)
            .That().HaveNameEndingWith("Command")
            .Should().ResideInNamespace(Ns.AppWrite)
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: string.Join(", ", result.FailingTypeNames ?? []));
    }
}
```

Typical conventions checked: `*Command` → AppWrite, `*Query` → AppRead, `*Repository` interface → Domain, `*Repository` class → Infrastructure.

## Module Boundary Tests

```csharp
[Theory]
[InlineData(Ns.OtherDomain)]
[InlineData(Ns.OtherInfra)]
[InlineData(Ns.OtherApp)]
public void Module_ShouldNot_DependOn_OtherModuleInternals(string forbidden)
{
    foreach (var assembly in Assemblies.All)
    {
        Types.InAssembly(assembly)
            .Should().NotHaveDependencyOn(forbidden)
            .GetResult().IsSuccessful.Should().BeTrue(
                because: $"{assembly.GetName().Name} must not depend on {forbidden}");
    }
}
```

Only `*.Public.Client` and `*.IntegrationEvents` namespaces are allowed across module boundaries.

## Tips

- Use `string.Join(", ", result.FailingTypeNames ?? [])` in `because:` — makes failures actionable
- Iterate `Assemblies.All` in convention tests so a type in the wrong assembly is caught regardless of where it lands
- Add a new `[InlineData]` entry to boundary tests whenever a new module is introduced
